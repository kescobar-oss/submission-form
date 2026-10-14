import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// What POST /auth/login accepts. No length rules on the password here: a wrong password
// should get the same 401 as any other wrong password, not a 400 hinting at the rules.
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
