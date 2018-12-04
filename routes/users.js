import _ from 'lodash';

import { User } from '../models';
import { encrypt } from '../lib/secure';
import { createValidationError } from '../lib/helpers';
import validateForm from '../lib/formValidators';

import ensureAuth from '../middlewares/ensureAuthMiddleware';

import { getDefaultFilter } from '../lib/taskFilter';

export default (router) => {
  router.get('newSession', '/session/new', (ctx) => {
    ctx.render('auth/login', { form: {}, errors: {} });
  });

  router.post('session', '/session', async (ctx) => {
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
      ctx.session.user = {
        isAuthenticated: true,
        id: user.id,
        name: user.email,
      };
      ctx.redirect(router.url('root'));
      return;
    }

    const data = { form, errors: createValidationError('summary', 'User name or password is incorrect') };

    ctx.render('auth/login', data);
  });

  router.delete('session', '/session', (ctx) => {
    ctx.session.user = { isAuthenticated: false };
    ctx.session.filter = getDefaultFilter();
    ctx.redirect(router.url('root'));
  });

  router.get('newUser', '/users/new', (ctx) => {
    ctx.render('auth/register', { form: {}, errors: {} });
  });

  router.post('users', '/users', async (ctx) => {
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

  router.get('users', '/users', ensureAuth, async (ctx) => {
    const users = await User.findAll();
    ctx.render('users/index', { users });
  });

  router.get('profile', '/users/:id/edit', ensureAuth, async (ctx) => {
    const user = await User.findById(ctx.session.user.id);

    const form = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    ctx.render('users/profile', { form, errors: {} });
  });

  router.put('updateProfile', '/users/:id', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    const validationResult = validateForm('updateProfile', form);

    const current = await User.findById(ctx.session.user.id);

    if (validationResult) {
      ctx.render('users/profile', { form, errors: validationResult });
      return;
    }

    await current.update(form);

    ctx.flash.set('User profile has been changed');
    ctx.redirect(router.url('root'));
  });

  router.get('changePassword', '/users/:id/password', ensureAuth, async (ctx) => {
    ctx.render('users/changePassword', { form: {}, errors: {} });
  });

  router.put('changePassword', '/users/:id/password', ensureAuth, async (ctx) => {
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

    const user = await User.findById(ctx.session.user.id);

    if (user.passwordDigest !== encrypt(form.currentPassword)) {
      ctx.render('users/changePassword', { form: {}, errors: createValidationError('currentPassword', 'Incorrect password') });
      return;
    }

    await user.update({ passwordDigest: encrypt(form.password) });

    ctx.flash.set('Password has been changed');
    ctx.redirect(router.url('root'));
  });

  router.delete('deleteUser', '/users/:id', ensureAuth, async (ctx) => {
    const user = await User.findById(ctx.session.user.id);

    await user.destroy();

    ctx.session.user = { isAuthenticated: false };

    ctx.flash.set('User has been deleted');

    ctx.redirect(router.url('root'));
  });
};
