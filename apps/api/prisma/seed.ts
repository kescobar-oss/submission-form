// Fills the database with a few example requests so there is something to look at
// before the real form exists. Run with: npx prisma db seed
import "dotenv/config"; // loads DATABASE_URL from apps/api/.env into process.env
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Category, Priority } from "../generated/prisma/enums";

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

async function main() {
  // Remove earlier seed rows first, so running the seed twice still leaves exactly three.
  // Real submissions never use @example.com, so they are untouched.
  const removed = await prisma.featureRequest.deleteMany({
    where: { email: { endsWith: SEED_EMAIL_DOMAIN } },
  });

  // createMany sends all rows in one trip to the database. We don't pass id or createdAt:
  // Prisma fills in a cuid and Postgres stamps the current time.
  const created = await prisma.featureRequest.createMany({ data: exampleRequests });

  console.log(`Removed ${removed.count} old seed rows, created ${created.count} new ones.`);
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
