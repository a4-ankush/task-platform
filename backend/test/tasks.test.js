const request = require('supertest');
const { createApp } = require('../src/app');

async function signupAndGetToken(app, email) {
  const res = await request(app).post('/api/auth/signup').send({
    email,
    name: 'Test',
    password: 'Password123!',
  });
  return res.body.accessToken;
}

describe('tasks', () => {
  test('create and list tasks', async () => {
    const app = createApp();
    const token = await signupAndGetToken(app, 'admin@example.com');

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'First task', status: 'todo' });

    expect(createRes.status).toBe(201);

    const listRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.items.length).toBe(1);
    expect(listRes.body.items[0].title).toBe('First task');
  });

  test('soft delete removes from list', async () => {
    const app = createApp();
    const token = await signupAndGetToken(app, 'admin@example.com');

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Delete me' });

    const id = createRes.body.id;

    const delRes = await request(app)
      .delete(`/api/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.body.items.length).toBe(0);
  });
});
