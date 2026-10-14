import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService, type TokenPayload } from './auth.service.js';
import { CurrentUser } from './current-user.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

// Routes for getting a token (public) and checking who a token belongs to (logged in).
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register: creates an account (201 Created) and logs it in straight away.
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  // POST /auth/login. @HttpCode(200) because logging in doesn't create anything,
  // so Nest's POST default of 201 Created would be misleading.
  @Post('login')
  @HttpCode(200)
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  // GET /auth/me: "who am I?" The website calls it to check a saved token still works.
  // It answers from the token itself, so a role change shows up at the next login.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: TokenPayload) {
    return { id: user.sub, email: user.email, name: user.name, role: user.role };
  }
}
