import { Suspense } from 'react';
import Skeleton from '@mui/material/Skeleton';
import AuthCard from '@/components/AuthCard';
import RegisterForm from '@/components/RegisterForm';
import { safeNext } from '@/lib/auth-validation';

export const metadata = { title: 'Create an account | Daily Monitoring Ticketing System' };

// The page at /register. Same card as /login, so moving between the two feels seamless.
export default function RegisterPage({ searchParams }: PageProps<'/register'>) {
  return (
    <AuthCard
      title="Create an account"
      subtitle="You'll use it to send requests and follow the ones you've sent."
    >
      <Suspense fallback={<Skeleton variant="rounded" height={340} />}>
        <RegisterWithNext searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function RegisterWithNext({ searchParams }: Pick<PageProps<'/register'>, 'searchParams'>) {
  const { next } = await searchParams;
  return <RegisterForm next={safeNext(next)} />;
}
