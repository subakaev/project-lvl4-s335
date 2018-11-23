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
    .post('/login')
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
      .get('/users');

    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /profile 200', async () => {
    const res = await request.agent(server)
      .get('/profile')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /changePassword 200', async () => {
    const res = await request.agent(server)
      .get('/changePassword')
      .set('Cookie', cookies);

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /changePassword 200 - failed: not correct current password', async () => {
    const res = await request.agent(server)
      .post('/changePassword')
      .type('form')
      .set('Cookie', cookies)
      .send({ _method: 'put', form: { currentPassword: 'wrong', password: 'a', confirmPassword: 'a' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /changePassword 200 - failed: not valid form', async () => {
    const res = await request.agent(server)
      .post('/changePassword')
      .type('form')
      .set('Cookie', cookies)
      .send({ _method: 'put', form: { currentPassword: '', password: '', confirmPassword: '' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('PUT /changePassword 302 - success', async () => {
    const res = await request.agent(server)
      .post('/changePassword')
      .type('form')
      .set('Cookie', cookies)
      .send({ _method: 'put', form: { currentPassword: user.password, password: 'a', confirmPassword: 'a' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
