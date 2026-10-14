// Browser-side copy of the API's login and sign-up rules (apps/api/src/auth/dto/). As with
// the request form, this only gives instant messages; the API checks everything again.
import { EMAIL_PATTERN, NAME_MAX, NAME_MIN } from './validation';

// Same limits as the API's RegisterDto: 8 to 72 characters (72 is bcrypt's limit).
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export type LoginValues = { email: string; password: string };
export type RegisterValues = { name: string; email: string; password: string };
export type AuthErrors = Partial<Record<'name' | 'email' | 'password', string>>;

export function validateLogin(values: LoginValues): AuthErrors {
  const errors: AuthErrors = {};
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter your email, like name@example.com.';
  // No length rule on login: a wrong password just gets "Invalid email or password".
  if (values.password.length === 0) errors.password = 'Please enter your password.';
  return errors;
}

export function validateRegister(values: RegisterValues): AuthErrors {
  const errors: AuthErrors = {};
  const name = values.name.trim();
  if (name.length < NAME_MIN || name.length > NAME_MAX)
    errors.name = `Name must be ${NAME_MIN} to ${NAME_MAX} characters.`;
  if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = 'Please enter a valid email, like name@example.com.';
  if (values.password.length < PASSWORD_MIN)
    errors.password = `Password must be at least ${PASSWORD_MIN} characters.`;
  else if (values.password.length > PASSWORD_MAX)
    errors.password = `Password must be at most ${PASSWORD_MAX} characters.`;
  return errors;
}

// Where to go after logging in, from ?next=/new. Only paths on this site are allowed:
// "/new" is fine, but "https://evil.example" or "//evil.example" (which browsers treat as
// another site) would let a crafted link send people to a fake site right after they
// typed their password. That trick is called an "open redirect".
export function safeNext(value: string | string[] | undefined): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  return value;
}
