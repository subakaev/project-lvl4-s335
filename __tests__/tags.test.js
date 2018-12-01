import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '..';
import { User, Tag, sequelize } from '../models';

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

describe('Tags CRUD', () => {
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
    cookies = await createSession(server, user);
  });

  it('GET /tags 200', async () => {
    const res = await request.agent(server)
      .get('/tags')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /tags/new 200', async () => {
    const res = await request.agent(server)
      .get('/tags/new')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /tags 302 - correct tag creation', async () => {
    const data = { name: 'tag1' };

    await Tag.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/tags')
      .set('Cookie', cookies)
      .type('form')
      .send({ form: { name: 'tag2' }, errors: {} });

    expect(res).toHaveHTTPStatus(302);
  });

  it('POST /tags 200 - failed tag creation if name is empty', async () => {
    const res = await request.agent(server)
      .post('/tags')
      .set('Cookie', cookies)
      .type('form')
      .send({ form: { name: '' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /tags 200 - failed tag creation if name is already exists', async () => {
    const data = { name: 'tag1' };

    await Tag.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/tags')
      .set('Cookie', cookies)
      .type('form')
      .send({ form: { name: data.name }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /tags/:id/edit 200', async () => {
    await Tag.bulkCreate([{ name: 'tag1' }]);

    const res = await request.agent(server)
      .get('/tags/1/edit')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /tags/:id 200 - failed tag update if name is empty', async () => {
    const data = { name: 'tag1' };

    await Tag.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/tags/1')
      .set('Cookie', cookies)
      .type('form')
      .send({ _method: 'put', form: { name: '' }, errors: {} });

    const tag = await Tag.findById(1);

    expect(res).toHaveHTTPStatus(200);

    expect(tag.name).toEqual(data.name);
  });

  it('PUT /tags/:id 200 - failed tag update if name is already exists', async () => {
    const data = { name: 'tag1' };

    await Tag.bulkCreate([data]);
    await Tag.bulkCreate([{ name: 'tag2' }]);

    const res = await request.agent(server)
      .post('/tags/1')
      .set('Cookie', cookies)
      .type('form')
      .send({ _method: 'put', form: { name: 'tag2' }, errors: {} });

    const tag = await Tag.findById(1);

    expect(res).toHaveHTTPStatus(200);

    expect(tag.name).toEqual(data.name);
  });

  it('PUT /tags/:id 302 - successful update', async () => {
    const data = { name: 'tag1' };

    await Tag.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/tags/1')
      .set('Cookie', cookies)
      .type('form')
      .send({ _method: 'put', form: { name: 'tag2' }, errors: {} });

    expect(res).toHaveHTTPStatus(302);

    const tag = await Tag.findById(1);

    expect(tag.name).toEqual('tag2');
  });

  it('DELETE deleteTag 200 - should delete tag', async () => {
    await Tag.bulkCreate([{ name: 'tag1' }]);

    const res = await request.agent(server)
      .delete('/tags/1')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(302);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
