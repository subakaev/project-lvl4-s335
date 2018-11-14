import Rollbar from 'rollbar';
import dotenv from 'dotenv';
import path from 'path';

import Koa from 'koa';
import Pug from 'koa-pug';
import serve from 'koa-static';

export default () => {
  dotenv.config();

  const app = new Koa();

  app.use(serve(path.join(__dirname, 'dist')));

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
    noCache: process.env.NODE_ENV === 'development',
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: {},
    basedir: __dirname,
    helperPath: [],
  });

  pug.use(app);

  app.use(async (ctx) => {
    await ctx.render('index');
  });

  return app;
};
