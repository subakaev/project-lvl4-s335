export default async (ctx, next) => {
  if (!ctx.state.user.isAuthenticated) {
    ctx.redirect('/session/new');
    return;
  }

  await next();
};
