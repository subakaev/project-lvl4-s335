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

describe('User registration', () => {
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

  it('GET /users/new 200', async () => {
    const res = await request.agent(server)
      .get('/users/new');

    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /users 302 - correct registration', async () => {
    const formData = getFakeUserFormData();

    expect(await User.count()).toBe(0);

    const res = await request.agent(server)
      .post('/users')
      .type('form')
      .send({ form: formData, errors: {} });

    expect(res).toHaveHTTPStatus(302);

    const users = await User.findAll();

    expect(users.length).toBe(1);
    expect(users[0].email).toBe(formData.email);
  });

  it('POST /users 200 - not valid form data', async () => {
    const res = await request.agent(server)
      .post('/users')
      .type('form')
      .send({ form: { email: '' }, errors: {} });

    expect(await User.count()).toBe(0);

    expect(res).toHaveHTTPStatus(200);
  });

  it('POST /users 200 - user already exists', async () => {
    const formData = getFakeUserFormData();

    const user = User.build(formData);

    await user.save();

    const res = await request.agent(server)
      .post('/users')
      .type('form')
      .send({ form: formData, errors: {} });

    expect(res).toHaveHTTPStatus(200);

    expect(await User.count()).toBe(1);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
