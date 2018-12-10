import _ from 'lodash';

import { TaskStatus, User, Tag } from '../models';

export const getDefaultFilter = () => ({
  showMyTasks: false,
  statusId: null,
  assignedToId: null,
  tags: '',
});

export const getFilterFromFormData = form => ({
  showMyTasks: form.showMyTasks || false,
  statusId: form.statusId !== '0' ? _.toNumber(form.statusId) : null,
  assignedToId: form.assignedToId !== '0' ? _.toNumber(form.assignedToId) : null,
  tags: form.tags,
});

const filters = {
  byMe: (task, filter, creatorId) => {
    if (!filter.showMyTasks) {
      return true;
    }

    return task.creatorId === creatorId;
  },
  byAssignedTo: (task, filter) => {
    if (!filter.assignedToId) {
      return true;
    }

    return task.assignedToId === filter.assignedToId;
  },
  byStatus: (task, filter) => {
    if (!filter.statusId) {
      return true;
    }

    return task.statusId === filter.statusId;
  },
  byTags: (task, filter) => {
    if (!filter.tags || filter.tags.length === 0) {
      return true;
    }

    const parsedTagNames = filter.tags.split(',').map(x => x.trim()).filter(x => x);

    const taskTagNames = _.map(task.Tags, x => x.name);

    return _.some(parsedTagNames, tagName => _.includes(taskTagNames, tagName));
  },
};

export const applyFilter = (tasks, filter, creatorId) => _
  .chain(tasks)
  .filter(x => filters.byMe(x, filter, creatorId))
  .filter(x => filters.byAssignedTo(x, filter))
  .filter(x => filters.byStatus(x, filter))
  .filter(x => filters.byTags(x, filter))
  .value();

export const getFilterDescription = async (filter) => {
  let filterDescription = { showMyTasks: filter.showMyTasks };

  if (filter.assignedToId) {
    const user = await User.findByPk(filter.assignedToId);
    filterDescription = { ...filterDescription, assignedToName: user.email };
  }

  if (filter.statusId) {
    const status = await TaskStatus.findByPk(filter.statusId);
    filterDescription = { ...filterDescription, status: status.name };
  }

  if (filter.tags && filter.tags.length > 0) {
    const tags1 = await Tag.findAll({ where: { id: filter.tags } });
    const tagNames = _.map(tags1, x => x.name);
    filterDescription = { ...filterDescription, tagNames };
  }

  return filterDescription;
};
