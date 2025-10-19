import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service';

@Module({
  controllers: [],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
