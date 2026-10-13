import { Suspense } from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export const metadata = { title: 'Request received | Feature Request Form' };

// The folder name "success" makes this the page at /success. It's a server component:
// nothing here reacts to clicks, so no JavaScript for it needs to reach the browser.
// It isn't async on purpose: everything except the ID is the same for every visitor, so
// Next.js can prepare it ahead of time, and only <ReferenceId> waits for the URL.
export default function SuccessPage({ searchParams }: PageProps<'/success'>) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h1">
          Thank you!
        </Typography>
        <Typography>We&apos;ve received your request. Your reference ID is:</Typography>
        {/* Suspense shows the fallback (a grey placeholder bar) until the ID is read. */}
        <Suspense fallback={<Skeleton width={260} height={40} />}>
          <ReferenceId searchParams={searchParams} />
        </Suspense>
        <Typography color="text.secondary">
          Keep it if you want to ask the team about this request later.
        </Typography>
        {/* href makes MUI draw the button as a link back to the empty form. */}
        <Button
          href="/"
          variant="contained"
          sx={{ alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          Submit another
        </Button>
      </Stack>
    </Paper>
  );
}

// Reads ?id=... from the address bar. searchParams is a Promise in this Next.js version,
// because the URL is only known when someone actually visits, so we await it.
async function ReferenceId({ searchParams }: Pick<PageProps<'/success'>, 'searchParams'>) {
  const { id } = await searchParams;

  // Someone opened /success directly, without coming from the form.
  if (typeof id !== 'string' || id.length === 0) {
    return <Typography color="text.secondary">(no reference ID found)</Typography>;
  }

  return (
    // monospace makes characters like l/1 and O/0 easy to tell apart when copying the ID.
    <Typography
      variant="h6"
      component="p"
      sx={{ fontFamily: 'monospace', wordBreak: 'break-all', bgcolor: 'grey.100', p: 1.5, borderRadius: 1 }}
    >
      {id}
    </Typography>
  );
}
