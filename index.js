import Rollbar from 'rollbar';
import dotenv from 'dotenv';
import path from 'path';

import Koa from 'koa';
import Pug from 'koa-pug';
import serve from 'koa-static';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';

import addRoutes from './routes';

export default () => {
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

  app.use(bodyParser());
  app.use(serve(path.join(__dirname, 'dist')));

  const router = new Router();

  addRoutes(router);

  app
    .use(router.routes())
    .use(router.allowedMethods());

  const pug = new Pug({
    viewPath: path.join(__dirname, '/src/views'),
    noCache: process.env.NODE_ENV === 'development',
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: {},
    basedir: path.join(__dirname, '/src/views'),
    helperPath: [
      { urlFor: (...args) => router.url(...args) },
    ],
  });

  pug.use(app);

  return app;
};
