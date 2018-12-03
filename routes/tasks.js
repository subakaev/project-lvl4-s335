import _ from 'lodash';

import ensureAuth from '../middlewares/ensureAuthMiddleware';

import {
  Task, TaskStatus, User, Tag,
} from '../models';

export default (router) => {
  router.get('tasks', '/tasks', ensureAuth, async (ctx) => {
    const tasks = await Task.findAll({ include: [{ all: true, nested: true }] });

    const filter = ctx.session.filter || {
      showMyTasks: false,
      statusId: null,
      assignedToId: null,
      tags: [],
    };

    const filtered = _
      .chain(tasks)
      .filter(x => ((filter.showMyTasks || false) ? x.creatorId === ctx.session.user.id : true))
      .filter(x => (filter.assignedToId ? `${x.assignedToId}` === filter.assignedToId : true))
      .filter(x => (filter.statusId ? `${x.statusId}` === filter.statusId : true))
      .filter(x => (filter.tags && filter.tags.length > 0
        ? _.some(filter.tags || [], item => _.includes(_.map(x.Tags, t => `${t.id}`), item))
        : true))
      .value();

    let filterDescription = `Show ${filter.showMyTasks ? 'only my tasks' : 'all users tasks'}`;

    if (filter.assignedToId) {
      const user = await User.findOne({ where: { id: filter.assignedToId } });
      filterDescription = `${filterDescription}, assigned to: ${user.email}`;
    }

    if (filter.statusId) {
      console.log(_.toNumber(filter.statusId));
      const status = await TaskStatus.findByPk(_.toNumber(filter.statusId));
      console.log(status);
      filterDescription = `${filterDescription}, with status: ${status.name}`;
    }

    if (filter.tags && filter.tags.length > 0) {
      const tags1 = await Tag.findAll({ where: { id: filter.tags } });

      const tagNames = _.map(tags1, x => x.name).join(',');
      filterDescription = `${filterDescription}, with tags: ${tagNames}`;
    }

    const statuses = await TaskStatus.findAll();
    const users = await User.findAll();
    const tags = await Tag.findAll();

    const model = {
      tasks: filtered,
      statuses,
      users,
      tags,
      form: filter,
      filterDescription,
    };

    ctx.render('tasks/index', model);
  });

  router.post('filterTasks', '/tasks/filter', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    ctx.session.filter = {
      showMyTasks: form.showMyTasks,
      statusId: form.statusId !== '0' ? form.statusId : null,
      assignedToId: form.assignedToId !== '0' ? form.assignedToId : null,
      tags: form.tags,
    };

    ctx.redirect(router.url('tasks'));
  });

  router.delete('clearTaskFilter', '/tasks/filter', ensureAuth, (ctx) => {
    ctx.session.filter = {
      showMyTasks: false,
      statusId: null,
      assignedToId: null,
      tags: [],
    };

    ctx.redirect(router.url('tasks'));
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
