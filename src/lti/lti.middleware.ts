import { Injectable, NestMiddleware, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { Provider as lti } from 'ltijs';
import * as DatabaseModule from 'ltijs-sequelize';
const Database = DatabaseModule.default || DatabaseModule;

@Injectable()
export class LtiMiddleware implements NestMiddleware, OnModuleInit {
  constructor(private readonly config_service: ConfigService) {}
  async onModuleInit() {
    const db = new Database('nestdb', 'gatikrajput', 'Gatik@12345', {
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      logging: false,
    });

    const ltiKey = this.config_service.get<string>('LTI_KEY');
    if (!ltiKey) {
      throw new Error('LTI_KEY is required');
    }

    lti.setup(
      ltiKey,
      { plugin: db },
      {
        appRoute: '/',
        keysetRoute: '/keys',
        loginRoute: '/login',
        devMode: true,
      },
    );
    lti.onConnect((token, req: Request, res: Response, next: NextFunction) => {
      if (token) {
        console.log('token', token);
        const url = `http://localhost:3000/?ltik=${token}`;
        console.log('url', url);
        return res.redirect(url);
      } else res.redirect('/lti/nolti');
    });
    await lti.deploy({ serverless: true });
    await lti.registerPlatform({
      url: this.config_service.get<string>('LTI_ISS'),
      name: this.config_service.get<string>('LTI_NAME'),
      clientId: this.config_service.get<string>('LTI_CLIENT_ID'),
      authenticationEndpoint: `${this.config_service.get<string>(
        'LTI_HOST',
      )}/api/lti/authorize_redirect`,
      accesstokenEndpoint: `${this.config_service.get<string>(
        'LTI_HOST',
      )}/login/oauth2/token`,
      authConfig: {
        method: 'JWK_SET',
        key: `${this.config_service.get<string>(
          'LTI_HOST',
        )}/api/lti/security/jwks`,
      },
    });
  }

  use(req: Request, res: Response, next: () => void) {
    lti.app(req, res, next);
  }
}
