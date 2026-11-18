import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = moduleRef.get(AppController);
    appService = moduleRef.get(AppService);
  });

  it('должен быть определён', () => {
    expect(appController).toBeDefined();
  });

  it('getInfo() делегирует вызов сервису', () => {
    const expected = appService.getInfo();
    expect(appController.getInfo()).toEqual(expected);
  });
});
