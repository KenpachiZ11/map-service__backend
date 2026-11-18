import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { APP_DESCRIPTION } from '../app.service.js';

export const setupSwagger = (app: INestApplication) => {
  const config = new DocumentBuilder()
    .setTitle('map-service-backend API')
    .setDescription(APP_DESCRIPTION)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // Можно указать дополнительные параметры, например, include или custom site
  });

  SwaggerModule.setup('api', app, document, {
    explorer: true,
    customSiteTitle: 'API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      customCss: `
        :root {
          --color-background: #222;
          --color-text: #eee;
        }

        body {
          background-color: var(--color-background);
          color: var(--color-text);
        }
      `,
    },
  });
};
