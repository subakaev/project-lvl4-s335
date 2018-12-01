import home from './home';
import user from './users';
import task from './tasks';
import tags from './tags';

const routes = [home, user, task, tags];

export default router => routes.forEach(x => x(router));
