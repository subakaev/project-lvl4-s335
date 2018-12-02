import _ from 'lodash';

import ensureAuth from '../middlewares/ensureAuthMiddleware';

import {
  Task, TaskStatus, User, Tag,
} from '../models';

export default (router) => {
  router.get('tasks', '/tasks', ensureAuth, async (ctx) => {
    const tasks = await Task.findAll({ include: [{ all: true, nested: true }] });

    ctx.render('tasks/index', { tasks });
  });

  router.get('newTask', '/tasks/new', ensureAuth, async (ctx) => {
    const status = await TaskStatus.findOne({ where: { name: 'New' } });

    const users = await User.findAll();

    const tags = await Tag.findAll();

    const data = {
      form: {},
      errors: {},
      status,
      users,
      tags,
    };

    ctx.render('tasks/newTask', data);
  });

  router.post('addTask', '/tasks', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    const status = await TaskStatus.findOne({ where: { name: 'New' } });

    const users = await User.findAll();

    const tags = await Tag.findAll();

    const addedTags = await Tag.findAll({ where: { id: form.tags } });

    const task = Task.build({
      ...form,
      assignedToId: form.assignedToId === '0' ? null : form.assignedToId,
      creatorId: ctx.session.user.id,
    });

    try {
      await task.save();

      await task.addTags(addedTags);
      ctx.flash.set(`Task "${task.name}" has been created`);
      ctx.redirect(router.url('tasks'));
    } catch (e) {
      ctx.render('tasks/newTask', {
        form, status, users, tags, errors: _.groupBy(e.errors, 'path'),
      });
    }
  });

  router.get('editTask', '/tasks/:id/edit', async (ctx) => {
    const task = await Task.findById(ctx.params.id);

    ctx.render('tasks/editTask', { form: task, errors: {} });
  });

  router.put('updateTask', '/tasks/:id', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    const current = await Task.findById(ctx.params.id);

    try {
      await current.update(form);

      ctx.flash.set('Task has been updated');
      ctx.redirect(router.url('tasks'));
    } catch (e) {
      ctx.render('tasks/editTask', { form: { ...form, id: ctx.params.id }, errors: _.groupBy(e.errors, 'path') });
    }
  });

  router.delete('deleteTask', '/tasks/:id', ensureAuth, async (ctx) => {
    const task = await Task.findById(ctx.params.id);

    await task.destroy();

    ctx.flash.set('Task has been deleted');
    ctx.redirect(router.url('tasks'));
  });
};
