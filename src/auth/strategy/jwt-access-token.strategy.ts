import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthPayload } from '../dto/auth-payload.dto';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

export const AccessTokenStrategyName = 'jwt-access-token';

@Injectable()
export class JwtAccessTokenStrategy extends PassportStrategy(
  Strategy,
  AccessTokenStrategyName,
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('ACCESS_TOKEN_SECRET') as string,
    });
  }
  validate(payload: AuthPayload): AuthPayload {
    return payload;
  }
}
