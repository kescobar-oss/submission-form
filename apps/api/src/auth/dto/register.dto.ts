import { IsEmail, IsString, Length } from 'class-validator';

// What POST /auth/register accepts. There is deliberately no "role" field: with the global
// whitelist, a client that sends role: "ADMIN" just has it stripped, and the database
// default (USER) applies.
export class RegisterDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsEmail()
  email: string;

  // At least 8 characters. At most 72 because bcrypt silently ignores anything after the
  // 72nd byte, so a longer limit would let two different passwords count as the same one.
  @IsString()
  @Length(8, 72)
  password: string;
}
