import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

// A guard answers one question before a route runs: "may this request continue?"
// It runs BEFORE the ValidationPipe, so a caller without the key learns nothing,
// not even whether their body would have been valid.
@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    // Header names are case-insensitive in HTTP; Express stores them lowercased.
    const provided = request.headers['x-admin-key'];
    const expected = process.env.ADMIN_KEY;

    // If ADMIN_KEY was never set on the server, refuse everyone rather than
    // accidentally letting an empty header match an empty key.
    if (!expected || typeof provided !== 'string' || !sameSecret(provided, expected)) {
      // 401 Unauthorized. The message is the same for "missing" and "wrong" on purpose,
      // so an attacker can't tell which one they got.
      throw new UnauthorizedException('Missing or invalid admin key');
    }
    return true;
  }
}

// A normal === stops at the first different character, so replies to almost-right guesses
// are a tiny bit slower, which an attacker can measure to guess the key letter by letter.
// timingSafeEqual always compares every byte. Hashing first makes both sides the same
// length, which timingSafeEqual requires, without revealing the real key's length.
function sameSecret(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();
  return timingSafeEqual(hashA, hashB);
}
