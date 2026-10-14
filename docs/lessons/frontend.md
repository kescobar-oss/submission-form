# Lessons: Frontend Engineer

Role branch: `feat/frontend` · Builds on the merged API in [kescobar-oss/submission-form#2](https://github.com/kescobar-oss/submission-form/pull/2)

---

## a. What we built

We created `apps/web`, a Next.js (App Router) website styled with Material UI, with a shared theme, Roboto and a top bar on every page.
It has three pages: the form at `/` (later moved to `/new` behind a welcome page; see "Update: the welcome page" below), a confirmation at `/success?id=…`, and an admin table at `/submissions` that asks for the admin key and shows priority as coloured chips.
The form keeps everything you type in React state, checks it in the browser with the same rules as the API, and shows a spinner, the API's own messages or a "couldn't reach the server" alert depending on what happens.
Every call to the API lives in one file, `lib/api.ts`, with shared TypeScript types in `lib/types.ts`.
You ran the API, the web app and Prisma Studio side by side, submitted a real request, checked all four error cases and passed `npm run build`.

---

## b. File map

All paths are inside `apps/web/`.

| Path | Language | Purpose | Will you edit it again? |
|---|---|---|---|
| `app/layout.tsx` | TypeScript + JSX | Wraps every page: loads Roboto, applies the theme and CssBaseline, adds the header and the centred column. | Rarely. |
| `app/page.tsx` | TypeScript + JSX | The welcome page at `/`: heading, one line and the three category cards. Server component. | Sometimes (wording). |
| `app/new/page.tsx` | TypeScript + JSX | The page at `/new`: reads `?category=`, keeps it only if allowed, and shows the form with it pre-selected. | Rarely. |
| `components/CategoryCards.tsx` | TypeScript + JSX | The three clickable cards on the welcome page; their wording is in the `CHOICES` list. Client component. | **Yes**, to change card wording. |
| `app/success/page.tsx` | TypeScript + JSX | The page at `/success`: reads `?id=` and shows the reference ID and "Submit another". | Rarely. |
| `app/submissions/page.tsx` | TypeScript + JSX | The page at `/submissions`: heading plus the admin view. Server component. | Rarely. |
| `components/RequestForm.tsx` | TypeScript + JSX | The form: state, validation, sending, loading/success/error. Client component. | **Yes**, whenever a field changes. |
| `components/SubmissionsView.tsx` | TypeScript + JSX | Admin key field, Load button, table with priority chips. Client component. | **Yes**, e.g. new columns. |
| `components/SiteHeader.tsx` | TypeScript + JSX | The blue AppBar with the title and the two navigation buttons. | Sometimes. |
| `theme.ts` | TypeScript | Colours, font and responsive heading sizes for the whole app. | **Yes**, for any look-and-feel change. |
| `lib/api.ts` | TypeScript | The only file that talks to the API (`createRequest`, `listRequests`). | Sometimes (new endpoints). |
| `lib/types.ts` | TypeScript | What a feature request looks like, plus the category/priority lists and labels. | **Yes**, whenever the API's data changes. |
| `lib/validation.ts` | TypeScript | The browser's copy of the API's rules, and the mapping of API messages to fields. | **Yes**, together with the API's DTO. |
| `.env.example` | env file | Committed template: `NEXT_PUBLIC_API_URL` with a placeholder. | Rarely. |
| `.env.local` | env file | Your real local value. Ignored by Git. | Rarely. |
| `.gitignore` | Git config | Ignores `node_modules`, `.next`, `.env*`, except `.env.example`. | Rarely. |
| `package.json` / `package-lock.json` | JSON | Packages, and the `dev`/`build`/`start` commands (port 3002). | Only when installing packages. |
| `next.config.ts`, `tsconfig.json`, `eslint.config.mjs` | TS / JSON / JS | Settings for Next.js, TypeScript and the linter. Generated. | Rarely. |
| `AGENTS.md` | Markdown | Generated note telling AI tools to read the docs bundled with this Next.js version. | No. |

---

## c. A request's journey through the frontend

1. You open `http://localhost:3002/` and see the welcome page. Clicking a card (e.g. **Report a bug**) goes to `/new?category=BUG`. That page reads `category` from the address, checks it's an allowed value, and sends the HTML for the heading and the form with **Bug** pre-selected, plus the JavaScript for `RequestForm` (the only interactive part).
2. Each keystroke runs `onChange`, which calls `update(...)`, which stores the new text in the `values` state. React redraws the field from that state.
3. You press **Submit request**. `handleSubmit` stops the browser's default page reload and runs `validate(values)` from `lib/validation.ts`.
4. If anything is wrong, the messages go into the `errors` state, each field shows its own `error` + `helperText`, and nothing is sent.
5. If everything is valid, `submitting` becomes `true`: the button is disabled and shows a spinner (the **loading** state).
6. `createRequest(...)` in `lib/api.ts` turns the values into JSON and `fetch`es `POST {NEXT_PUBLIC_API_URL}/requests`. The function `await`s the reply.
7. The browser first checks CORS: the API at 3001 must allow `http://localhost:3002`. It does, thanks to `CORS_ORIGIN` in the API's `.env`.
8. `send()` sorts the reply into one outcome: `ok` (201), `validation` (400), `unauthorized` (401), `server` (other status) or `network` (no reply at all).
9. **Success**: `router.push('/success?id=…')`. The success page reads `id` from the URL and shows it.
10. **Error**: `submitting` goes back to `false`. 400 messages are placed under the matching fields; network and server problems show an Alert above the button. `values` is never cleared, so your answers stay.

The admin page follows the same pattern: the key goes into state, **Load** calls `listRequests(key)` (sending it as the `x-admin-key` header), and the reply becomes a table, a "wrong key" Alert or a "couldn't reach the server" Alert.

---

## d. Key takeaways

### 1. Components and props: configure, don't build

A MUI `TextField` is a finished component: the label, the border, the animation and the red error look are built in. You only set **props**: `label`, `value`, `error`, `helperText`, `fullWidth`. In your Tailwind project you'd have built the same field from an `<input>`, a `<label>`, a `<p>` and a dozen classes.

👉 [components/RequestForm.tsx:117-127](../../apps/web/components/RequestForm.tsx) (the Name field), especially `error` and `helperText` on lines 122-123.

### 2. Material UI vs. Tailwind, and when to use `sx`

Tailwind gives you small utility classes (`px-4 bg-blue-600`) to build every look yourself. MUI gives you finished components plus a **theme**: one file that sets colours, font and sizes for all of them. Use the theme for rules the whole app shares, and the `sx` prop for a one-off adjustment to a single component. Responsive values use breakpoints: `{ xs: …, sm: … }`.

👉 Theme: [theme.ts:11-14](../../apps/web/theme.ts) (`responsiveFontSizes`, `primary`). One-off: [components/SiteHeader.tsx:22](../../apps/web/components/SiteHeader.tsx) (`fontSize: { xs: '1rem', sm: '1.25rem' }`) and [app/layout.tsx:40](../../apps/web/app/layout.tsx) (`py: { xs: 2, sm: 4 }`).

### 3. State and controlled inputs

`useState` gives a component a memory. Calling the setter stores the new value **and** redraws the component. A **controlled input** reads its `value` from state and writes every change back with `onChange`, so state is the one source of truth: validation, the character counter and the data we send all read from the same place.

👉 [components/RequestForm.tsx:47](../../apps/web/components/RequestForm.tsx) (`useState<FormValues>`), then lines 119-120 (`value={values.name}` / `onChange`).

### 4. Client components vs. server components

In the App Router every component is a **server component** unless its file starts with `'use client'`. Server components run once to produce HTML and send no JavaScript for themselves. A form must react to keystrokes and clicks, and `useState`/`onChange` only work in the browser, so it has to be a client component. Rule of thumb: keep pages on the server and mark only the interactive pieces as client.

👉 [app/page.tsx:6](../../apps/web/app/page.tsx) (server, no directive) vs. [components/RequestForm.tsx:1](../../apps/web/components/RequestForm.tsx) (`'use client'`).

### 5. `fetch` and `async`/`await`

`fetch` is the browser's way to send a request to another server. Data must travel as text, so `JSON.stringify` turns the form's object into a JSON string and the `Content-Type` header tells the API how to read it. `await` pauses only that one function until the reply arrives; the rest of the page keeps working, which is why the spinner can spin.

👉 [lib/api.ts:30](../../apps/web/lib/api.ts) (`JSON.stringify`), [lib/api.ts:48](../../apps/web/lib/api.ts) (`await fetch`), and [components/RequestForm.tsx:76](../../apps/web/components/RequestForm.tsx) (`await createRequest`).

### 6. Three UI states for every request

A request is always **loading**, **succeeded** or **failed**, and each needs something on screen: a disabled button with a spinner, the next page, or a message. Forget one and users see a frozen button or a silent failure. `ApiResult` lists every outcome, so TypeScript reminds each page to handle them all.

👉 [lib/api.ts:12](../../apps/web/lib/api.ts) (`ApiResult`), [components/RequestForm.tsx:55](../../apps/web/components/RequestForm.tsx) (`submitting`), line 90 (success), lines 95-105 (errors), line 216 (`loading={submitting}`).

### 7. `NEXT_PUBLIC_` variables are public

Any variable whose name starts with `NEXT_PUBLIC_` is pasted into the JavaScript that every visitor downloads, where anyone can read it with the browser's developer tools. That's fine for the API's address. It must never hold a secret: `ADMIN_KEY` and `DATABASE_URL` stay on the API's side only. That's also why the admin types the key on `/submissions` instead of the site "knowing" it.

👉 [lib/api.ts:8](../../apps/web/lib/api.ts) and the warning in [.env.example:7](../../apps/web/.env.example).

### 8. Browser validation is for convenience; server validation is for safety

The browser's checks give instant, friendly feedback without a round trip. But anyone can skip our page and send anything straight to the API, as we did with curl in step 9, so the API checks everything again with its DTO and refuses bad data with 400. The browser rules can be looser (our email check is) because the server has the final word.

👉 [lib/validation.ts:2](../../apps/web/lib/validation.ts) (the comment), [lib/validation.ts:73](../../apps/web/lib/validation.ts) (`apiMessagesToErrors`, which shows the API's 400 messages under the fields).

### 9. Keep secrets in memory, not in the browser's storage

The admin key lives only in `useState`. It's never written to `localStorage` or a cookie, so reloading or closing the tab forgets it, and the next person at that computer can't find it. A wrong key also clears any table that was showing.

👉 [components/SubmissionsView.tsx:41](../../apps/web/components/SubmissionsView.tsx) and line 64 (`setRows(null)`).

---

## e. Glossary

| Term | Meaning |
|---|---|
| **Scaffolding** | Letting a tool generate a project's starting files (`create-next-app`). |
| **npx** | Runs a package's command once without installing it permanently. |
| **Branch** | A separate line of commits; `main` stays untouched until a pull request merges it. |
| **JSX** | The HTML-looking syntax inside `.tsx` files, e.g. `<Button>Send</Button>`. |
| **Material UI (MUI)** | A library of ready-made React components that follow Google's Material Design. |
| **Emotion** | The engine MUI uses to turn its styles into CSS at runtime. You never write it directly. |
| **Component** | A reusable piece of interface, written as a function that returns JSX. |
| **Props** | The settings you pass to a component, written like HTML attributes. |
| **Theme** | One object holding the app's colours, fonts and sizes, read by every MUI component. |
| **ThemeProvider** | The wrapper that hands the theme to every component inside it. |
| **CssBaseline** | MUI's reset that removes browser default styles so every browser looks the same. |
| **AppBar** | MUI's top bar component. |
| **`sx` prop** | MUI's way to add one-off styles to a single component. |
| **Breakpoint** | A screen-width threshold: `xs` from 0 px, `sm` from 600 px, `md` from 900 px. |
| **State (`useState`)** | A component's memory; changing it redraws the component. |
| **Controlled input** | An input whose value comes from state and whose changes go back into state. |
| **Server component** | Runs only on the server to produce HTML; the default in the App Router. |
| **Client component** | Marked with `'use client'`; its code also runs in the browser so it can react to the user. |
| **Type (TypeScript)** | A description of what data must look like, checked before the app runs. |
| **`fetch`** | The browser's built-in function for sending HTTP requests. |
| **`async` / `await`** | Marks a function that waits for slow work, and the point where it waits. |
| **JSON** | The text format used to send data between the browser and the API. |
| **Header** | Extra information attached to a request, like `Content-Type` or `x-admin-key`. |
| **Query string** | The part of a URL after `?`, e.g. `?id=abc`. |
| **Suspense** | A React boundary that shows a placeholder until something inside it is ready. |
| **Skeleton** | MUI's grey placeholder bar, used as a Suspense fallback. |
| **Chip** | MUI's small rounded label, used here for priority. |
| **Alert** | MUI's coloured message box (error, warning, info, success). |
| **Loading / success / error states** | The three things any request can be doing, each needing its own screen. |
| **`NEXT_PUBLIC_` variable** | An environment variable Next.js copies into the browser's JavaScript. Public by design. |
| **`localStorage`** | The browser's long-term storage for a website. We deliberately don't use it for the key. |
| **Port** | A numbered "door" on your computer; only one program can listen on each. |
| **CORS** | The browser's rule that a page may only call another server if that server allows the page's address. |
| **Production build** | `npm run build`: the optimised version that Vercel will run, and the strictest error check. |
| **`searchParams`** | Next.js's name for the query string a page receives. In this version it's a Promise, so the page awaits it. |
| **Card** | MUI's box with a light shadow that groups related content. |
| **CardActionArea** | Makes a whole Card one clickable area, with a hover shade and ripple. |
| **Data-driven list** | Content kept in a list and drawn with `.map()`, so changing words never means touching layout code. |
| **Static / Partial Prerender** | Pages built ahead of time (○), or built ahead except for parts filled in per visit (◐). |

---

## f. Exercises (easiest first)

### 1. Change the brand colour

In `apps/web/theme.ts`, change `primary: { main: '#3949ab' }` to another colour, e.g. `'#2e7d32'` (green). With `npm run dev` running, watch the AppBar, the Submit button and the focused fields all change at once. That's the theme at work.

### 2. Change a priority chip's colour

In `apps/web/components/SubmissionsView.tsx`, change `LOW: 'success'` in `PRIORITY_COLORS` to `LOW: 'default'` and reload `/submissions`. Then try `'info'` or `'secondary'`. Notice you're picking a *meaning* and the theme supplies the shade.

### 3. Allow longer names, in both places

Make names up to 100 characters. In `apps/web/lib/validation.ts`, change `NAME_MAX = 80` to `100`. Try a 90-character name: the browser accepts it, but the API replies 400 and the message appears under the field. That's takeaway 8. Now the API's DTO also needs `@Length(2, 100)`; that's the backend's file (`apps/api/src/requests/dto/create-request.dto.ts`), so you'd make that change on a backend branch.

---

## Update: the welcome page

Branch `feat/welcome-page`, added after the frontend role was merged.

**What changed.** The homepage `/` is now a welcome page that asks what you'd like to send: **Report a bug**, **Suggest an improvement** or **Request a feature**. Each card opens the form at `/new` with that category already selected, e.g. `/new?category=BUG`, and the dropdown can still be changed. Opening `/new` directly, or with a made-up category, shows the form with nothing selected. The header's **New** button and the success page's **Submit another** both lead to the welcome page. The database and API didn't change: the three cards are the three categories that already existed.

**Takeaways**

1. **Passing settings through a link.** The query string (`?category=BUG`) lets one page tell the next what was chosen, with no shared state. The page reads it from `searchParams`, which this Next.js version gives as a Promise, so it's awaited inside a `<Suspense>` boundary, exactly like `/success` reads `?id=`.
   👉 [app/new/page.tsx:32-35](../../apps/web/app/new/page.tsx)
2. **Never trust the address bar.** Anyone can type any link, so only an exact allowed value is used and everything else is ignored. The API would still reject a bad value, but the page shouldn't show one either.
   👉 [app/new/page.tsx:40-42](../../apps/web/app/new/page.tsx) (`toCategory`)
3. **An optional prop with a starting value.** `RequestForm` takes `initialCategory` and uses it only to fill its starting state; after that, the visitor is in control.
   👉 [components/RequestForm.tsx:43-50](../../apps/web/components/RequestForm.tsx)
4. **Data-driven cards.** The three cards come from one `CHOICES` list drawn with `.map()`. Changing wording, or adding a card for a new category, means editing that list only.
   👉 [components/CategoryCards.tsx:13-17](../../apps/web/components/CategoryCards.tsx)

**Exercise.** Change the text under **Request a feature** in the `CHOICES` list in `apps/web/components/CategoryCards.tsx`, save, and watch `http://localhost:3002/` update. Then try `http://localhost:3002/new?category=IMPROVEMENT` and `?category=improvement` (lowercase). Why does the second one leave the dropdown empty?

---

## Notes for other roles

- **Ports:** the web app runs on **3002** (`npm run dev` / `npm start`), the API on **3001**. Port 3000 is kept free for another project. Locally, the API's `CORS_ORIGIN` must be `http://localhost:3002`. `apps/api/.env.example` still says `http://localhost:3000`; the backend role may want to update that placeholder.
- **Deploy role (Vercel):** set the project's root directory to `apps/web` and add `NEXT_PUBLIC_API_URL` = the Railway API URL (no trailing slash). Because it's `NEXT_PUBLIC_`, it's baked in at build time, so redeploy after changing it. Then set the API's `CORS_ORIGIN` on Railway to the Vercel URL.
- **`npm audit`:** `npm install` reported 5 high-severity issues in build-time dependencies. `npm audit fix --force` was **not** run, because it can install breaking versions. Worth a look in a separate change.
- **Next.js 16 config:** the scaffold enabled `cacheComponents` and `partialPrefetching` in `next.config.ts`. That's why `/success` reads `searchParams` inside a `<Suspense>` boundary.
