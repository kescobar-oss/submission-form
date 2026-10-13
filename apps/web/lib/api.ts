// Every call from the web app to the API lives in this file. Pages never call fetch
// themselves, so if the API's address or error format changes, this is the only file to fix.
import type { CreatedRequest, FeatureRequest, FeatureRequestInput } from './types';

// Read from .env.local now, and from Vercel's settings later. Because of the NEXT_PUBLIC_
// prefix, Next.js pastes this value into the JavaScript every visitor downloads, which is
// fine for an address but would be a leak for a secret like ADMIN_KEY.
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Every call returns one of these instead of throwing, so each page is forced (by TypeScript)
// to handle every outcome: it can't forget the "API is switched off" case.
export type ApiResult<T> =
  | { ok: true; data: T }
  // 400: the API rejected the input. messages are its own words, e.g. "email must be an email".
  | { ok: false; kind: 'validation'; messages: string[] }
  // 401: missing or wrong admin key.
  | { ok: false; kind: 'unauthorized' }
  // The API couldn't be reached at all (switched off, wrong URL, no internet, CORS refusal).
  | { ok: false; kind: 'network' }
  // The API answered, but with something unexpected (e.g. 500 because the database is down).
  | { ok: false; kind: 'server'; status: number };

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

// GET /requests: every request, newest first. Admin only.
export function listRequests(adminKey: string) {
  return send<FeatureRequest[]>('/requests', {
    // The key travels in a header, never in the URL, because URLs end up in browser
    // history and server logs.
    headers: { 'x-admin-key': adminKey },
  });
}

// The shared part of every call: send, wait, then sort the reply into one of the outcomes.
async function send<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
  let response: Response;
  try {
    // await pauses this function (not the whole page) until the API replies.
    response = await fetch(`${API_URL}${path}`, init);
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
    return { ok: false, kind: 'unauthorized' };
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
