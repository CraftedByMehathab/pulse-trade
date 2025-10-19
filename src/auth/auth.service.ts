import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'src/user/user.service';
import * as argon2 from 'argon2';
import { User } from 'generated/prisma';
import { AuthPayload } from './dto/auth-payload.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SessionsService } from 'src/sessions/sessions.service';
import { MetaDto } from 'src/sessions/dto/meta.dto';

export type SanatizeUserDto = Omit<
  User,
  'passwordHash' | 'createdAt' | 'updatedAt'
>;
export type AccessClaim = {
  sub: string;
  sid: string;
  scope?: string[];
} & AuthPayload;
export type RefreshClaim = {
  sub: string;
  sid: string;
  jti: string;
} & AuthPayload;

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionsService: SessionsService,
  ) {}

  signup(signupDto: SignUpDto) {
    return this.userService.createUser(signupDto);
  }

  async validateUser(loginDto: LoginDto): Promise<SanatizeUserDto | null> {
    const user = await this.userService.findUser({
      email: loginDto.email.trim().toLowerCase(),
    });
    if (user) {
      const { passwordHash, ...restUser } = user;
      if (await argon2.verify(passwordHash, loginDto.password)) return restUser;
    }
    return null;
  }

  async login(user: SanatizeUserDto, meta?: MetaDto) {
    const { jti, session } = await this.sessionsService.createSession(
      user.id,
      meta,
    );
    const [refreshToken, accessToken] = await Promise.all([
      this.signRefreshToken(user, session.id, jti),
      this.signAccessToken(user, session.id),
    ]);

    return {
      refreshToken,
      accessToken,
      sid: session.id,
    };
  }
  async rotateRefreshToken(user: SanatizeUserDto, sid: string, jti: string) {
    const { session, jti: newJti } = await this.sessionsService.refreshSession(
      user.id,
      sid,
      jti,
    );
    return {
      accessToken: await this.signAccessToken(user, session.id),
      refreshToken: await this.signRefreshToken(user, session.id, newJti),
    };
  }

  async logout(sid: string) {
    return this.sessionsService.revokeSession(sid);
  }

  private signAccessToken(
    user: SanatizeUserDto,
    sid: string,
    scope?: string[],
  ) {
    const accessClaim: AccessClaim = {
      sub: user.id,
      sid,
      scope,
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    return this.jwtService.signAsync(accessClaim, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: '5m',
    });
  }
  private signRefreshToken(user: SanatizeUserDto, sid: string, jti: string) {
    const refreshClaim: RefreshClaim = {
      sub: user.id,
      userId: user.id,
      email: user.email,
      name: user.name,
      sid,
      jti,
    };
    return this.jwtService.signAsync(refreshClaim, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      issuer: this.configService.get('HOST'),
      audience: 'web',
      expiresIn: '7d',
    });
  }
}
