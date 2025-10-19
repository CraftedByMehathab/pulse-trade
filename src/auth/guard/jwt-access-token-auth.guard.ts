import { AuthGuard } from '@nestjs/passport';
import { AccessTokenStrategyName } from '../strategy/jwt-access-token.strategy';

export class JwtAccessTokenAuthGuard extends AuthGuard(
  AccessTokenStrategyName,
) {}
