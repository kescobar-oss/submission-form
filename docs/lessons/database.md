# Lessons: Database Engineer

Role branch: `feat/database` · Pull request: [kescobar-oss/submission-form#1](https://github.com/kescobar-oss/submission-form/pull/1)

---

## a. What we built

We set up a monorepo with two app folders, `apps/api` and `apps/web`, and a `.gitignore` that keeps secrets and downloaded libraries out of Git.
Inside `apps/api`, we described the database in a Prisma schema: two enums (`Category`, `Priority`) and one `FeatureRequest` table with an index on `createdAt`.
We created a PostgreSQL database on Railway, opened public access to it, and connected to it from the laptop through `DATABASE_URL` in a private `.env` file.
We generated and applied the first migration (the SQL that built the table), then filled the table with three example rows from a seed script and viewed them in Prisma Studio.
Finally, we committed a `.env.example` template and opened a pull request without merging it.

---

## b. File map

| Path | Language | Purpose | Will you edit it again? |
|---|---|---|---|
| `README.md` | Markdown | The project's front page: the two apps, where they deploy, and the rule about secrets. | Sometimes, when the project changes. |
| `.gitignore` | Git ignore patterns | Tells Git to never save `node_modules`, any `.env` file (except `.env.example`), or build output. | Rarely. |
| `apps/api/.gitignore` | Git ignore patterns | Prisma's own ignore list. It mainly ignores `generated/prisma`. | Rarely. |
| `apps/api/package.json` | JSON | The API's "ID card": its name and the libraries it needs. | Yes. It changes whenever a library is added. |
| `apps/api/package-lock.json` | JSON | The exact version of every installed library, so everyone gets identical copies. | Never by hand. npm updates it. |
| `apps/api/prisma/schema.prisma` | Prisma Schema Language | The blueprint of the database: enums, the table and its columns, and the index. | **Yes.** It's the main file for any data change. |
| `apps/api/prisma7.config.ts` | TypeScript | Prisma 7 settings: where the schema and migrations live, where the database URL comes from, and how to seed. | Rarely. |
| `apps/api/prisma/migrations/20261009093247_init/migration.sql` | SQL | The exact instructions that built the table on Railway. | **Never.** Applied migrations are permanent history. Make a new one instead. |
| `apps/api/prisma/migrations/migration_lock.toml` | TOML | Locks the migrations to PostgreSQL. | Never. |
| `apps/api/prisma/seed.ts` | TypeScript | Replaces the three `@example.com` example rows. Safe to run repeatedly. | Sometimes, to change example data. |
| `apps/api/.env.example` | Env file | A template listing the API's four settings, with fake values. Committed. | When a new setting is added. |
| `apps/api/.env` | Env file | Your **real** settings, including the database password. **Not committed.** | When a secret changes. |
| `apps/api/generated/prisma/` | TypeScript (generated) | Prisma Client, rebuilt by `npx prisma generate`. **Not committed.** | Never. It's regenerated. |
| `docs/lessons/database.md` | Markdown | This file. | Add your own notes any time. |

---

## c. The request's journey through the database layer

The API role will write the code that calls Prisma. This is what happens from the moment that code saves a form submission:

1. **The API calls Prisma Client**, e.g. `prisma.featureRequest.create({ data: {...} })`. Because Prisma Client was generated from our schema, TypeScript already checked that `category` is one of `BUG | IMPROVEMENT | NEW_FEATURE` before anything runs.
2. **Prisma Client creates the `id`.** `@default(cuid())` lives in Prisma, not in Postgres, so the cuid is generated in TypeScript, just before sending.
3. **Prisma turns the call into SQL** (an `INSERT INTO "FeatureRequest" ...` statement) and hands it to the **driver adapter** (`@prisma/adapter-pg`).
4. **The `pg` library sends the SQL over the network** to the address in `DATABASE_URL`. On Railway, that's the private `postgres.railway.internal` address. On your laptop, it's the public `*.proxy.rlwy.net` address.
5. **Postgres checks its rules.** Every `NOT NULL` column must have a value, `category`/`priority` must be valid enum values, and the `id` must be unique (primary key). Any failure rejects the whole row.
6. **Postgres fills in `createdAt`** using `DEFAULT CURRENT_TIMESTAMP`, because that default lives in the database itself.
7. **Postgres writes the row** to disk (the Railway volume) and **updates the `createdAt` index** so the new row is in sorted position.
8. **Postgres returns the saved row** to Prisma, which hands it back to the API as a normal object. The API then sends only `{ id, createdAt }` to the browser.

For the admin page (`GET /requests`), the API calls `findMany({ orderBy: { createdAt: "desc" } })`. Postgres reads the `createdAt` index from newest to oldest instead of sorting the whole table.

---

## d. Key takeaways

### 1. An ORM maps models to tables and fields to columns
An **ORM** (Object-Relational Mapper) translates between code objects and database tables, so you describe data once and Prisma writes the SQL.
`model FeatureRequest` became `CREATE TABLE "FeatureRequest"`, and each field became one column with a Postgres type (`String` → `TEXT`, `Boolean` → `BOOLEAN`, `DateTime` → `TIMESTAMP(3)`).
👉 Compare [schema.prisma:33-45](../../apps/api/prisma/schema.prisma) with [migration.sql:8-16](../../apps/api/prisma/migrations/20261009093247_init/migration.sql).

### 2. Migrations are committed history; `dev` writes them, `deploy` applies them
A **migration** is a dated SQL file that moves the database from one shape to the next. They're committed to Git because they're the only record of how the database got its shape, and production rebuilds itself from them.
`prisma migrate dev` (on your laptop) **compares** the schema to the database, **writes** a new migration and applies it. `prisma migrate deploy` (on the server) **only applies** existing files. It never writes new ones and never resets data.
👉 [migrations/20261009093247_init/migration.sql](../../apps/api/prisma/migrations/20261009093247_init/migration.sql). The `checksum` in the `_prisma_migrations` table is why you never edit an applied migration.

### 3. A primary key uniquely identifies a row; we use cuid instead of a counter
A **primary key** is the column that's guaranteed unique for each row, like a passport number. A counter (1, 2, 3...) would let anyone holding `/success?id=5` guess that `4` and `6` exist. A **cuid** is long and random, so it's unguessable, and since it's made by Prisma it also works without asking the database for the next number.
👉 [schema.prisma:36](../../apps/api/prisma/schema.prisma) (`@id @default(cuid())`) and [migration.sql:18](../../apps/api/prisma/migrations/20261009093247_init/migration.sql) (`PRIMARY KEY ("id")`).

### 4. Enums are fixed lists the database enforces
An **enum** is a type that only allows the listed values, like a dropdown instead of a free-text box. With free text you'd get `bug`, `Bug`, `BUG ` and `defect` all meaning the same thing, and filtering would break. Postgres itself rejects anything not on the list, and Prisma Client gives you autocompletion.
👉 [schema.prisma:20-30](../../apps/api/prisma/schema.prisma) and [migration.sql:2,5](../../apps/api/prisma/migrations/20261009093247_init/migration.sql) (`CREATE TYPE ... AS ENUM`).

### 5. Environment variables hold secrets; `.env` is never committed
An **environment variable** is a named setting the program reads from where it's running, so the same code uses different values on your laptop and on Railway. A connection URL packs everything needed to log in: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`. Because it contains the password, it lives only in `.env`, which Git ignores. Anything committed stays in history forever.
👉 [prisma7.config.ts:14](../../apps/api/prisma7.config.ts) (`process.env["DATABASE_URL"]`), [.gitignore:6-9](../../.gitignore), and the fake example at [.env.example:7](../../apps/api/.env.example).

### 6. Prisma Client is generated code; regenerate after every schema change
**Prisma Client** is TypeScript code that Prisma writes *from your schema*: functions like `featureRequest.create()` plus types that know every field. If you change the schema but don't run `npx prisma generate`, the client still describes the *old* schema, and your code will be wrong or won't compile. In Prisma 7, `migrate dev` no longer generates for you.
👉 [schema.prisma:7-10](../../apps/api/prisma/schema.prisma) (the `generator`) and [seed.ts:10](../../apps/api/prisma/seed.ts) (`new PrismaClient`), which would fail without it.

### 7. An index makes sorting and searching fast
An **index** is a separate sorted list of one column's values, each pointing to its row, like the index at the back of a book. Without it, "newest first" means Postgres sorts every row on every request. With it, Postgres reads the list from the end. The cost: each insert updates the index too, and it takes some disk space.
👉 [schema.prisma:49](../../apps/api/prisma/schema.prisma) (`@@index([createdAt])`) and [migration.sql:22](../../apps/api/prisma/migrations/20261009093247_init/migration.sql) (`CREATE INDEX`).

### 8. Some defaults live in Prisma, some in Postgres
`@default(now())` became `DEFAULT CURRENT_TIMESTAMP` **in the database**, but `@default(cuid())` did **not** appear in the SQL at all. Postgres can't make cuids, so Prisma does it. Anyone writing raw SQL must supply the `id` themselves.
👉 [migration.sql:9 vs 16](../../apps/api/prisma/migrations/20261009093247_init/migration.sql).

### 9. Idempotent scripts are safe to rerun
The seed deletes only `@example.com` rows before inserting, so running it twice still leaves exactly three rows, and real submissions are never touched.
👉 [seed.ts:46-52](../../apps/api/prisma/seed.ts).

### 10. A terminal always "stands" in one folder
npm and Prisma act on the folder your prompt shows. Running them from the top folder created stray files and "can't find schema/URL" errors. Each terminal tab has its own folder, so check that the prompt ends in `\apps\api>`.

---

## e. Glossary

| Term | Meaning |
|---|---|
| **Git repository** | A folder where Git records every saved version of your files. |
| **Branch** | A separate line of work inside a repo, like a draft copy you can merge back later. |
| **Commit** | A saved snapshot of your files plus a message describing the change. |
| **Parent (commit)** | The commit that came right before a given commit. |
| **Staging area** | The "ready to commit" list that `git add` fills. |
| **`.gitignore`** | A file listing patterns of files Git should pretend don't exist. |
| **Monorepo** | One repository holding several programs (here: `api` and `web`). |
| **Remote / `origin`** | A named link to a copy of the repo stored elsewhere (GitHub). `origin` is the conventional name. |
| **Push** | Upload your commits to the remote. |
| **Upstream (`-u`)** | The remote branch a local branch is linked to, so plain `git push`/`git pull` know where to go. |
| **Orphan branch** | A branch with no history, i.e. a blank starting point. |
| **Rebase** | Replay commits on top of a different starting commit. They get new IDs. |
| **Pull request (PR)** | A request on GitHub to review and merge one branch into another. |
| **`gh`** | GitHub's command-line tool. |
| **Line endings (LF / CRLF)** | Invisible end-of-line characters: Mac/Linux use LF, Windows uses CRLF. Git converts them, hence the warnings. |
| **Node.js** | The program that runs JavaScript/TypeScript outside a browser. |
| **End of life (EOL)** | When a software version stops getting security fixes (Node 20: April 2026). |
| **TypeScript** | JavaScript with types, so mistakes are caught before running. |
| **Package** | A bundle of reusable code published by someone else. |
| **npm** | Node Package Manager: downloads packages and records them in `package.json`. |
| **npx** | Runs a package's command-line tool (e.g. `npx prisma ...`). |
| **`package.json`** | A project's "ID card": its name and the packages it needs. |
| **`package-lock.json`** | The exact versions of every installed package. |
| **`node_modules`** | The folder where npm puts downloaded packages. Never committed. |
| **devDependency** | A package needed only while developing, not when the app runs. |
| **`npm audit` / vulnerability** | npm's check against a public list of known security bugs in packages. |
| **`EBADENGINE`** | npm warning that a package prefers a different Node version. |
| **Release candidate (rc)** | An unfinished test version of software. Avoid it for real projects. |
| **Prisma** | A toolkit that lets you describe a database in a schema and talk to it from TypeScript. |
| **ORM** | Object-Relational Mapper: translates between code objects and database tables. |
| **Schema** | The blueprint of the database (`schema.prisma`). |
| **Model** | A Prisma description of one table. |
| **Column / field** | One piece of data stored for each row (e.g. `email`). |
| **Row** | One record in a table, i.e. one feature request. |
| **Enum** | A type that only allows a fixed list of values. |
| **Primary key** | The column that uniquely identifies each row. |
| **cuid** | A long, random-looking, unguessable ID, partly based on time. |
| **Index** | A sorted lookup list on a column that makes sorting and searching fast. |
| **PostgreSQL (Postgres)** | The database program that actually stores the data. |
| **SQL** | The language databases understand. |
| **`NOT NULL`** | A rule saying a column can never be empty. |
| **`NULL`** | The database's word for "no value". |
| **Constraint** | A rule the database enforces (e.g. primary key). |
| **`DEFAULT`** | The value the database uses when none is given. |
| **`TIMESTAMP(3)` / UTC / `Z`** | Date and time with millisecond precision. `Z` means UTC, the world standard time. |
| **Migration** | A dated SQL file that changes the database's structure one step. |
| **`migrate dev`** | Writes and applies new migrations (laptop only). |
| **`migrate deploy`** | Applies existing migrations only (servers). |
| **`_prisma_migrations`** | Hidden table logging which migrations were applied. |
| **Checksum** | A fingerprint of a file's contents, used to detect edits. |
| **Prisma Client** | Generated TypeScript code for reading and writing your tables. |
| **`prisma generate`** | The command that rebuilds Prisma Client from the schema. |
| **Driver adapter** | The plug between Prisma and a database library (`@prisma/adapter-pg`). |
| **`pg`** | The standard Node.js library for talking to Postgres. |
| **`dotenv`** | A library that loads `.env` into environment variables. |
| **`tsx`** | A tool that runs TypeScript files directly. |
| **Seed** | A script that inserts starter/example data. |
| **Idempotent** | Safe to run many times with the same result. |
| **Prisma Studio** | A local website that shows your tables like a spreadsheet. |
| **Server** | A program that keeps running and answers requests. |
| **`localhost`** | "This computer." |
| **Port** | A numbered "door" on a computer. Each service listens on its own. |
| **Environment variable** | A named setting a program reads from where it runs. |
| **`.env`** | A private file of environment variables. Never committed. |
| **`.env.example`** | A committed template with fake values. |
| **Connection URL** | `scheme://user:password@host:port/database`: everything needed to connect. |
| **Host** | The address of the computer running a service. |
| **Railway project** | A container grouping related services. |
| **Private network** | Railway's internal network (`*.railway.internal`), unreachable from outside. |
| **TCP proxy / Public Access** | A public address that forwards to a private service. |
| **TCP** | The basic internet "phone line" database connections use. |
| **SSL** | Encryption for data travelling over the internet (the 🔒 in `https`). |
| **Egress** | Data leaving a provider's network. Usually billed. |
| **Variable reference (`${{...}}`)** | A Railway placeholder filled in only inside Railway. |
| **Staged changes / Deploy (Railway)** | Railway collects edits as a draft. Deploy applies them. |
| **Volume** | Persistent disk attached to a service that survives restarts. |
| **Current working directory / `cd`** | The folder a terminal is "standing in" / the command to move into another one. |

---

## f. Exercises (easiest first)

> ⚠️ Exercises 2 and 3 change the real Railway database. Do them on a practice branch (`git switch -c practice/schema`) and don't merge it. Ask for help if you want to undo them afterwards.

**1. Add a fourth example request.** *File:* `apps/api/prisma/seed.ts`
Copy one of the `{ ... }` blocks inside `exampleRequests`, change the name, email (it **must** end in `@example.com`), category, priority and description. Then from `apps/api` run `npx prisma db seed` and check Prisma Studio for four rows.
*Bonus:* use `Category.BUGG` on purpose and watch your editor underline it in red.

**2. Add an `URGENT` priority.** *File:* `apps/api/prisma/schema.prisma`
Add `URGENT` under `HIGH` in `enum Priority`. Then run:
`npx prisma migrate dev --name add-urgent-priority`, then `npx prisma generate`.
Open the new `migration.sql` and find the `ALTER TYPE ... ADD VALUE` line. Notice that Prisma created a **new** file and didn't touch the first one.

**3. Add an optional "page URL" field.** *File:* `apps/api/prisma/schema.prisma`
Add `pageUrl String?` to `FeatureRequest` (the `?` makes it optional). Run `npx prisma migrate dev --name add-page-url`, then `npx prisma generate`. In the new SQL, check that the column has **no** `NOT NULL`, and in Studio see that the three existing rows show `NULL` for it.

---

## Appendix A: Getting a public database URL from Railway

Railway databases are **private** by default (`*.railway.internal`). Your laptop needs a **public** address.

1. **Postgres tile → Settings → Networking → "Add Public Access".**
2. **Deploy the change.** Railway stages edits ("Apply N changes" at top left, "Edited" on the tile). Click **Deploy** and wait for **Active**. Until then, the URL shows as an unfilled `${{...}}` template.
3. **Variables tab → `DATABASE_PUBLIC_URL`** → copy (📋) or reveal (👁). Don't use **Raw Editor**, which shows the template.
   ✅ `postgresql://postgres:<password>@<something>.proxy.rlwy.net:<5-digit port>/railway`
   ❌ `.railway.internal`, `:5432` or `${{`: wrong variable, or not deployed.
4. **Paste it into `apps/api/.env`** as `DATABASE_URL="..."`. The name stays `DATABASE_URL`, because that's what the code reads. Save. Never paste it into chat or commit it.
5. **Test:** `cd apps/api`, then `npx prisma migrate status`. ✅ It shows `at "<something>.proxy.rlwy.net:<port>"`.

| Error | Cause | Fix |
|---|---|---|
| `Could not find Prisma Schema` / `No database URL found` | Terminal in the wrong folder | `cd apps/api` |
| `P1001: Can't reach database server at postgres.railway.internal:5432` | Used the private URL | Use `DATABASE_PUBLIC_URL` |
| `datasource.url property is required` | `.env` variable named something other than `DATABASE_URL` | Rename it to `DATABASE_URL` |
| Copied value contains `${{PGUSER}}` | Public access staged but not deployed | Click **Deploy** |

---

## Appendix B: Creating `main` on an empty GitHub repo and opening a PR

Run from the top project folder, with no uncommitted changes (`git status`).

1. `git ls-remote origin`: empty output means GitHub has no `main`. **If `refs/heads/main` is listed, skip to step 4.** Steps 2–3 are a one-time setup for an empty repo. If you run them when `main` already exists, `git switch --orphan main` fails, you stay on your feature branch, and `git commit --allow-empty` adds an empty commit *there* by mistake. Always read the output of `git switch` before running the next command.
2. `git switch --orphan main`, then `git commit --allow-empty -m "chore: initial commit"`: an empty starting commit. Files seem to vanish but are safe in your feature branch.
3. `git push -u origin main`: creates `main` on GitHub.
4. `git switch feat/database`, then `git rebase main`: replays your commits on top of `main`. ✅ `Successfully rebased`. Only rebase branches you haven't pushed yet, or that only you use.
5. `git push -u origin feat/database`
6. Open the PR: use the link GitHub prints (base `main` ← compare `feat/database`) or run `gh pr create --base main --head feat/database --title "..." --body "..."`.
7. Stop. Don't merge your own PR.

| Message | Meaning |
|---|---|
| `Your branch is based on 'origin/main', but the upstream is gone` | The branch follows a GitHub branch that doesn't exist yet. Pushing fixes it. |
| `rejected ... (fetch first)` | GitHub has commits you don't. `git pull` first. |
| `CONFLICT` during rebase | Two commits changed the same lines. Ask for help, or `git rebase --abort` to undo. |

---

## Appendix C: Prisma 7 differences you'll see in older tutorials

1. The database URL is set in `prisma7.config.ts` (`datasource.url`), **not** in `schema.prisma`.
2. `.env` isn't loaded automatically. The config does it with `import "dotenv/config"`.
3. `migrate dev` no longer runs `prisma generate` (or the seed) for you.
4. Prisma Client needs a driver adapter (`@prisma/adapter-pg` + `pg`).
5. The client is generated into `generated/prisma` (git-ignored) and imported from `../generated/prisma/client`.
6. The seed command lives in the config file (`migrations.seed`), not in `package.json`.
7. `prisma init` also downloads AI-assistant "skills" folders. We deleted them, since they're not needed for the project.
