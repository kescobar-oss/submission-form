import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

// Public routes for getting a token. Everything that needs a token is protected elsewhere.
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
}
