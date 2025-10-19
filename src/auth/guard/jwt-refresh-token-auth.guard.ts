import { AuthGuard } from '@nestjs/passport';
import { RefreshTokenStrategyName } from '../strategy/jwt-refresh-token.strategy';

export class JwtRefreshTokenAuthGuard extends AuthGuard(
  RefreshTokenStrategyName,
) {}
