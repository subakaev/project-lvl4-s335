import ensureAuth from '../middlewares/ensureAuthMiddleware';

export default (router) => {
  router.get('tasks', '/tasks', ensureAuth, (ctx) => {
    ctx.render('tasks/index');
  });
};
