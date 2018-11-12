import Koa from 'koa';
import Rollbar from 'rollbar';
import dotenv from 'dotenv';

dotenv.config();

const app = new Koa();

if (process.env.NODE_ENV === 'production') {
  const rollbar = new Rollbar(process.env.ROLLBAR_ACCESS_TOKEN);

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      rollbar.error(err, ctx.request);
    }
  });
}

app.use(async (ctx) => {
  ctx.body = 'Hello World';
});

app.listen(process.env.PORT || 3000);
