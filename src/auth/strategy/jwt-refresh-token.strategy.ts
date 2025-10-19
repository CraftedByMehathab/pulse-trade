import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RefreshClaim } from '../auth.service';
import { Request } from 'express';

export const RefreshTokenStrategyName = 'jwt-refresh-token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  RefreshTokenStrategyName,
) {
  validate(payload: RefreshClaim): RefreshClaim {
    return payload;
  }

  constructor(configService: ConfigService) {
    super({
      secretOrKey: configService.get('REFRESH_TOKEN_SECRET') as string,
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtRefreshTokenStrategy.extractCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
    });
  }

  private static extractCookie(this: void, req: Request): string | null {
    const cookies = req.cookies as
      | Record<string, string | undefined>
      | undefined;
    const cookie = cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    return typeof cookie === 'string' ? cookie : null;
  }
}
