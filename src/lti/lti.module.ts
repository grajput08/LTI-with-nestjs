import { MiddlewareConsumer, Module } from '@nestjs/common';
import { LtiMiddleware } from './lti.middleware';

@Module({})
export class LtiModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LtiMiddleware).forRoutes('lti');
  }
}
