import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service.js';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [AppService],
    }).compile();

    service = moduleRef.get(AppService);
  });

  it('должен быть определён', () => {
    expect(service).toBeDefined();
  });

  it('getInfo() возвращает корректную структуру данных', () => {
    const info = service.getInfo();

    expect(info).toEqual({
      name: expect.any(String),
      description: expect.any(String),
      environment: expect.any(String),
      version: expect.any(String),
    });
  });

  it('getInfo() содержит название сервиса из конфигурации', () => {
    const info = service.getInfo();
    expect(info.name.length).toBeGreaterThan(0);
  });
});
