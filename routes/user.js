import _ from 'lodash';
import validator from 'validate.js';

import { User } from '../models';

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

    const constraints = {
      userName: {
        presence: true,
        length: {
          minimum: 1,
          tooShort: { message: 'User name cannot be empty' },
        },
      },
      password: {
        presence: true,
        length: {
          minimum: 1,
          tooShort: { message: 'Password cannot be empty' },
        },
      },
    };

    const result = validator.validate(form, constraints);

    if (result) {
      ctx.render('auth/login', { form, errors: result });
      return;
    }

    const user = await User.findOne({
      where: {
        email: form.userName,
      },
    });

    if (user && user.password === form.password) {
      ctx.session.userId = user.id;
      ctx.redirect(router.url('root'));
      return;
    }

    ctx.render('auth/login', { form: {}, errors: { summary: [{ message: 'User name or password is incorrect' }] } });
  });

  router.get('register', '/register', (ctx) => {
    ctx.render('auth/register', { form: {}, errors: {} });
  });

  router.post('register', '/register', async (ctx) => {
    const { form } = ctx.request.body;

    const user = User.build(form);

    if (form.password !== form.confirmPassword) {
      ctx.render('auth/register', { form, errors: { confirmPassword: [{ message: 'Passwords not match.' }] } });
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
    const users = await User.findAll();
    ctx.render('users/index', { users });
  });

  router.get('profile', '/profile', async (ctx) => {
    const user = await User.findById(ctx.session.userId);

    ctx.render('users/profile', { user });
  });

  router.get('changePassword', '/changePassword', async (ctx) => {
    const user = await User.findById(ctx.session.userId);

    ctx.render('users/changePassword', { form: {}, errors: {} });
  });
};
