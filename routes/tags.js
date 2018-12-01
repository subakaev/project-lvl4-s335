import ensureAuth from '../middlewares/ensureAuthMiddleware';

export default (router) => {
  router.get('tags', '/tags', ensureAuth, (ctx) => {
    ctx.body = 'not implemented';
  });

  router.get('newTag', '/tags/new', ensureAuth, (ctx) => {
    ctx.body = 'not implemented';
  });

  router.post('tags', '/tags', ensureAuth, (ctx) => {
    ctx.body = 'not implemented';
  });

  router.put('tags', '/tags', ensureAuth, (ctx) => {
    ctx.body = 'not implemented';
  });

  router.delete('tags', '/tags', ensureAuth, (ctx) => {
    ctx.body = 'not implemented';
  });
};
