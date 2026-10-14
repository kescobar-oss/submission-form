import { Suspense } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import RequestForm from '@/components/RequestForm';
import RequireAuth from '@/components/RequireAuth';
import { USER_ROLES } from '@/lib/roles';
import { CATEGORIES, type Category } from '@/lib/types';

export const metadata = { title: 'New request | Daily Monitoring Ticketing System' };

// The folder name "new" makes this the page at /new. The welcome page links here with
// ?category=BUG (or IMPROVEMENT / NEW_FEATURE) so the form opens with that choice made.
// Like the success page, it isn't async: the heading is the same for everyone and can be
// prepared ahead of time; only <FormWithCategory> waits for the address bar.
export default function NewRequestPage({ searchParams }: PageProps<'/new'>) {
  return (
    // A form reads best in a column of moderate width, so this page stays narrower than
    // the "lg" frame from layout.tsx (which is wide for the tables' sake).
    <Box sx={{ maxWidth: 'md', mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Submit a request
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Tell the product team what you found or what you&apos;d like.
      </Typography>
      {/* A grey placeholder the size of the form, shown for the moment before it appears. */}
      <Suspense fallback={<Skeleton variant="rounded" height={560} />}>
        <FormWithCategory searchParams={searchParams} />
      </Suspense>
    </Box>
  );
}

// searchParams is a Promise in this Next.js version (the URL is only known per visit),
// so this small part awaits it and then hands the category to the form.
async function FormWithCategory({ searchParams }: Pick<PageProps<'/new'>, 'searchParams'>) {
  const { category } = await searchParams;
  const initialCategory = toCategory(category);
  // If they're not logged in, RequireAuth sends them to /login and back here afterwards,
  // with the category they picked still in the address.
  const next = initialCategory ? `/new?category=${initialCategory}` : '/new';
  return (
    // Only Users submit; Admin and Developer see a pointer to Tickets instead of the form.
    <RequireAuth next={next} roles={USER_ROLES}>
      <RequestForm initialCategory={initialCategory} />
    </RequireAuth>
  );
}

// Anyone can type any address, e.g. /new?category=HACK or ?category=BUG&category=BUG.
// Only an exact allowed value is used; everything else means "nothing pre-selected",
// so a broken or tampered link can never put an invalid value in the form.
function toCategory(value: string | string[] | undefined): Category | undefined {
  return CATEGORIES.find((c) => c === value);
}
