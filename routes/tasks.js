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
    const task = await Task.findOne({
      where: { id: ctx.params.id },
      include: [{ all: true, nested: true }],
    });

    const statuses = await TaskStatus.findAll();

    const users = await User.findAll();

    const tags = await Tag.findAll();

    const data = {
      form: {
        id: task.id,
        name: task.name,
        description: task.description,
        statusId: task.TaskStatus.id,
        assignedToId: task.AssignedTo ? task.AssignedTo.id : null,
        tags: task.Tags.map(x => `${x.id}`),
      },
      statuses,
      users,
      tags,
      errors: {},
    };

    ctx.render('tasks/editTask', data);
  });

  router.put('updateTask', '/tasks/:id', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    const task = await Task.findOne({
      where: { id: ctx.params.id },
      include: [{ all: true, nested: true }],
    });

    const statuses = await TaskStatus.findAll();

    const users = await User.findAll();

    const tags = await Tag.findAll();

    const data = {
      form: {
        id: task.id,
        name: form.name,
        description: form.description,
        statusId: form.statusId,
        assignedToId: form.assignedToId && form.assignedToId !== '0' ? form.assignedToId : null,
        tags: form.tags,
      },
      statuses,
      users,
      tags,
    };

    try {
      await task.update(data.form);

      const taskTags = await task.getTags();

      if (taskTags.length > 0) {
        await task.removeTags(taskTags);
      }

      if (form.tags && form.tags.length > 0) {
        await task.setTags(data.form.tags);
      }

      ctx.flash.set('Task has been updated');
      ctx.redirect(router.url('tasks'));
    } catch (e) {
      ctx.render('tasks/editTask', { ...data, errors: _.groupBy(e.errors, 'path') });
    }
  });

  router.delete('deleteTask', '/tasks/:id', ensureAuth, async (ctx) => {
    const task = await Task.findById(ctx.params.id);

    await task.destroy();

    ctx.flash.set('Task has been deleted');
    ctx.redirect(router.url('tasks'));
  });
};
