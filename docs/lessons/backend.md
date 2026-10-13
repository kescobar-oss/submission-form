# Lessons: Backend Engineer

Role branch: `feat/backend` · Builds on the merged database work in [kescobar-oss/submission-form#1](https://github.com/kescobar-oss/submission-form/pull/1)

---

## a. What we built

We turned `apps/api` into a NestJS server that sits between the browser and the Postgres database, without touching the Prisma schema.
It has three endpoints: `POST /requests` (public; validates and saves a submission, then returns only `{ id, createdAt }`), `GET /requests` (admin only, newest first) and `GET /health`.
Bad input is refused with 400 by a global ValidationPipe, and `GET /requests` is protected by an AdminKeyGuard that returns 401 without the right `x-admin-key` header.
CORS lets only the web app's address (`CORS_ORIGIN`) call the API from a browser.
Unit and end-to-end tests run against a fake database, and you checked 200, 201, 400, 401 and 200 yourself with curl.

---

## b. File map

All paths are inside `apps/api/`.

| Path | Language | Purpose | Will you edit it again? |
|---|---|---|---|
| `src/main.ts` | TypeScript | The front door: loads `.env`, builds the app, applies the shared setup, starts listening on `PORT`. | Rarely. |
| `src/app.setup.ts` | TypeScript | App-wide settings (ValidationPipe, CORS) in one function, shared by `main.ts` and the e2e test. | Sometimes, e.g. a second allowed origin. |
| `src/app.module.ts` | TypeScript | The root "table of contents": lists every module the app is made of. | **Yes**, once per new module. |
| `src/app.controller.ts` | TypeScript | `GET /health`. | Rarely. |
| `src/app.controller.spec.ts` | TypeScript | Unit test for `/health`. | Rarely. |
| `src/prisma/prisma.service.ts` | TypeScript | The one shared database connection; connects on startup, disconnects on shutdown. | Rarely. |
| `src/prisma/prisma.module.ts` | TypeScript | Shares PrismaService with the whole app (`@Global`). | Rarely. |
| `src/requests/requests.module.ts` | TypeScript | The box holding everything about feature requests. | Rarely. |
| `src/requests/requests.controller.ts` | TypeScript | Maps `POST /requests` and `GET /requests` to functions; puts the guard on GET. | **Yes**, for every new endpoint. |
| `src/requests/requests.service.ts` | TypeScript | The Prisma queries: save one (return id + createdAt), list all newest first. | **Yes**, for new queries. |
| `src/requests/dto/create-request.dto.ts` | TypeScript | The rules a valid submission must pass. | **Yes**, whenever the form gets a field. |
| `src/requests/requests.service.spec.ts` | TypeScript | Unit tests for RequestsService with a fake Prisma. | Yes, when the service changes. |
| `src/auth/admin-key.guard.ts` | TypeScript | Lets a request through only with the right `x-admin-key`. | Rarely; replaced if real logins arrive. |
| `test/app.e2e-spec.ts` | TypeScript | End-to-end tests: 201, 400, 401, 200 and the "only id and createdAt" rule. | Yes, per new endpoint. |
| `examples/*.json` | JSON | Request bodies for manual curl testing. | Optional. |
| `package.json` | JSON | Libraries and named commands (`start:dev`, `build`, `test`, `test:e2e`). `prebuild` runs `prisma generate`. | Sometimes. |
| `tsconfig.json`, `tsconfig.build.json` | JSON with comments | How TypeScript checks and compiles; includes Prisma's `generated/` folder. | Rarely. |
| `nest-cli.json` | JSON | Nest CLI settings; `entryFile` points at `dist/src/main`. | Rarely. |
| `vitest.config.ts`, `vitest.config.e2e.ts` | TypeScript | Which files count as unit tests vs. e2e tests. | Rarely. |
| `.prettierrc`, `.oxlintrc.json` | JSON | Formatter and code-checker settings from the scaffold. | Rarely. |
| `.env` | dotenv | Your real `DATABASE_URL`, `ADMIN_KEY`, `CORS_ORIGIN`, `PORT`. **Never committed.** | When a value changes. |
| `/.gitignore` (repo root) | Git ignore patterns | Now also ignores `*.tsbuildinfo`, TypeScript's build cache. | Rarely. |

---

## c. A request's journey through the API

Following `POST /requests` from the form (or your curl):

1. **The request arrives** on port 3001: method `POST`, path `/requests`, header `Content-Type: application/json`, and a JSON body.
2. **CORS check (browser only).** If it came from a web page, the browser has already asked "may I?" (the preflight). The API answered with `Access-Control-Allow-Origin: <CORS_ORIGIN>`, and the browser only goes ahead if that matches the page's address. curl skips this entirely.
3. **Routing.** Nest finds the class marked `@Controller('requests')` and its method marked `@Post()`.
4. **Guards.** POST has none, so it passes. (For `GET /requests`, AdminKeyGuard runs here and stops the request with **401** if the key is missing or wrong.)
5. **Pipes.** The global ValidationPipe turns the JSON into a `CreateRequestDto`, strips unknown fields (`whitelist`), and checks every rule. Any failure → **400** with the list of messages; the controller never runs.
6. **Controller.** `create(@Body() body)` receives the clean data and hands it to `RequestsService`.
7. **Service.** `RequestsService.create` calls Prisma with `select: { id: true, createdAt: true }`.
8. **Prisma → Postgres.** Prisma creates the cuid, sends SQL to Railway, Postgres stamps `createdAt` and returns just those two columns.
9. **Response.** Nest turns the result into JSON and replies **201 Created** with `{ "id": "...", "createdAt": "..." }`.
10. **If something unexpected breaks** (e.g. the database is down), Nest replies **500** with a generic message and logs the details on the server, never to the caller.

---

## d. Key takeaways

### 1. Module, controller, service: three jobs
- A **module** is a labelled box that groups related parts and says what it shares.
- A **controller** speaks HTTP: URL, method, body, status code.
- A **service** does the actual work and knows nothing about HTTP.

One request flows module → controller → service → Prisma and back. Keeping the jobs apart means each one is small, and the service can be reused and tested without a web server.

👉 Box: [requests.module.ts:7-10](../../apps/api/src/requests/requests.module.ts) · Reception: [requests.controller.ts:16-19](../../apps/api/src/requests/requests.controller.ts) · Work: [requests.service.ts:15-22](../../apps/api/src/requests/requests.service.ts)

### 2. Decorators: what the `@` does
A decorator (`@Something`) is a label stuck onto a class, method or parameter. It doesn't run your logic; it attaches information that Nest reads at startup:
- "this class handles `/requests`"
- "this method answers POST"
- "fill this parameter with the body"

You saw Nest read them in the startup log: `Mapped {/requests, POST} route`.

👉 [requests.controller.ts:9](../../apps/api/src/requests/requests.controller.ts) `@Controller('requests')`, line 16 `@Post()`, line 17 `@Body()`, and [requests.service.ts:8](../../apps/api/src/requests/requests.service.ts) `@Injectable()`.

### 3. Dependency injection: receive, don't create
`RequestsService` never writes `new PrismaService()`. Its constructor only *declares* that it needs one, and Nest hands over the single instance it already made. Everyone shares one database connection.

In tests, we tell Nest "give them this fake instead". The service can't tell the difference, so tests never touch Railway.

👉 The request for it: [requests.service.ts:13](../../apps/api/src/requests/requests.service.ts) · The swap in tests: [requests.service.spec.ts:23](../../apps/api/src/requests/requests.service.spec.ts) and [app.e2e-spec.ts:44-45](../../apps/api/test/app.e2e-spec.ts)

### 4. DTOs and the ValidationPipe: the server always checks
A DTO lists the fields a request may contain and the rule for each. The global ValidationPipe enforces those rules on every request: bad input gets **400** with readable messages, and `whitelist` silently drops extra fields like `isAdmin`.

Browser checks are only politeness, because anyone can skip the form and send data with curl. You saw what happens without the pipe: a 1-letter name with `consent: false` was **saved**, and an unknown category crashed with an unhelpful 500.

👉 Rules: [create-request.dto.ts:10-30](../../apps/api/src/requests/dto/create-request.dto.ts) · Switched on: [app.setup.ts:11](../../apps/api/src/app.setup.ts)

### 5. Guards: "who are you?" before "what did you send?"
A guard decides whether a request may continue at all. Nest runs **guards before pipes**, so a caller without the key gets 401 and their body is never even inspected.

Validation checks *what* you sent; a guard checks *who* is asking. Ours also:
- compares in constant time,
- gives the same message for "missing" and "wrong",
- **fails closed** if `ADMIN_KEY` isn't set.

👉 [admin-key.guard.ts:23-26](../../apps/api/src/auth/admin-key.guard.ts) · Applied to GET only: [requests.controller.ts:24](../../apps/api/src/requests/requests.controller.ts)

### 6. HTTP basics
- **Methods** say what you want: `GET` reads, `POST` creates.
- **Headers** are labels on the request or reply (`Content-Type`, `x-admin-key`, `Access-Control-Allow-Origin`).
- **JSON bodies** carry the data.
- **Status codes** say how it went:

| Code | Meaning | Where you saw it |
|---|---|---|
| **200** OK | Here's what you asked for. | `GET /health`, `GET /requests` with key |
| **201** Created | Saved a new thing. | valid `POST /requests` |
| **400** Bad Request | *You* sent something wrong. | invalid `POST /requests` |
| **401** Unauthorized | Prove who you are first. | `GET /requests` without/with wrong key |
| **500** Internal Server Error | *I* broke. | before the ValidationPipe existed |

👉 201 is Nest's default for `@Post()`: [requests.controller.ts:13](../../apps/api/src/requests/requests.controller.ts) · The checks in code: [app.e2e-spec.ts](../../apps/api/test/app.e2e-spec.ts)

### 7. CORS: the browser enforces it, the API names who's trusted
Your web app (`localhost:3000`, later Vercel) and the API (`localhost:3001`, later Railway) are different **origins**, and browsers block cross-origin calls by default. The API's job is to declare "I trust this one address" (`Access-Control-Allow-Origin`). The visitor's **browser** compares that with the page's address and refuses to hand the reply to any other site.

curl ignores CORS. That's why CORS never replaces the admin-key guard.

👉 [app.setup.ts:17-22](../../apps/api/src/app.setup.ts)

### 8. Next.js API routes vs. a separate NestJS backend
In your previous project, `app/api/.../route.ts` files lived inside the website. Same origin, so no CORS, and one deploy. It's quick to start, but:
- validation, auth and database access tend to get copy-pasted into each route,
- you can't easily swap the database for a fake in tests.

A separate NestJS backend gives:
- a fixed structure (module/controller/service),
- one place for validation and guards,
- dependency injection for testing,
- independent deploys and scaling of the API.

It also lets other clients use the same API later: a mobile app, a script, another team. The cost is two apps to run and deploy, plus CORS. Teams pick it when the backend is expected to grow, or more than one client will use it.

👉 Compare [main.ts](../../apps/api/src/main.ts) (startup is visible and yours) with Next.js, where it's hidden.

### 9. Only return what the caller needs
The privacy rule ("POST returns only id and createdAt") is enforced at the **database query** with `select`, so the name and email never even come back from Postgres. A unit test fails if anyone widens it. We proved that by breaking it on purpose and watching the test fail.

👉 [requests.service.ts:20](../../apps/api/src/requests/requests.service.ts) · Test: [requests.service.spec.ts](../../apps/api/src/requests/requests.service.spec.ts) "asks the database for only id and createdAt" · Controller side: [app.e2e-spec.ts:64](../../apps/api/test/app.e2e-spec.ts)

---

## e. Glossary

| Term | Meaning |
|---|---|
| **NestJS** | A framework for building backend servers in TypeScript, with a fixed structure of modules, controllers and services. |
| **Framework** | A ready-made structure you fill in, like Next.js for websites. |
| **Nest CLI** | The `nest` command: creates projects (`nest new`), builds (`nest build`), runs (`nest start --watch`). |
| **Node.js** | The program that runs JavaScript outside the browser. It runs the API. |
| **nvm** | Node Version Manager: keeps several Node versions side by side and switches between them. |
| **LTS** | Long-Term Support: a version that gets security fixes for years. |
| **Port** | A numbered door on a computer that a server listens on (API: 3001, web: 3000). |
| **Module** | A labelled box grouping related controllers and providers. |
| **Controller** | The class that receives HTTP requests and returns replies. |
| **Service** | A class that does the real work (here, database queries). |
| **Provider** | Nest's word for anything it can create and hand out; services are providers. |
| **`exports`** | The parts of a module other modules may use. |
| **`@Global()`** | Makes a module's exports available everywhere without importing it. |
| **Decorator** | An `@` label that attaches information Nest reads at startup. |
| **Dependency** | Something a piece of code needs to work. |
| **Dependency injection** | Receiving dependencies from outside instead of creating them yourself. |
| **Constructor** | The function that runs when a class is created; Nest fills in its parameters. |
| **`private readonly`** | Stores a constructor parameter on the class, private to it and not replaceable. |
| **`extends`** | "Is a kind of": PrismaService *is* a PrismaClient plus extra behaviour. |
| **Lifecycle hook** | A method Nest calls at a set moment (`onModuleInit` at startup, `onModuleDestroy` at shutdown). |
| **dotenv** | Library that loads `.env` into `process.env`. |
| **DTO** | Data Transfer Object: a class describing the allowed shape of incoming data. |
| **Validation** | Checking data against rules before using it. |
| **Pipe** | A Nest step that checks or transforms data before the controller runs. |
| **ValidationPipe** | Nest's built-in pipe that enforces DTO rules. |
| **`whitelist`** | ValidationPipe option that drops fields the DTO doesn't declare. |
| **Mass assignment** | An attack that sneaks extra fields (`isAdmin`) into a save. |
| **Guard** | A Nest step that decides if a request may continue at all. |
| **Shared secret** | A password both sides know (here `ADMIN_KEY`). |
| **Constant-time comparison** | Comparing secrets in a way that takes the same time whether they match or not, so timing leaks nothing. |
| **Failing closed** | When something's misconfigured, refuse access rather than allow it. |
| **Route** | One method + URL the API answers, e.g. `POST /requests`. |
| **HTTP method** | The verb of a request: `GET` reads, `POST` creates. |
| **Status code** | The 3-digit result of a request (200, 201, 400, 401, 500). |
| **Header** | A label sent with a request or reply. |
| **Custom header** | A header you define, like `x-admin-key`. |
| **JSON body** | The data part of a request or reply, written as JSON. |
| **Origin** | Scheme + domain + port of a web address, e.g. `http://localhost:3000`. |
| **CORS** | Cross-Origin Resource Sharing: browser-enforced rule about which other origins may read an API's replies. |
| **Preflight** | The browser's automatic `OPTIONS` "may I?" request before certain cross-origin calls. |
| **Health check** | A tiny endpoint monitors call to confirm the app is alive. |
| **Unit test** | Tests one piece alone with its surroundings faked. |
| **End-to-end (e2e) test** | Tests the whole chain together via real HTTP requests. |
| **Mock / fake** | A stand-in that records calls and returns made-up answers (`vi.fn()`). |
| **Vitest** | The test runner that finds and runs our tests. |
| **supertest** | Library that sends HTTP requests to the app inside a test. |
| **curl** | Command-line tool for sending HTTP requests (`curl.exe` on Windows PowerShell). |
| **`npm audit`** | Checks installed libraries against a list of known security issues. |
| **`git rm --cached`** | Stop tracking a file but keep it on disk. |
| **`git rm`** | Delete a file and stage the deletion. |
| **`git restore`** | Throw away uncommitted changes to a file. |

---

## f. Exercises (easiest first)

### 1. Change a validation rule
Allow names up to 100 characters. In `src/requests/dto/create-request.dto.ts`, change `@Length(2, 80)` to `@Length(2, 100)`. With `npm run start:dev` running, send a 90-character name with curl and watch it become 201. Run `npm run test:e2e` to see nothing broke. (The web form's limit would need the same change, which is the web role's file.)

### 2. Add a field to the health check
Make `/health` also say what time the server thinks it is. In `src/app.controller.ts`, return `{ status: 'ok', time: new Date().toISOString() }`. Then `npm run test` **fails**, because `src/app.controller.spec.ts` expects exactly `{ status: 'ok' }`. Read the failure, then update the test: that's how tests keep code and expectations in step.

### 3. Add `GET /requests/count` (admin only)
Return `{ count: <number> }`:
- In `src/requests/requests.service.ts`, add `count() { return this.prisma.featureRequest.count(); }`.
- In `src/requests/requests.controller.ts`, add a method with `@Get('count')` and `@UseGuards(AdminKeyGuard)` that returns `{ count: await this.requestsService.count() }`.

Make it `async`. Try it with and without the key, then add a 401 and a 200 test to `test/app.e2e-spec.ts`. You'll need a `count` entry in the fake Prisma.

---

## Notes for other roles

- **Deploy role:** Railway must run Node **22 or newer** (we use 24); Nest 12 doesn't support Node 20. Set `ADMIN_KEY`, `CORS_ORIGIN` (the Vercel URL) and `DATABASE_URL` (the private one) in Railway. Build with `npm run build` (which runs `prisma generate` first) and start with `npm run start:prod`. `GET /health` can serve as the health check.
- **Database role:** `npm audit` flags 4 high-severity issues inside the Prisma CLI's own dependencies (dev tool only, not in the running API). The suggested fix downgrades Prisma to 6, so it wasn't applied; revisit when Prisma ships a patched 7.x.
- **Frontend role:** call `POST /requests` with JSON and show the `message` array from a 400; send `x-admin-key` on `GET /requests`.
