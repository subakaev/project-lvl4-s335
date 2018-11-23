import _ from 'lodash';

import { User } from '../models';
import { encrypt } from '../lib/secure';
import { createValidationError } from '../lib/helpers';
import validateForm from '../lib/formValidators';

export default (router) => {
  router.get('logout', '/logout', (ctx) => {
    ctx.session.userId = undefined;
    ctx.redirect(router.url('login'));
  });

  router.get('login', '/login', (ctx) => {
    ctx.render('auth/login', { form: {}, errors: {} });
  });

  router.post('login', '/login', async (ctx) => {
    const { form } = ctx.request.body;

    const result = validateForm('login', form);

    if (result) {
      ctx.render('auth/login', { form, errors: result });
      return;
    }

    const user = await User.findOne({
      where: {
        email: form.userName,
      },
    });

    if (user && user.passwordDigest === encrypt(form.password)) {
      ctx.session.userId = user.id;
      ctx.session.userName = user.email;
      ctx.redirect(router.url('root'));
      return;
    }

    const data = { form, errors: createValidationError('summary', 'User name or password is incorrect') };

    ctx.render('auth/login', data);
  });

  router.get('register', '/register', (ctx) => {
    ctx.render('auth/register', { form: {}, errors: {} });
  });

  router.post('register', '/register', async (ctx) => {
    const { form } = ctx.request.body;

    const user = User.build(form);

    if (form.password !== form.confirmPassword) {
      const data = { form, errors: createValidationError('confirmPassword', 'Passwords not match.') };
      ctx.render('auth/register', data);
      return;
    }

    try {
      await user.save();
      ctx.flash.set('User has been created');
      ctx.redirect(router.url('root'));
    } catch (e) {
      ctx.render('auth/register', { form, errors: _.groupBy(e.errors, 'path') });
    }
  });

  router.get('users', '/users', async (ctx) => {
    if (!ctx.state.isAuthenticated()) {
      ctx.redirect(router.url('login'));
      return;
    }

    const users = await User.findAll();
    ctx.render('users/index', { users });
  });

  router.get('profile', '/profile', async (ctx) => {
    if (!ctx.state.isAuthenticated()) {
      ctx.redirect(router.url('login'));
      return;
    }

    const user = await User.findById(ctx.session.userId);

    ctx.render('users/profile', { user });
  });

  router.put('profile', '/profile', async (ctx) => {
    const { user } = ctx.request.body;

    const validationResult = validateForm('updateProfile', user);

    const current = await User.findById(ctx.session.userId);

    if (validationResult) {
      ctx.render('users/profile', { user: { ...current, ...user }, errors: validationResult });
      return;
    }

    await current.update(user);

    ctx.flash.set('User profile has been changed');
    ctx.redirect(router.url('login'));
  });

  router.get('changePassword', '/changePassword', async (ctx) => {
    if (!ctx.state.isAuthenticated()) {
      ctx.redirect(router.url('login'));
      return;
    }

    ctx.render('users/changePassword', { form: {}, errors: {} });
  });

  router.put('changePassword', '/changePassword', async (ctx) => {
    const { form } = ctx.request.body;

    const validatonResult = validateForm('changePassword', form);

    if (validatonResult) {
      ctx.render('users/changePassword', { form: {}, errors: validatonResult });
      return;
    }

    if (form.password !== form.confirmPassword) {
      ctx.render('users/changePassword', { form: {}, errors: createValidationError('confirmPassword', 'Passwords not match') });
      return;
    }

    if (form.currentPassword === form.password) {
      ctx.render('users/changePassword', { form: {}, errors: createValidationError('password', 'Password can be different') });
      return;
    }

    const user = await User.findById(ctx.session.userId);

    if (user.passwordDigest !== encrypt(form.currentPassword)) {
      ctx.render('users/changePassword', { form: {}, errors: createValidationError('currentPassword', 'Incorrect password') });
      return;
    }

    await user.update({ passwordDigest: encrypt(form.password) });

    ctx.flash.set('Password has been changed');
    ctx.redirect(router.url('root'));
  });

  router.delete('deleteUser', '/deleteUser', async (ctx) => {
    const user = await User.findById(ctx.session.userId);

    await user.destroy();

    ctx.session.userId = undefined;
    ctx.flash.set('User has been deleted');
    ctx.redirect(router.url('root'));
  });
};
