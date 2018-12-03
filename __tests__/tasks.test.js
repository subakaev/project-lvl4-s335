import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '..';
import {
  User, Task, TaskStatus, sequelize,
} from '../models';

const getFakeUserFormData = () => {
  const password = faker.internet.password();
  return {
    email: faker.internet.email(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    password,
    confirmPassword: password,
  };
};

const createSession = async (server, user) => {
  const res = await request.agent(server)
    .post('/session')
    .type('form')
    .send({ form: { userName: user.email, password: user.password }, errors: {} });

  return res
    .headers['set-cookie']
    .map(item => item.split(';')[0]);
};

describe('Tasks CRUD', () => {
  let server;
  let user;
  let cookies;

  beforeAll(() => {
    jest.addMatchers(matchers);
  });

  // If the function returns a promise or is a generator, Jest waits for that promise
  // to resolve before running tests.
  beforeEach(async () => {
    server = app().listen();
    await sequelize.sync({ force: true, logging: false });
    user = getFakeUserFormData();
    await User.bulkCreate([user]);

    await TaskStatus.bulkCreate([{ name: 'New' }]);

    cookies = await createSession(server, user);
  });

  it('GET /tasks 200', async () => {
    const res = await request.agent(server)
      .get('/tasks')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /tasks/filter 302', async () => {
    const res = await request.agent(server)
      .post('/tasks/filter')
      .set('Cookie', cookies)
      .type('form')
      .send({ form: { showMyTasks: true }, errors: {} });

    expect(res).toHaveHTTPStatus(302);
  });

  it('DELETE /tasks/filter 302', async () => {
    const res = await request.agent(server)
      .delete('/tasks/filter')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(302);
  });

  it('GET /tasks/new 200', async () => {
    const res = await request.agent(server)
      .get('/tasks/new')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /tasks 302 - correct task creation', async () => {
    const data = { name: 'task1', statusId: 1, creatorId: 1 };

    await Task.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/tasks')
      .set('Cookie', cookies)
      .type('form')
      .send({ form: { name: 'task2', statusId: 1 }, errors: {} });

    expect(res).toHaveHTTPStatus(302);
  });

  it('POST /tasks 200 - failed task creation if name is empty', async () => {
    const res = await request.agent(server)
      .post('/tasks')
      .set('Cookie', cookies)
      .type('form')
      .send({ form: { name: '' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /tasks/:id/edit 200', async () => {
    await Task.bulkCreate([{ name: 'task1', statusId: 1, creatorId: 1 }]);

    const res = await request.agent(server)
      .get('/tasks/1/edit')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /tasks/:id 200 - failed task update if name is empty', async () => {
    const data = { name: 'task1', statusId: 1, creatorId: 1 };

    await Task.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/tasks/1')
      .set('Cookie', cookies)
      .type('form')
      .send({ _method: 'put', form: { name: '' }, errors: {} });

    const task = await Task.findById(1);

    expect(res).toHaveHTTPStatus(200);

    expect(task.name).toEqual(data.name);
  });

  it('PUT /tasks/:id 302 - successful update', async () => {
    const data = {
      name: 'task1',
      statusId: 1,
      creatorId: 1,
      tags: [],
    };

    await Task.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/tasks/1')
      .set('Cookie', cookies)
      .type('form')
      .send({ _method: 'put', form: { ...data, name: 'task2' }, errors: {} });

    expect(res).toHaveHTTPStatus(302);

    const task = await Task.findById(1);

    expect(task.name).toEqual('task2');
  });

  it('DELETE deleteTask 200 - should delete task', async () => {
    await Task.bulkCreate([{ name: 'tag1', statusId: 1, creatorId: 1 }]);

    const res = await request.agent(server)
      .delete('/tasks/1')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(302);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
