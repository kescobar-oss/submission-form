// The shape of a feature request, as the web app sees it. The API has its own copy of these
// rules (Prisma schema + DTO in apps/api). The two apps are separate programs, so they can't
// share one file; if the API ever adds a field or category, update this file to match.

// `as const` freezes these lists, so TypeScript knows the exact allowed values instead of
// just "some string". The dropdown, the radio buttons and the types below all come from them.
export const CATEGORIES = ['BUG', 'IMPROVEMENT', 'NEW_FEATURE'] as const;
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

// "One of the values in the list above", e.g. Category = 'BUG' | 'IMPROVEMENT' | 'NEW_FEATURE'.
export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];

// Friendly words for people; the API only ever sees the codes on the left.
export const CATEGORY_LABELS: Record<Category, string> = {
  BUG: 'Bug',
  IMPROVEMENT: 'Improvement',
  NEW_FEATURE: 'New feature',
};
export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

// What the form sends to POST /requests. No id or createdAt: the database creates those.
// No name or email either: the API copies them from the logged-in account.
export type FeatureRequestInput = {
  category: Category;
  priority: Priority;
  description: string;
  consent: boolean;
};

// What POST /requests sends back. Deliberately tiny: the API never echoes personal data.
export type CreatedRequest = {
  id: string;
  createdAt: string;
};

// One row from GET /requests (admin only). createdAt is a string because JSON has no date
// type; the API sends it as text like "2026-10-13T09:30:00.000Z".
// name and email are the author's, as they were when the request was sent.
export type FeatureRequest = FeatureRequestInput &
  CreatedRequest & {
    name: string;
    email: string;
  };

// The three kinds of account, matching the Role enum in the API's Prisma schema.
export const ROLES = ['USER', 'ADMIN', 'DEVELOPER'] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  USER: 'User',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
};

// The logged-in person, as GET /auth/me and the login reply describe them.
// There's never a password or hash in here: the API doesn't send them.
export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

// What POST /auth/login and POST /auth/register send back.
export type AuthResponse = {
  token: string;
  user: User;
};
