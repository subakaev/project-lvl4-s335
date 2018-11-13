import Koa from 'koa';
import Pug from 'koa-pug';
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

const pug = new Pug({
  viewPath: './src/views',
  debug: false,
  pretty: false,
  compileDebug: false,
  locals: {},
  basedir: __dirname,
  helperPath: [],
});

pug.use(app);

app.use(async (ctx) => {
  await ctx.render('index');
});

app.listen(process.env.PORT || 3000);
