const request = require('supertest');
const { createApp } = require('../src/app');

describe('auth', () => {
  test('signup creates first user as admin and returns access token', async () => {
    const app = createApp();

    const res = await request(app).post('/api/auth/signup').send({
      email: 'admin@example.com',
      name: 'Admin',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user.role).toBe('admin');
  });

  test('login works after signup', async () => {
    const app = createApp();

    await request(app).post('/api/auth/signup').send({
      email: 'user@example.com',
      name: 'User',
      password: 'Password123!',
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.headers['set-cookie']).toBeTruthy();
  });
});
