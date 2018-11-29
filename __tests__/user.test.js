import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '..';
import { User, sequelize } from '../models';

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

describe('User auth', () => {
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

  it('GET /users 200', async () => {
    const res = await request.agent(server)
      .get('/users')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /users/:id/edit 200', async () => {
    const res = await request.agent(server)
      .get('/users/1/edit')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /changePassword 200', async () => {
    const res = await request.agent(server)
      .get('/users/1/password')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /changePassword 200 - failed: not correct current password', async () => {
    const res = await request.agent(server)
      .post('/users/1/password')
      .type('form')
      .set('Cookie', cookies)
      .send({ _method: 'put', form: { currentPassword: 'wrong', password: 'a', confirmPassword: 'a' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /users/1/password 200 - failed: not valid form', async () => {
    const res = await request.agent(server)
      .post('/users/1/password')
      .type('form')
      .set('Cookie', cookies)
      .send({ _method: 'put', form: { currentPassword: '', password: '', confirmPassword: '' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /users/1/password 302 - success', async () => {
    const res = await request.agent(server)
      .post('/users/1/password')
      .type('form')
      .set('Cookie', cookies)
      .send({ _method: 'put', form: { currentPassword: user.password, password: 'a', confirmPassword: 'a' }, errors: {} });

    expect(res).toHaveHTTPStatus(302);
  });

  it('DELETE /deleteUser 302 - success', async () => {
    const res = await request.agent(server)
      .post('/users/1')
      .set('Cookie', cookies)
      .send({ _method: 'delete' });

    expect(res).toHaveHTTPStatus(302);
  });

  it('PUT /profile 200 - not valid form', async () => {
    const res = await request.agent(server)
      .post('/users/1')
      .type('form')
      .set('Cookie', cookies)
      .send({ _method: 'put', form: { firstName: '', lastName: '' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /profile 302 - success', async () => {
    const expectedData = {
      firstName: 'changed first',
      lastName: 'changed last',
    };

    const res = await request.agent(server)
      .post('/users/1')
      .type('form')
      .set('Cookie', cookies)
      .send({ _method: 'put', form: expectedData, errors: {} });

    expect(res).toHaveHTTPStatus(302);

    const changed = await User.findOne({
      where: {
        email: user.email,
      },
    });

    expect(changed.firstName).toBe(expectedData.firstName);
    expect(changed.lastName).toBe(expectedData.lastName);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
