import home from './home';
import user from './user';
import task from './task';

const routes = [home, user, task];

export default router => routes.forEach(x => x(router));
