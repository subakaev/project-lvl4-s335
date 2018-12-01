import _ from 'lodash';

import ensureAuth from '../middlewares/ensureAuthMiddleware';

import { Task, TaskStatus } from '../models';

export default (router) => {
  router.get('tasks', '/tasks', ensureAuth, async (ctx) => {
    const tasks = await Task.findAll();

    ctx.render('tasks/index', { tasks });
  });

  router.get('newTask', '/tasks/new', ensureAuth, (ctx) => {
    ctx.render('tasks/newTask', { form: {}, errors: {} });
  });

  router.post('addTask', '/tasks', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    const status = await TaskStatus.findOne({ where: { name: 'New' } });

    const task = Task.build({
      ...form,
      statusId: status.id,
      creatorId: ctx.session.user.id,
    });

    console.log(task);

    try {
      await task.save();
      ctx.flash.set(`Task "${task.name}" has been created`);
      ctx.redirect(router.url('tasks'));
    } catch (e) {
      console.log(e);
      ctx.render('tasks/newTask', { form, errors: _.groupBy(e.errors, 'path') });
    }
  });

  router.get('editTask', '/tasks/:id/edit', (ctx) => {
    throw new Error('not implemented');
  });

  router.put('updateTask', '/tasks/:id', ensureAuth, (ctx) => {
    throw new Error('not implemented');
  });

  router.delete('deleteTask', '/tasks/:id', ensureAuth, async (ctx) => {
    const task = await Task.findById(ctx.params.id);

    await task.destroy();

    ctx.flash.set('Task has been deleted');
    ctx.redirect(router.url('tasks'));
  });
};
