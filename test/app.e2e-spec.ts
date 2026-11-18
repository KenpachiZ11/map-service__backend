import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { UserRole } from '../src/user/user-role.enum.js';
import { User } from '../src/user/user.entity.js';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/setup-app.js';

const unique = (): string =>
  `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

describe('Map Service (e2e)', () => {
  let app: INestApplication;
  let userRepo: {
    upsert: (...args: unknown[]) => Promise<unknown>;
    delete: (...args: unknown[]) => Promise<unknown>;
  };
  let adminToken: string;
  let managerToken: string;
  const adminLoginName = 'admin_test';
  const managerLoginName = 'manager_test';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    userRepo = app.get(getRepositoryToken(User));
    const adminPassword = await bcrypt.hash('777', 10);
    const managerPassword = await bcrypt.hash('111', 10);
    await userRepo.upsert(
      [
        {
          login: adminLoginName,
          password: adminPassword,
          role: UserRole.Admin,
          firstName: 'Test',
          lastName: 'Admin',
          access: true,
        },
        {
          login: managerLoginName,
          password: managerPassword,
          role: UserRole.Manager,
          firstName: 'Test',
          lastName: 'Manager',
          access: [],
        },
      ],
      ['login'],
    );

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: adminLoginName, password: '777' })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    const managerLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: managerLoginName, password: '111' })
      .expect(200);
    managerToken = managerLogin.body.accessToken;
  });

  afterAll(async () => {
    await userRepo.delete({ login: adminLoginName });
    await userRepo.delete({ login: managerLoginName });
    await app.close();
  });

  it('GET /api/v1 — информация о сервисе (публичный)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1')
      .expect(200);
    expect(response.body).toMatchObject({
      name: expect.any(String),
      environment: expect.any(String),
      version: expect.any(String),
    });
  });

  it('GET /api/v1/health — ok и индикатор БД', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.info.database.status).toBe('up');
  });

  it('POST /auth/register — роль user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        login: unique(),
        password: 'pass1234',
        firstName: 'New',
        lastName: 'User',
      })
      .expect(201);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.role).toBe('user');
  });

  it('POST /auth/login — неверный пароль → 401', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ login: adminLoginName, password: 'wrong' })
      .expect(401);
  });

  it('GET /auth/me — профиль текущего пользователя', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(response.body.login).toBe(adminLoginName);
    expect(response.body.role).toBe('admin');
    expect(response.body).not.toHaveProperty('password');
  });

  it('GET /users без токена → 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/users').expect(401);
  });

  it('GET /users — список доступен admin, без паролей', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const admin = response.body.find(
      (user: { login: string }) => user.login === adminLoginName,
    );
    expect(admin).toBeDefined();
    expect(admin).not.toHaveProperty('password');
  });

  it('GET /users под ролью user → 403', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${registered.body.accessToken}`)
      .expect(403);
  });

  it('GET /api/v1/users/activity — список активности (admin)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/users/activity')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const entry = response.body.find(
      (item: { login: string }) => item.login === adminLoginName,
    );
    expect(entry).toBeDefined();
    expect(entry.role).toBe('admin');
    expect(entry).toHaveProperty('lastActiveAt');
  });

  it('GET /api/v1/users/activity под ролью user → 403', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/users/activity')
      .set('Authorization', `Bearer ${registered.body.accessToken}`)
      .expect(403);
  });

  it('GET /api/v1/logs — журнал действий (admin)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const loginEntry = response.body.find(
      (l: { action: string; login: string }) =>
        l.action === 'login' && l.login === adminLoginName,
    );
    expect(loginEntry).toBeDefined();
    expect(loginEntry).toHaveProperty('createdAt');
  });

  it('GET /api/v1/logs под ролью user → 403', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/v1/logs')
      .set('Authorization', `Bearer ${registered.body.accessToken}`)
      .expect(403);
  });

  it('PATCH /users/:id — user обновляет свой firstName (200)', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234', firstName: 'Old' })
      .expect(201);
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/users/${registered.body.user.id}`)
      .set('Authorization', `Bearer ${registered.body.accessToken}`)
      .send({ firstName: 'NewName' })
      .expect(200);
    expect(updated.body.firstName).toBe('NewName');
  });

  it('PATCH /users/:id — user не может менять чужой профиль → 403', async () => {
    const first = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${second.body.user.id}`)
      .set('Authorization', `Bearer ${first.body.accessToken}`)
      .send({ firstName: 'Hacked' })
      .expect(403);
  });

  it('manager выдаёт доступы, но не может менять роль', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);
    const targetId: string = registered.body.user.id;
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${targetId}/access`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ access: ['maps:read'] })
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/users/${targetId}/role`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ role: 'admin' })
      .expect(403);
  });

  it('admin меняет роль зарегистрированного пользователя', async () => {
    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);
    const updated = await request(app.getHttpServer())
      .patch(`/api/v1/users/${registered.body.user.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'manager' })
      .expect(200);
    expect(updated.body.role).toBe('manager');
  });

  it('DELETE /users/:id — admin удаляет пользователя', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);
    const id: string = created.body.user.id;
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(app.getHttpServer())
      .get(`/api/v1/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('DELETE /users/:id — manager также может удалять', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ login: unique(), password: 'pass1234' })
      .expect(201);
    await request(app.getHttpServer())
      .delete(`/api/v1/users/${created.body.user.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(204);
  });
});
