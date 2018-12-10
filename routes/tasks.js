import _ from 'lodash';

import ensureAuth from '../middlewares/ensureAuthMiddleware';

import {
  Task, TaskStatus, User, Tag,
} from '../models';

import {
  getDefaultFilter, getFilterFromFormData, applyFilter, getFilterDescription,
} from '../lib/taskFilter';

const getFilteredTags = async (tagsString = '') => {
  const parsedTagNames = tagsString.split(',').map(x => x.trim()).filter(x => x);

  const allTags = await Tag.findAll();

  const groupedTags = _.groupBy(allTags, x => x.name);

  const newTags = _
    .chain(parsedTagNames)
    .filter(x => !_.has(groupedTags, x))
    .map(x => ({ name: x }))
    .value();

  const existedTags = await Tag.findAll({ where: { name: parsedTagNames } });

  return { newTags, existedTags };
};

export default (router) => {
  router.get('tasks', '/tasks', ensureAuth, async (ctx) => {
    const tasks = await Task.findAll({ include: [{ all: true, nested: true }] });

    const filter = ctx.session.filter || getDefaultFilter();

    const filtered = applyFilter(tasks, filter, ctx.session.user.id);

    const filterDescription = await getFilterDescription(filter, ctx.session.user.name);

    const statuses = await TaskStatus.findAll();
    const users = await User.findAll();

    const model = {
      tasks: filtered,
      statuses,
      users,
      form: filter,
      filterDescription,
    };

    ctx.render('tasks/index', model);
  });

  router.post('filterTasks', '/tasks/filter', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    ctx.session.filter = getFilterFromFormData(form);

    ctx.redirect(router.url('tasks'));
  });

  router.delete('clearTaskFilter', '/tasks/filter', ensureAuth, (ctx) => {
    ctx.session.filter = getDefaultFilter();

    ctx.redirect(router.url('tasks'));
  });

  router.get('newTask', '/tasks/new', ensureAuth, async (ctx) => {
    const status = await TaskStatus.findOne({ where: { name: 'New' } });

    const users = await User.findAll();

    const data = {
      form: {},
      errors: {},
      status,
      users,
    };

    ctx.render('tasks/newTask', data);
  });

  router.post('addTask', '/tasks', ensureAuth, async (ctx) => {
    const { form } = ctx.request.body;

    const status = await TaskStatus.findOne({ where: { name: 'New' } });

    const users = await User.findAll();

    const task = Task.build({
      ...form,
      assignedToId: form.assignedToId === '0' ? null : form.assignedToId,
      creatorId: ctx.session.user.id,
    });

    try {
      await task.save();

      const { newTags, existedTags } = await getFilteredTags(form.tags);

      await task.addTags(existedTags);

      const addTagPromises = newTags.map(async x => task.createTag(x));

      await Promise.all(addTagPromises);

      ctx.flash.set(`Task "${task.name}" has been created`);
      ctx.redirect(router.url('tasks'));
    } catch (e) {
      console.log(e);
      ctx.render('tasks/newTask', {
        form, status, users, errors: _.groupBy(e.errors, 'path'),
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

    const data = {
      form: {
        id: task.id,
        name: task.name,
        description: task.description,
        statusId: task.TaskStatus.id,
        assignedToId: task.AssignedTo ? task.AssignedTo.id : null,
        tags: task.Tags.map(x => x.name).join(','),
      },
      statuses,
      users,
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

    const updateTaskData = {
      ...form,
      id: task.id,
      assignedToId: _.toNumber(form.assignedToId) > 0 ? form.assignedToId : null,
    };

    try {
      await task.update(updateTaskData);

      const taskTags = await task.getTags();

      if (taskTags.length > 0) {
        await task.removeTags(taskTags);
      }

      const { newTags, existedTags } = await getFilteredTags(form.tags);

      await task.addTags(existedTags);

      const addTagPromises = newTags.map(async x => task.createTag(x));

      await Promise.all(addTagPromises);

      ctx.flash.set('Task has been updated');
      ctx.redirect(router.url('tasks'));
    } catch (e) {
      const statuses = await TaskStatus.findAll();

      const users = await User.findAll();

      const tags = await Tag.findAll();

      const data = {
        form: updateTaskData,
        statuses,
        users,
        tags,
      };

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
