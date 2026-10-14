# Lessons: Login and roles

Branch: `feat/auth` · Builds on the merged frontend, welcome page and visual polish.

---

## a. What we built

People now have accounts: anyone can sign up at `/register` (always as a **User**), and the seed creates one sample account per role: User, Admin and Developer.
Logging in at `/login` returns a signed **token** that the website keeps for the tab and sends with every API call; it expires after 8 hours.
The API checks that token on every request route: submitting needs a login, the name and email are taken from the account (never from the form), and only Admin and Developer may list everyone's requests.
The old shared admin key is gone; the website shows a different menu per role, a "My requests" page for your own requests, and sends logged-out visitors to the login page and back.
Passwords are stored only as bcrypt hashes, and 19 end-to-end tests prove the rules, including 401, 403 and 409 cases.

---

## b. File map

| Path | Language | Purpose | Will you edit it again? |
|---|---|---|---|
| `apps/api/prisma/schema.prisma` | Prisma Schema Language | Adds the `Role` enum, the `User` table, and `FeatureRequest.userId` linking a request to its author. | Yes, for data changes. |
| `apps/api/prisma/migrations/…_add_users_and_roles/migration.sql` | SQL | The applied change. | **Never.** |
| `apps/api/prisma/seed.ts` | TypeScript | Creates/resets `user@`, `admin@`, `developer@example.com` with `SEED_PASSWORD`. | Sometimes. |
| `apps/api/.env.example` | env | Documents `SEED_PASSWORD` and `JWT_SECRET`; `ADMIN_KEY` removed. | When settings change. |
| `apps/api/src/auth/auth.module.ts` | TypeScript | Sets up token signing (secret, 8 h expiry); refuses to start without a strong `JWT_SECRET`. | Rarely. |
| `apps/api/src/auth/auth.service.ts` | TypeScript | Sign-up, password check, token creation. | Sometimes. |
| `apps/api/src/auth/auth.controller.ts` | TypeScript | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`. | Rarely. |
| `apps/api/src/auth/dto/*.dto.ts` | TypeScript | Rules for sign-up and login bodies. | Rarely. |
| `apps/api/src/auth/jwt-auth.guard.ts` | TypeScript | "Are you logged in?" → 401. | Rarely. |
| `apps/api/src/auth/roles.decorator.ts`, `roles.guard.ts` | TypeScript | `@Roles(...)` label and the check behind it → 403. | Rarely. |
| `apps/api/src/auth/current-user.decorator.ts` | TypeScript | `@CurrentUser()` gives a route the logged-in user. | Rarely. |
| `apps/api/src/requests/*` | TypeScript | Routes now need a login; author from token; `GET /requests/mine`. | Yes. |
| `apps/api/test/app.e2e-spec.ts` | TypeScript | 19 end-to-end tests, including login, roles and identity. | Yes. |
| `apps/web/lib/session.ts` | TypeScript | Token in `sessionStorage`, plus the "login expired" alarm. | Rarely. |
| `apps/web/lib/api.ts` | TypeScript | Adds the token to every call; login, register, me, mine; 403/409 results. | When endpoints change. |
| `apps/web/lib/auth-validation.ts` | TypeScript | Browser copy of login/sign-up rules; `safeNext`. | When rules change. |
| `apps/web/components/AuthProvider.tsx` | TypeScript + JSX | Knows who's logged in; `useAuth()`. | Rarely. |
| `apps/web/components/RequireAuth.tsx` | TypeScript + JSX | Wraps pages that need a login or a role. | Rarely. |
| `apps/web/components/LoginForm.tsx`, `RegisterForm.tsx` | TypeScript + JSX | The two forms. | Sometimes. |
| `apps/web/app/login/`, `app/register/` | TypeScript + JSX | The new pages. (`app/my-requests/` became `app/submissions/` in the status update below.) | Sometimes (wording). |
| `apps/web/components/RequestsList.tsx`, `RequestsTable.tsx` | TypeScript + JSX | Load and show "all" or "mine"; replace the old admin-key view. | Yes, for new columns. |
| `apps/web/components/SiteHeader.tsx` | TypeScript + JSX | Menu per role, name and role badge, Log out. | Yes, for new pages. |
| `apps/web/components/RequestForm.tsx` | TypeScript + JSX | No more name/email fields; "Submitting as …". | Yes. |

---

## c. A login's journey, then a request's

1. You open `/new?category=BUG` while logged out. `RequireAuth` sees `anonymous` and sends you to `/login?next=/new?category=BUG`.
2. You type your email and password. `LoginForm` checks they're filled in, then `AuthProvider.login` calls `POST /auth/login`.
3. The API's `ValidationPipe` checks the body; `AuthService.login` finds the user by (lower-cased) email and runs `bcrypt.compare` against the stored hash, even if no user was found, so both failures take the same time.
4. Wrong? **401** "Invalid email or password". Right? The API signs a token containing your id, email, name and role, valid 8 hours, and returns it with your public details.
5. The website saves the token in `sessionStorage`, `AuthProvider` switches to `authenticated`, and `LoginForm` replaces the page with `next`: `/new?category=BUG`, Bug still selected.
6. You submit. `lib/api.ts` adds `Authorization: Bearer <token>` automatically.
7. On the API, `JwtAuthGuard` checks the signature and expiry (**401** if bad), then `RolesGuard` checks any `@Roles` label (**403** if your role isn't listed), then the `ValidationPipe` checks the body (**400**).
8. The controller takes your name, email and id **from the token** and the service saves the request linked to your account. **201** with `{ id, createdAt }`.
9. Later, if the token has expired, any call gets **401**; `lib/api.ts` rings the alarm, `AuthProvider` logs you out, and `RequireAuth` sends you to log in again.

---

## d. Key takeaways

### 1. Hash passwords; never store them
A bcrypt **hash** is a one-way scramble: logging in scrambles what you type and compares. The random **salt** makes the same password hash differently each time, and the **cost** (12) makes guessing from a stolen table very slow.
👉 [auth.service.ts:28](../../apps/api/src/auth/auth.service.ts) (`bcrypt.hash(…, 12)`), [auth.service.ts:51](../../apps/api/src/auth/auth.service.ts) (`bcrypt.compare`), [schema.prisma:93](../../apps/api/prisma/schema.prisma) (`passwordHash`).

### 2. A JWT is signed, not secret
The token's middle part is readable by anyone (we decoded it). What makes it safe is the **signature**: changing `USER` to `ADMIN` broke it and the API answered 401. Never put secrets in a token, and guard `JWT_SECRET`, since it can sign tokens for anyone.
👉 [auth.service.ts:64](../../apps/api/src/auth/auth.service.ts) (`signAsync`), [jwt-auth.guard.ts:27](../../apps/api/src/auth/jwt-auth.guard.ts) (`verifyAsync`), [auth.module.ts:15-20](../../apps/api/src/auth/auth.module.ts) (fail closed; 8 h expiry).

### 3. Authentication (401) vs. authorization (403)
*Who are you?* is answered by `JwtAuthGuard`: no valid token, **401**. *Are you allowed?* is answered by `RolesGuard` reading the `@Roles` label: wrong role, **403**. Guards run in the order listed, before any pipe or controller.
👉 [requests.controller.ts:17](../../apps/api/src/requests/requests.controller.ts) (`@UseGuards(JwtAuthGuard, RolesGuard)` on the class), line 33 (`@Roles('ADMIN', 'DEVELOPER')`), [roles.guard.ts:16-26](../../apps/api/src/auth/roles.guard.ts).

### 4. Identity comes from the token, never the body
Anyone can type any name into a form or a curl command. The API takes name, email and user id from the signed token, and the body's attempts are stripped. Sign-up has no `role` field at all, so `role: "ADMIN"` is thrown away and the database default `USER` applies.
👉 [requests.controller.ts:28](../../apps/api/src/requests/requests.controller.ts), [schema.prisma:95](../../apps/api/prisma/schema.prisma) (`@default(USER)`).

### 5. Don't leak which emails have accounts
Wrong password and unknown email give the same 401, with the same words, after the same delay, because bcrypt runs against a dummy hash when there's no user. Otherwise an attacker could test emails one by one.
👉 [auth.service.ts:18](../../apps/api/src/auth/auth.service.ts) (`DUMMY_HASH`), lines 51-54.

### 6. The website hides; the API protects
`RequireAuth` and the role-aware header only spare people from errors. Anyone can skip the website, so every rule is enforced again by the API's guards. Hiding a page is never security.
👉 [RequireAuth.tsx:34-44](../../apps/web/components/RequireAuth.tsx) vs. [requests.controller.ts:17](../../apps/api/src/requests/requests.controller.ts).

### 7. Where the token lives, and the trade-off
`sessionStorage` survives page loads but is wiped when the tab closes. A cookie would be safer from malicious scripts, but our site and API will live on different domains, and browsers block such cookies. So we combine `sessionStorage` with a short expiry and React's automatic escaping of text. Every call gets the header in one place, so no page can forget it.
👉 [session.ts:14](../../apps/web/lib/session.ts), [api.ts:79](../../apps/web/lib/api.ts), [api.ts:100](../../apps/web/lib/api.ts) (logout on expiry).

### 8. Only redirect to your own site
`?next=` makes logging in pleasant, but a crafted link like `?next=//evil.example` could send people to a fake site right after they typed their password: an **open redirect**. `safeNext` only allows paths on this site.
👉 [auth-validation.ts:40](../../apps/web/lib/auth-validation.ts).

### 9. Server pages can't hand functions to browser components
Our first `RequireAuth` took a function as its child; the server page couldn't send it to the browser and the page crashed. Neither TypeScript nor the linter noticed; only running it did. Data crosses the server–client line, functions don't.
👉 [RequireAuth.tsx](../../apps/web/components/RequireAuth.tsx) (`children: ReactNode`) and [app/new/page.tsx](../../apps/web/app/new/page.tsx).

---

## e. Glossary

| Term | Meaning |
|---|---|
| **Account / user** | A row in the `User` table: email, name, password hash, role. |
| **Role** | What an account may do: `USER`, `ADMIN` or `DEVELOPER`. |
| **Relation / foreign key** | A link between tables (`FeatureRequest.userId` → `User.id`) that the database enforces. |
| **`@unique`** | The database refuses a second row with the same value (email). |
| **Password hash** | A one-way scrambled password; the real password is never stored. |
| **bcrypt** | The hashing method we use (`bcryptjs` library). |
| **Salt** | Random ingredient in every hash, so equal passwords hash differently. |
| **Cost factor** | How much deliberate work each hash takes (12 in the app, 4 in tests). |
| **Upsert** | Update if it exists, otherwise insert. |
| **Seed account** | A ready-made test login created by the seed. |
| **JWT** | JSON Web Token: header.payload.signature; readable, but can't be changed without the secret. |
| **Payload** | The token's readable contents (id, email, name, role, `iat`, `exp`). |
| **Signature** | Proof the payload wasn't changed, made with `JWT_SECRET`. |
| **`iat` / `exp`** | Issued-at and expiry times inside a token. |
| **Bearer token / `Authorization` header** | The standard way to send a token: `Authorization: Bearer <token>`. |
| **Authentication** | Proving who you are (401 when missing). |
| **Authorization** | Checking what you may do (403 when not allowed). |
| **401 / 403 / 409** | Not logged in / not allowed / clashes with existing data. |
| **User enumeration** | Finding out which emails have accounts. Prevented by identical failures. |
| **Metadata / Reflector** | Notes stored by decorators like `@Roles`, and Nest's tool to read them. |
| **Custom param decorator** | Your own `@Body()`-style helper, like `@CurrentUser()`. |
| **sessionStorage** | Per-tab browser storage, wiped when the tab closes. |
| **Context (React)** | A value shared with every component inside a provider (`useAuth()`). |
| **Hook** | A React function starting with `use`, like `useState` or `useAuth`. |
| **Open redirect** | Following any "next" link blindly, which can send users to a fake site. |
| **Server–client boundary** | The line between server code and browser code; only data, not functions, crosses it. |
| **Hydration (mismatch)** | React taking over server HTML in the browser, and complaining if they differ. |
| **Race condition** | Two things competing so the result depends on timing. |

---

## f. Exercises (easiest first)

### 1. Change how long a login lasts
In `apps/api/src/auth/auth.module.ts`, change `expiresIn: '8h'` to `'1m'`. Restart the API, log in, wait two minutes and click Refresh on "Submissions". You'll be sent to the login page, because the token expired. Change it back afterwards.

### 2. Read your own token
While logged in, open the browser's developer tools (F12) → Console, and run `JSON.parse(atob(sessionStorage.getItem('dmts.token').split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))`. (The two `replace` calls turn the token's URL-safe letters back into the ones `atob` expects.) You'll see your id, name, role, `iat` and `exp`, readable by anyone, which is why tokens never hold secrets.

### 3. Require a longer password
Make sign-up demand 10 characters. Change `@Length(8, 72)` in `apps/api/src/auth/dto/register.dto.ts` **and** `PASSWORD_MIN = 8` in `apps/web/lib/auth-validation.ts`. Then add an e2e test in `apps/api/test/app.e2e-spec.ts` that a 9-character password gets 400.

---

## Update: ticket statuses

Branch `feat/ticket-status`, added after login was merged.

**What changed.**
- Every ticket now has a **status**: Open (the default for new tickets), In Progress, Paused, Completed or Rejected.
- Admin and Developer are **staff**:
  - They land on **Tickets** (`/tickets`) after logging in, and never see the welcome page.
  - They change a ticket's status from a dropdown.
  - They can't submit tickets: the website hides the form, and the API answers 403.
- Users submit as before. Their list, now called **Submissions** (`/submissions`, formerly "My requests"), shows each ticket's current status as a coloured badge, so they can see what staff decided.

**New and changed files**

| Path | Language | Purpose | Will you edit it again? |
|---|---|---|---|
| `apps/api/prisma/schema.prisma` + migration `…_add_ticket_status` | Prisma / SQL | `Status` enum and `status @default(OPEN)` on each ticket. | Yes, to add a status. |
| `apps/api/src/requests/dto/update-status.dto.ts` | TypeScript | Only the five statuses are accepted (400 otherwise). | When statuses change. |
| `apps/api/src/requests/requests.controller.ts` / `.service.ts` | TypeScript | `PATCH /requests/:id/status` (staff, 404 for unknown tickets); `POST` is USER only. | Yes. |
| `apps/api/src/app.setup.ts` | TypeScript | CORS now allows `PATCH`. | Rarely. |
| `apps/web/lib/roles.ts` | TypeScript | Who is staff, and each role's start page. | When roles change. |
| `apps/web/components/StaffRedirect.tsx` | TypeScript + JSX | Sends staff from `/` to `/tickets`. | Rarely. |
| `apps/web/app/tickets/page.tsx` | TypeScript + JSX | Staff ticket list (was `/submissions`). | Sometimes. |
| `apps/web/app/submissions/page.tsx` | TypeScript + JSX | A User's own list with status (was `/my-requests`). | Sometimes. |
| `apps/web/components/RequestsTable.tsx`, `RequestsList.tsx` | TypeScript + JSX | Status column: dropdown for staff, badge for Users; saving and undo. | Yes. |

**A status change's journey**
1. On `/tickets`, the Admin picks **In Progress** in a row's dropdown.
2. `RequestsList` updates the row on screen straight away, then calls `updateStatus()` in `lib/api.ts`.
3. The browser first asks the API, with an `OPTIONS` preflight, whether a `PATCH` with an `Authorization` header is allowed (CORS). Then it sends `PATCH /requests/<id>/status` with `{ "status": "IN_PROGRESS" }`.
4. `JwtAuthGuard` checks the token (401), and `RolesGuard` checks for ADMIN or DEVELOPER (403). The `ValidationPipe` checks the status is one of the five (400).
5. The service updates that one row. If no row has that id, Prisma's `P2025` becomes a **404**. Otherwise it returns `{ id, status }` with **200**.
6. The website shows "Status saved", or, on any failure, puts the old status back and explains why.
7. The User opens **Submissions**, `GET /requests/mine` returns their rows including `status`, and the badge reads **In Progress**.

**Takeaways**

1. **PATCH and route parameters.** `PATCH` means "change part of something that exists". The `:id` in `/requests/:id/status` is a **route parameter**, and Nest hands it over through `@Param('id')`.
   👉 [requests.controller.ts:44-51](../../apps/api/src/requests/requests.controller.ts)
2. **Turn "not found" into 404, not 500.** A wrong id is the caller's problem, not a server failure. Prisma reports it as `P2025`, and the service translates that into `NotFoundException`.
   👉 [requests.service.ts:48-51](../../apps/api/src/requests/requests.service.ts)
3. **A default makes a new required column safe.** Adding `status` to a table that already had rows only works because `@default(OPEN)` gives the old rows a value.
   👉 [schema.prisma:49](../../apps/api/prisma/schema.prisma)
4. **Optimistic updates.** Change the screen first, save in the background, and undo if saving fails. It feels instant without ever lying for long: we tested the undo by simulating a dropped network.
   👉 [RequestsList.tsx:76-104](../../apps/web/components/RequestsList.tsx), especially line 81 (show) and line 94 (undo).
5. **One place decides who is staff.** The header, the login redirect and the page guards all ask `lib/roles.ts`, and the API's `@Roles` labels enforce the same split. Never rely on the website alone.
   👉 [roles.ts:6-17](../../apps/web/lib/roles.ts), [requests.controller.ts:26](../../apps/api/src/requests/requests.controller.ts) (`@Roles('USER')` on POST)
6. **Commit before you experiment.** `git restore` returns a file to its **last commit**, so using it to undo a deliberate break also threw away uncommitted work and the controller had to be rewritten. Commit first, then break things on purpose.

**Glossary additions**

| Term | Meaning |
|---|---|
| **Status** | Where a ticket stands: Open, In Progress, Paused, Completed, Rejected. |
| **PATCH** | The HTTP method for changing part of an existing thing. |
| **Route parameter** | A changing part of a URL, like `:id`, read with `@Param`. |
| **404 Not Found** | The thing asked about doesn't exist. |
| **P2025** | Prisma's error code for "no row matched". |
| **Optimistic update** | Show a change before the server confirms it, and undo if it fails. |
| **Snackbar** | A short message at the bottom of the screen that disappears by itself. |
| **Staff** | Here: the Admin and Developer roles. |

**Exercise.** Add a sixth status, **Duplicate**:
1. Add `DUPLICATE` to the `Status` enum in `apps/api/prisma/schema.prisma`, then run `npx prisma migrate dev --name add-duplicate-status` and `npx prisma generate` from `apps/api`.
2. In `apps/web/lib/types.ts`, add it to `STATUSES` and `STATUS_LABELS`.
3. In `apps/web/components/RequestsTable.tsx`, give it a colour in `STATUS_COLORS`.

TypeScript will point at every place you forgot, because each list must cover every status. The API's validation picks it up automatically from the schema.

---

## Notes for other roles

- **Deploy (Railway):** set `JWT_SECRET` to a fresh random value (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`); the API refuses to start without one. Remove `ADMIN_KEY`. **Never** run the seed on Railway with a test password like the local one: anyone could log in as the sample Admin. Use a strong `SEED_PASSWORD` there, or don't seed production at all.
- **Deploy (CORS):** the API now needs the `Authorization` header allowed (it is, in `app.setup.ts`), and `CORS_ORIGIN` must be the Vercel URL.
- **Test data:** local testing created accounts like `signup-…@example.com` and `signup-ui-test@example.com`. The seed only resets the three sample accounts; other `@example.com` accounts can be removed in Prisma Studio (`npx prisma studio` in `apps/api`).
- **Known limitation:** a token keeps the role it was issued with. If an account's role changes, the old role applies until the token expires (at most 8 h).
