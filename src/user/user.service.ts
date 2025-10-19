import { Injectable } from '@nestjs/common';
import { SignUpDto } from 'src/auth/dto/signup.dto';
import * as argon2 from 'argon2';
import { Prisma } from 'generated/prisma';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async createUser(signUpDto: SignUpDto) {
    const { password, email, ...restData } = signUpDto;
    const passwordHash = await this.getHash(password);
    return this.prisma.user.create({
      data: { ...restData, passwordHash, email: email.trim().toLowerCase() },
    });
  }

  findUser(where: Prisma.UserWhereUniqueInput) {
    return this.prisma.user.findUnique({ where });
  }

  async getHash(text: string) {
    return await argon2.hash(text, { type: argon2.argon2id });
  }
}
