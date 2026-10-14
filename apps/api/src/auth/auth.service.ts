import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import type { Role } from '../../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

// What's written inside every token. "sub" (subject) is the standard name for "who this
// token is about". The token is signed, not encrypted: anyone can read these fields, but
// nobody can change them without JWT_SECRET, so never put anything secret in here.
export type TokenPayload = { sub: string; email: string; name: string; role: Role };

// A real bcrypt hash of a random password nobody knows, made once when the app starts. Used
// when the email doesn't exist, so that case takes as long as a wrong password (see login).
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(data: RegisterDto) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    try {
      const user = await this.prisma.user.create({
        // No role here: the schema's @default(USER) applies to everyone who signs up.
        data: { name: data.name.trim(), email: normalize(data.email), passwordHash },
      });
      return this.issueToken(user);
    } catch (error) {
      // P2002 is Prisma's code for "a @unique column already has this value": the email
      // is taken. Asking the database (instead of checking first) is also safe when two
      // sign-ups with the same email arrive at the same moment.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: normalize(data.email) } });
    // Always run bcrypt, even when there's no such user. Otherwise "unknown email" would
    // answer noticeably faster than "wrong password", and an attacker could time the replies
    // to find out which emails have accounts.
    const passwordOk = await bcrypt.compare(data.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordOk) {
      // One message for both cases, for the same reason.
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user);
  }

  // Signs a token for this user and returns it with the public account details, so the
  // website can show "Logged in as ..." without another request.
  private async issueToken(user: { id: string; email: string; name: string; role: Role }) {
    const payload: TokenPayload = { sub: user.id, email: user.email, name: user.name, role: user.role };
    return {
      token: await this.jwt.signAsync(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }
}

// "Karl@Example.com " and "karl@example.com" are the same mailbox, so both sign-up and
// login store and look up emails in one form: trimmed and lowercase.
function normalize(email: string) {
  return email.trim().toLowerCase();
}
