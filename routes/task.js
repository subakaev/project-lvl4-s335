export default (router) => {
  router.get('tasks', '/tasks', (ctx) => {
    if (!ctx.state.isAuthenticated()) {
      ctx.redirect(router.url('login'));
      return;
    }

    ctx.render('tasks/index');
  });
};
