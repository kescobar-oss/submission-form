import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

@Module({
  imports: [
    // registerAsync + useFactory reads JWT_SECRET when the app starts, not when this file is
    // first loaded, so tests can set their own secret before building the app.
    JwtModule.registerAsync({
      global: true, // the auth guard in other modules needs JwtService too
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        // Fail closed: refuse to start rather than sign tokens with a missing or weak key.
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET must be set to at least 32 random characters');
        }
        // Tokens stop working after 8 hours; then the user logs in again. A stolen token
        // is therefore only useful for a limited time.
        return { secret, signOptions: { expiresIn: '8h' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
