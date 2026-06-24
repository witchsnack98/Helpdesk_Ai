import { Module } from '@nestjs/common';
import { HelpdeskGateway } from './gateway';

@Module({
  providers: [HelpdeskGateway],
  exports: [HelpdeskGateway],
})
export class GatewayModule {}
