// Every call from the web app to the API lives in this file. Pages never call fetch
// themselves, so if the API's address or error format changes, this is the only file to fix.
import { notifyExpired, readToken } from './session';
import type { AuthResponse, CreatedRequest, FeatureRequest, FeatureRequestInput, User } from './types';

// Read from .env.local now, and from Vercel's settings later. Because of the NEXT_PUBLIC_
// prefix, Next.js pastes this value into the JavaScript every visitor downloads, which is
// fine for an address but would be a leak for a secret like JWT_SECRET.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Every call returns one of these instead of throwing, so each page is forced (by TypeScript)
// to handle every outcome: it can't forget the "API is switched off" case.
export type ApiResult<T> =
  | { ok: true; data: T }
  // 400: the API rejected the input. messages are its own words, e.g. "email must be an email".
  | { ok: false; kind: 'validation'; messages: string[] }
  // 401: not logged in, login expired, or (on the login page) wrong email or password.
  | { ok: false; kind: 'unauthorized'; messages: string[] }
  // 403: logged in, but this account's role isn't allowed to do it.
  | { ok: false; kind: 'forbidden' }
  // 409: clashes with something that exists, e.g. signing up with an email that's taken.
  | { ok: false; kind: 'conflict'; messages: string[] }
  // The API couldn't be reached at all (switched off, wrong URL, no internet, CORS refusal).
  | { ok: false; kind: 'network' }
  // The API answered, but with something unexpected (e.g. 500 because the database is down).
  | { ok: false; kind: 'server'; status: number };

// POST /auth/login: swap an email and password for a token.
export function login(email: string, password: string) {
  return send<AuthResponse>('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

// POST /auth/register: create a User account and get a token for it straight away.
export function register(name: string, email: string, password: string) {
  return send<AuthResponse>('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
}

// GET /auth/me: "who does my saved token belong to?" Also tells us whether it still works.
export function getMe() {
  return send<User>('/auth/me', {});
}

// GET /requests/mine: the logged-in person's own requests, newest first.
export function listMyRequests() {
  return send<FeatureRequest[]>('/requests/mine', {});
}

// POST /requests: save a new feature request.
export function createRequest(input: FeatureRequestInput) {
  return send<CreatedRequest>('/requests', {
    method: 'POST',
    // Tells the API the body is JSON, so Nest knows to parse it.
    headers: { 'Content-Type': 'application/json' },
    // fetch can only send text, so the JavaScript object is turned into a JSON string.
    body: JSON.stringify(input),
  });
}

// GET /requests: every request, newest first. Admin and Developer only (others get 403).
// The login token is added by send(), like on every call.
export function listRequests() {
  return send<FeatureRequest[]>('/requests', {});
}

// The shared part of every call: send, wait, then sort the reply into one of the outcomes.
async function send<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  // If someone is logged in, every call carries their token in the standard header, so no
  // page ever has to remember to add it.
  const token = readToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    // await pauses this function (not the whole page) until the API replies.
    response = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    // fetch only throws when no reply arrived at all. A 400 or 500 is still a reply.
    return { ok: false, kind: 'network' };
  }

  if (response.ok) {
    // response.ok is true for any 2xx status, e.g. 201 Created or 200 OK.
    return { ok: true, data: (await response.json()) as T };
  }
  if (response.status === 400) {
    return { ok: false, kind: 'validation', messages: await readMessages(response) };
  }
  if (response.status === 401) {
    // We sent a token and the API refused it: it expired (8 hours) or was tampered with.
    // Ring the alarm so AuthProvider logs out cleanly, instead of every page showing errors.
    if (token) notifyExpired();
    return { ok: false, kind: 'unauthorized', messages: await readMessages(response) };
  }
  if (response.status === 403) {
    return { ok: false, kind: 'forbidden' };
  }
  if (response.status === 409) {
    return { ok: false, kind: 'conflict', messages: await readMessages(response) };
  }
  return { ok: false, kind: 'server', status: response.status };
}

// Nest's 400 body looks like { message: ["email must be an email", ...], error, statusCode }.
// message can also be a single string, so both are turned into a list.
async function readMessages(response: Response): Promise<string[]> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message;
    if (typeof body.message === 'string') return [body.message];
  } catch {
    // The body wasn't JSON; fall through to an empty list.
  }
  return [];
}
