# Feature Request Form

A small app where people submit feature requests (bugs, improvements, new features)
and admins review them.

This is a **monorepo**: one Git repository that holds two separate programs.

| Folder     | What it is                                   | Built with                  | Deployed on |
|------------|----------------------------------------------|-----------------------------|-------------|
| `apps/api` | The backend. The only part that talks to the database. | NestJS + Prisma + PostgreSQL | Railway     |
| `apps/web` | The website people see and fill in.          | Next.js (App Router) + Material UI | Vercel |

The browser only ever calls the API. The API is the only thing allowed to talk to the database.

## Environment variables

Secrets live in `.env` files, which are **never** committed to Git.
Each app has a `.env.example` showing which variables it needs, with placeholder values.
Copy it to `.env` and fill in the real values locally.

## Lessons

Teaching notes for each part of the project live in `docs/lessons/`.
