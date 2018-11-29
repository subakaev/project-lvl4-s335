import request from 'supertest';
import matchers from 'jest-supertest-matchers';

import app from '..';

describe('requests', () => {
  let server;

  beforeAll(() => {
    jest.addMatchers(matchers);
  });

  beforeEach(() => {
    server = app().listen();
  });

  it('GET /profile 302 if not authenticated', async () => {
    const res = await request.agent(server)
      .get('/users/1/edit');

    expect(res).toHaveHTTPStatus(302);
  });

  it('GET /changePassword 302 if not authenticated', async () => {
    const res = await request.agent(server)
      .get('/users/1/password');

    expect(res).toHaveHTTPStatus(302);
  });

  it('GET /users 302 if not authenticated', async () => {
    const res = await request.agent(server)
      .get('/users');

    expect(res).toHaveHTTPStatus(302);
  });

  it('GET /tasks 302 if not authenticated', async () => {
    const res = await request.agent(server)
      .get('/tasks');

    expect(res).toHaveHTTPStatus(302);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
