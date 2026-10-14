// Fills the database with three sample accounts (one per role) and a few example requests,
// so there is something to log in with and look at. Run with: npx prisma db seed
import "dotenv/config"; // loads DATABASE_URL and SEED_PASSWORD from apps/api/.env into process.env
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Category, Priority, Role } from "../generated/prisma/enums";

// Prisma 7 needs a driver adapter: the plug between Prisma and the "pg" Postgres library.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// All seed rows use @example.com, a domain reserved for examples, so they can never
// belong to a real person and are easy to find again (see the cleanup below).
const SEED_EMAIL_DOMAIN = "@example.com";

const exampleRequests = [
  {
    name: "Ada Lovelace",
    email: "ada@example.com",
    category: Category.BUG,
    priority: Priority.HIGH,
    description: "The submit button does nothing on mobile Safari.",
    consent: true,
  },
  {
    name: "Grace Hopper",
    email: "grace@example.com",
    category: Category.IMPROVEMENT,
    priority: Priority.MEDIUM,
    description: "Show a character counter under the description box.",
    consent: true,
  },
  {
    name: "Alan Turing",
    email: "alan@example.com",
    category: Category.NEW_FEATURE,
    priority: Priority.LOW,
    description: "Let admins export all requests as a CSV file.",
    consent: false,
  },
];

// One sample account per role. They share the password from SEED_PASSWORD in .env, so the
// password is never written in this file (which is public on GitHub).
const sampleAccounts = [
  { email: "user@example.com", name: "Sample User", role: Role.USER },
  { email: "admin@example.com", name: "Admin", role: Role.ADMIN },
  { email: "developer@example.com", name: "Sample Developer", role: Role.DEVELOPER },
];

async function main() {
  // Refuse to run without a real password, rather than creating accounts anyone could
  // log in to. 8 characters matches the minimum the sign-up form will ask for.
  const password = process.env.SEED_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("Set SEED_PASSWORD (at least 8 characters) in apps/api/.env before seeding.");
  }
  // Remove earlier seed rows first, so running the seed twice still leaves the same rows.
  // Real submissions never use @example.com, so they are untouched.
  const removed = await prisma.featureRequest.deleteMany({
    where: { email: { endsWith: SEED_EMAIL_DOMAIN } },
  });

  // upsert = "update if it exists, otherwise insert". Re-running the seed resets each
  // sample account's name, role and password instead of failing on the duplicate email.
  const users = [];
  for (const account of sampleAccounts) {
    // Hashed separately for each account: bcrypt mixes in a random "salt" every time, so
    // the three hashes differ even though the password is the same, and nobody reading the
    // table can tell which accounts share a password. 12 is bcrypt's "cost": each extra
    // step doubles the work, so guessing passwords from a stolen hash becomes very slow.
    const passwordHash = await bcrypt.hash(password, 12);
    users.push(
      await prisma.user.upsert({
        where: { email: account.email },
        update: { name: account.name, role: account.role, passwordHash },
        create: { ...account, passwordHash },
      }),
    );
  }

  // createMany sends all rows in one trip to the database. We don't pass id or createdAt:
  // Prisma fills in a cuid and Postgres stamps the current time. These three have no
  // author, like requests sent before logins existed.
  const created = await prisma.featureRequest.createMany({ data: exampleRequests });

  // One request that belongs to the sample user, so "My requests" has something to show.
  // name and email are copied from the account, the same way the API will do it.
  const sampleUser = users[0];
  await prisma.featureRequest.create({
    data: {
      name: sampleUser.name,
      email: sampleUser.email,
      category: Category.IMPROVEMENT,
      priority: Priority.MEDIUM,
      description: "Remember my last chosen priority on the form.",
      consent: true,
      userId: sampleUser.id,
    },
  });

  console.log(
    `Accounts ready: ${users.map((u) => `${u.email} (${u.role})`).join(", ")}.\n` +
      `Removed ${removed.count} old seed requests, created ${created.count + 1} new ones.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1; // tell the terminal the seed failed, so the error isn't missed
  })
  .finally(async () => {
    // Close the connection, otherwise the script would hang waiting on the open database link.
    await prisma.$disconnect();
  });
