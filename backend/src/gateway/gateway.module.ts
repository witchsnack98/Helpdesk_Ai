import { Module, forwardRef } from '@nestjs/common';
import { HelpdeskGateway } from './gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)],
  providers: [HelpdeskGateway],
  exports: [HelpdeskGateway],
})
export class GatewayModule {}
