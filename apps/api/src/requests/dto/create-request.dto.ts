import { Equals, IsEmail, IsEnum, IsString, Length } from 'class-validator';
// The allowed values come from the Prisma schema itself, so if the database role ever adds
// a category, validation picks it up after `prisma generate` with no change here.
import { Category, Priority } from '../../../generated/prisma/enums.js';

// What a valid POST /requests body looks like. Each @ label is one rule; the global
// ValidationPipe (main.ts) checks them all before the controller ever sees the data.
// Fields not listed here (e.g. "id" or "createdAt" sent by a client) are stripped out.
export class CreateRequestDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsEmail()
  email: string;

  @IsEnum(Category)
  category: Category;

  @IsEnum(Priority)
  priority: Priority;

  @IsString()
  @Length(10, 500)
  description: string;

  // Equals(true), not just "is a boolean": consent: false must be rejected, because we
  // may only store someone's details when they have agreed to it.
  @Equals(true, { message: 'consent must be true' })
  consent: boolean;
}
