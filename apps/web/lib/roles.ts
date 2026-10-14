// What each role is for, in one place, so the header, the login redirect and the page guards
// can never disagree. The API enforces the same split with @Roles(...) on every route.
import type { Role } from './types';

// Staff handle tickets (see everyone's, change status). Users send requests and see their own.
export const STAFF_ROLES: Role[] = ['ADMIN', 'DEVELOPER'];
export const USER_ROLES: Role[] = ['USER'];

export function isStaff(role: Role) {
  return STAFF_ROLES.includes(role);
}

// Each role's start page: where logging in, the logo and "go back" lead.
// Staff skip the welcome page entirely and land on their ticket list.
export function homePathFor(role: Role) {
  return isStaff(role) ? '/tickets' : '/';
}
