export default (router) => {
  router.get('root', '/', (ctx) => {
    ctx.render('index');
  });

  router.get('login', '/login', (ctx) => {
    ctx.render('auth/login');
  });
  router.get('register', '/register', (ctx) => {
    ctx.render('auth/register');
  });

  router.get('users', '/users', (ctx) => {
    ctx.render('users/index');
  });

  router.get('tasks', '/tasks', (ctx) => {
    ctx.render('tasks/index');
  });
};
