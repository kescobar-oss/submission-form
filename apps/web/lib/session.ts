// Where the login token is kept between page loads. sessionStorage belongs to one browser tab
// and is wiped when that tab closes, so a forgotten tab on a shared computer doesn't stay
// logged in for long. The token also expires on its own after 8 hours (set by the API).
//
// Trade-off, honestly: any JavaScript running on this site can read sessionStorage. That's
// why the site must never show user-typed text as raw HTML. React escapes text by default,
// which keeps us safe as long as nobody uses dangerouslySetInnerHTML.
const TOKEN_KEY = 'dmts.token';

// Every access is wrapped in try/catch: some browsers (e.g. private mode with strict settings)
// refuse storage access, and that should mean "not logged in", not a crashed page.
export function readToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Can't remember it; the user stays logged in until they reload the page.
  }
}

export function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}

// The "your login expired" alarm. lib/api.ts rings it when the API answers 401 to a request
// that carried a token; AuthProvider listens and logs the user out. Two separate files can
// talk this way without importing each other.
let onExpired: (() => void) | null = null;

export function setExpiredHandler(handler: (() => void) | null) {
  onExpired = handler;
}

export function notifyExpired() {
  onExpired?.();
}
