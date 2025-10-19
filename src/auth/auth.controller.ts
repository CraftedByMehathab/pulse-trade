import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  AccessClaim,
  AuthService,
  RefreshClaim,
  SanatizeUserDto,
} from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { Prisma } from 'generated/prisma';
import { LocalAuthGuard } from './guard/local-auth.guard';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { JwtRefreshTokenAuthGuard } from './guard/jwt-refresh-token-auth.guard';
import { JwtAccessTokenAuthGuard } from './guard/jwt-access-token-auth.guard';
import { REFRESH_TOKEN_COOKIE_NAME } from './strategy/jwt-refresh-token.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
    @Body() signupDto: SignUpDto,
  ) {
    try {
      const { passwordHash, ...restUser } =
        await this.authService.signup(signupDto);
      const { accessToken, refreshToken, sid } = await this.authService.login(
        restUser,
        {
          ip: req.ip,
          ua: req.headers['user-agent'],
        },
      );
      this.handleCookie(res, refreshToken);
      return {
        accessToken,
        sid,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2001')
          throw new ConflictException('Email already taken');
      }
      throw error;
    }
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { accessToken, refreshToken, sid } = await this.authService.login(
      req.user as SanatizeUserDto,
    );
    this.handleCookie(res, refreshToken);
    return {
      accessToken,
      sid,
    };
  }

  @UseGuards(JwtRefreshTokenAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    try {
      const { userId, sid, jti, name, email } = req.user as RefreshClaim;
      const user: SanatizeUserDto = {
        name,
        id: userId,
        email,
      };
      const { accessToken, refreshToken } =
        await this.authService.rotateRefreshToken(user, sid, jti);
      this.handleCookie(res, refreshToken);
      return {
        accessToken,
      };
    } catch (error) {
      console.log(error);

      throw new UnauthorizedException('Authentication failed', {
        cause: error,
      });
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @UseGuards(JwtAccessTokenAuthGuard)
  async logout(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const { sid } = req.user as AccessClaim;
    await this.authService.logout(sid);
    this.handleCookie(res);
    return { ok: true };
  }

  private handleCookie(res: ExpressResponse, cookie?: string) {
    const COOKIE_OPTIONS = {
      httpOnly: true,
      // // secure: true,
      sameSite: 'strict' as const,
      path: '/auth',
    };

    if (cookie) res.cookie(REFRESH_TOKEN_COOKIE_NAME, cookie, COOKIE_OPTIONS);
    else res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, COOKIE_OPTIONS);
  }
}
