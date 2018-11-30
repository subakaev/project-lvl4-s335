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

describe('User auth', () => {
  let server;

  beforeAll(() => {
    jest.addMatchers(matchers);
  });

  // If the function returns a promise or is a generator, Jest waits for that promise
  // to resolve before running tests.
  beforeEach(() => {
    server = app().listen();
    return sequelize.sync({ force: true, logging: false });
  });

  it('GET /logout 302', async () => {
    const res = await request.agent(server)
      .post('/session')
      .send({ _method: 'delete' });

    expect(res).toHaveHTTPStatus(302);
  });

  it('GET /session/new 200', async () => {
    const res = await request.agent(server)
      .get('/session/new');

    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /session 302 - correct authentication', async () => {
    const data = getFakeUserFormData();

    await User.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/session')
      .type('form')
      .send({ form: { userName: data.email, password: data.password }, errors: {} });

    expect(res).toHaveHTTPStatus(302);
  });

  it('POST /session 200 - failed login because empty form', async () => {
    const res = await request.agent(server)
      .post('/session')
      .type('form')
      .send({ form: { userName: '', password: '' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /session 200 - failed login because incorrect data', async () => {
    const data = getFakeUserFormData();

    await User.bulkCreate([data]);

    const res = await request.agent(server)
      .post('/session')
      .type('form')
      .send({ form: { userName: data.email, password: 'wrong' }, errors: {} });

    expect(res).toHaveHTTPStatus(200);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
