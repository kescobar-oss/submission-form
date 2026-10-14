import { IsEnum } from 'class-validator';
import { Status } from '../../../generated/prisma/enums.js';

// What PATCH /requests/:id/status accepts: one field, and only a value from the Status enum
// in the Prisma schema. Anything else ("DONE", "completed", 42) gets a 400 with the allowed list.
export class UpdateStatusDto {
  @IsEnum(Status)
  status: Status;
}
