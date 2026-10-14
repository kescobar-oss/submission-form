import { Suspense } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LoginForm from '@/components/LoginForm';
import { safeNext } from '@/lib/auth-validation';

export const metadata = { title: 'Log in | Daily Monitoring Ticketing System' };

// The page at /login. Like /new, the heading is prepared ahead of time and only the part
// that needs ?next= from the address waits for it.
export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    // A narrow column: a login form stretched across a wide screen is hard to scan.
    <Box sx={{ maxWidth: 440, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Log in
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Log in to send a request or see the ones you&apos;ve sent.
      </Typography>
      <Suspense fallback={<Skeleton variant="rounded" height={320} />}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </Box>
  );
}

async function LoginWithNext({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(next)} />;
}
