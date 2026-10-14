import { Suspense } from 'react';
import Skeleton from '@mui/material/Skeleton';
import AuthCard from '@/components/AuthCard';
import LoginForm from '@/components/LoginForm';
import { safeNext } from '@/lib/auth-validation';

export const metadata = { title: 'Log in | Daily Monitoring Ticketing System' };

// The page at /login. Like /new, the card is prepared ahead of time and only the part
// that needs ?next= from the address waits for it. No subtitle: "Log in" says it all.
export default function LoginPage({ searchParams }: PageProps<'/login'>) {
  return (
    <AuthCard title="Log in">
      <Suspense fallback={<Skeleton variant="rounded" height={260} />}>
        <LoginWithNext searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginWithNext({ searchParams }: Pick<PageProps<'/login'>, 'searchParams'>) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(next)} />;
}
