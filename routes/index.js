import home from './home';
import user from './user';
import task from './task';
import tags from './tags';

const routes = [home, user, task, tags];

export default router => routes.forEach(x => x(router));
