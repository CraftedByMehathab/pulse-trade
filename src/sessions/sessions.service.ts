import { Injectable } from '@nestjs/common';
import { MetaDto } from './dto/meta.dto';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}
  async createSession(userId: string, meta?: MetaDto) {
    const jti = randomUUID();
    const refreshJtiHash = sha256(jti);
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshJtiHash,
        ip: meta?.ip,
        userAgent: meta?.ua,
      },
    });
    return { jti, session };
  }

  async refreshSession(userId: string, sid: string, jti: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sid },
    });
    if (!session || session.userId !== userId || session.revokedAt)
      throw new Error('Session invalid');
    if (session.refreshJtiHash !== sha256(jti)) {
      await this.revokeSession(sid);
      throw new Error('Refresh token reuse detected');
    }
    const newJti = randomUUID();
    const refreshJtiHash = sha256(newJti);
    const newSession = await this.prisma.session.update({
      where: { id: sid },
      data: { refreshJtiHash },
    });
    return {
      jti: newJti,
      session: newSession,
    };
  }

  revokeSession(sid: string) {
    return this.prisma.session.update({
      where: { id: sid },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}
