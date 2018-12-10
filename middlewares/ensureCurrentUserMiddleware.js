import _ from 'lodash';

export default async (ctx, next) => {
  const userId = _.toNumber(ctx.params.id);

  if (userId !== ctx.state.user.id) {
    ctx.status = 403;
    return;
  }

  await next();
};
