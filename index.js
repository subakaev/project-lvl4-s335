import Koa from 'koa';
import Rollbar from 'rollbar';

const rollbar = new Rollbar('POST_SERVER_ITEM_ACCESS_TOKEN');

const app = new Koa();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    rollbar.error(err, ctx.request);
  }
});

app.use(async (ctx) => {
  ctx.body = 'Hello World';
});

app.listen(process.env.PORT || 3000);
