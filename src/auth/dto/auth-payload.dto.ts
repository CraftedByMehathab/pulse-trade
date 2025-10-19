import { User } from 'generated/prisma';

export class AuthPayload {
  sub: User['id'];
  userId: User['id'];
  email: User['email'];
  name: User['name'];
}
