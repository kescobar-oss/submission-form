import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../generated/prisma/enums.js';

export const ROLES_KEY = 'roles';

// A label for a route: @Roles('ADMIN', 'DEVELOPER') means "only these roles may call it".
// Like every decorator it does nothing by itself; it stores the list as metadata, and
// RolesGuard reads it back when a request arrives.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
