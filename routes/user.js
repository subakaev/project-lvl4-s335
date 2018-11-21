import _ from 'lodash';

import { User } from '../models';

export default (router) => {
  router.get('login', '/login', (ctx) => {
    ctx.render('auth/login');
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
      // ctx.flash.set('User has been created');
      ctx.redirect(router.url('root'));
    } catch (e) {
      ctx.render('auth/register', { form, errors: _.groupBy(e.errors, 'path') });
    }
  });

  router.get('users', '/users', (ctx) => {
    ctx.render('users/index');
  });
};
