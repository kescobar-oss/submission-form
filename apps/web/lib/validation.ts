// Browser-side copy of the API's rules (apps/api/src/requests/dto/create-request.dto.ts).
// This is for convenience only: it gives instant, friendly messages without a round trip.
// It is NOT protection: anyone can skip this code and send anything straight to the API,
// which is why the API checks everything again before saving.
import { CATEGORIES, PRIORITIES, type Category, type Priority } from './types';

// What the form holds while you type. category and priority start as '' (nothing chosen),
// which a FeatureRequestInput doesn't allow; validation is what turns one into the other.
// No name or email: they come from the logged-in account.
export type FormValues = {
  category: Category | '';
  priority: Priority | '';
  description: string;
  consent: boolean;
};

export type FieldName = keyof FormValues;

// At most one message per field; a field with no entry is valid.
export type FormErrors = Partial<Record<FieldName, string>>;

export const EMPTY_FORM: FormValues = {
  category: '',
  priority: '',
  description: '',
  consent: false,
};

// Same limits as the API's @Length rules. Kept here so the form can show "120 / 500".
// The name limits are used by the sign-up form (lib/auth-validation.ts).
export const NAME_MIN = 2;
export const NAME_MAX = 80;
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 500;

// "something@something.something" with no spaces. Looser than the API's @IsEmail, so a
// rare address could pass here and still be caught by the API; that's fine, see top comment.
// Exported so the login and sign-up forms (lib/auth-validation.ts) use the same check.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const description = values.description.trim();

  // includes() also rejects '' (nothing chosen), because '' isn't in the list.
  if (!CATEGORIES.includes(values.category as Category)) errors.category = 'Please choose a category.';
  if (!PRIORITIES.includes(values.priority as Priority)) errors.priority = 'Please choose a priority.';

  if (description.length === 0) errors.description = 'Please describe your request.';
  else if (description.length < DESCRIPTION_MIN)
    errors.description = `Description must be at least ${DESCRIPTION_MIN} characters.`;
  else if (description.length > DESCRIPTION_MAX)
    errors.description = `Description must be at most ${DESCRIPTION_MAX} characters.`;

  if (!values.consent) errors.consent = 'You must agree before we can store your request.';

  return errors;
}

// The API's 400 messages start with the field's name, e.g. "email must be an email" or
// "name must be longer than or equal to 2 characters". The first word tells us which field
// to show it under. Anything that doesn't match a field goes in `other`, for a general Alert.
export function apiMessagesToErrors(messages: string[]): { errors: FormErrors; other: string[] } {
  const errors: FormErrors = {};
  const other: string[] = [];
  for (const message of messages) {
    const field = message.split(' ')[0] as FieldName;
    if (field in EMPTY_FORM && !errors[field]) errors[field] = message;
    else other.push(message);
  }
  return { errors, other };
}
