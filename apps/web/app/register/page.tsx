import { Suspense } from 'react';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import RegisterForm from '@/components/RegisterForm';
import { safeNext } from '@/lib/auth-validation';

export const metadata = { title: 'Create an account | Daily Monitoring Ticketing System' };

// The page at /register. Same layout as /login.
export default function RegisterPage({ searchParams }: PageProps<'/register'>) {
  return (
    <Box sx={{ maxWidth: 440, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create an account
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        You&apos;ll use it to send requests and follow the ones you&apos;ve sent.
      </Typography>
      <Suspense fallback={<Skeleton variant="rounded" height={400} />}>
        <RegisterWithNext searchParams={searchParams} />
      </Suspense>
    </Box>
  );
}

async function RegisterWithNext({ searchParams }: Pick<PageProps<'/register'>, 'searchParams'>) {
  const { next } = await searchParams;
  return <RegisterForm next={safeNext(next)} />;
}
