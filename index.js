import Rollbar from 'rollbar';
import dotenv from 'dotenv';
import path from 'path';

import Koa from 'koa';
import Pug from 'koa-pug';
import serve from 'koa-static';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import flash from 'koa-flash-simple';
import session from 'koa-session';
import methodOverride from 'koa-methodoverride';

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

  app.keys = ['some secret hurr'];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state = {
      flash: ctx.flash,
      isAuthenticated: () => ctx.session.userId !== undefined,
      currentUrl: ctx.url,
    };
    await next();
  });

  app.use(bodyParser());
  app.use(methodOverride((req) => {
    // return req?.body?._method;
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      return req.body._method; // eslint-disable-line
    }
    return null;
  }));
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
