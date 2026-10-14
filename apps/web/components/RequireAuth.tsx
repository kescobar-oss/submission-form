'use client';
// A client component: it reads the login state and can move the browser to another page.
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import { useAuth } from '@/components/AuthProvider';
import { homePathFor, isStaff } from '@/lib/roles';
import type { Role } from '@/lib/types';

type Props = {
  // Where to come back to after logging in, e.g. "/new?category=BUG".
  next: string;
  // Leave out to allow any logged-in account; list roles to allow only those.
  roles?: Role[];
  // What to show once someone allowed is logged in. Plain content, not a function: server
  // pages render RequireAuth, and a function can't be sent from the server to the browser.
  // Components inside read the user themselves with useAuth().
  children: ReactNode;
};

// Wraps a page section that needs a login. This is a convenience for the visitor, not the
// security itself: the API checks the token and role on every request anyway, so hiding a
// page here only spares people from seeing errors.
export default function RequireAuth({ next, roles, children }: Props) {
  const auth = useAuth();
  const router = useRouter();

  // Not logged in (or the login just expired): go to the login page, remembering where we were.
  useEffect(() => {
    if (auth.status === 'anonymous') {
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [auth.status, next, router]);

  // While checking the saved token, or while moving to /login, show a grey placeholder
  // instead of flashing the wrong content.
  if (auth.status !== 'authenticated') {
    return <Skeleton variant="rounded" height={420} />;
  }

  if (roles && !roles.includes(auth.user.role)) {
    // The page-level version of the API's 403, with a way back to where this role belongs
    // (Tickets for staff, the welcome page for users).
    return (
      <Alert
        severity="warning"
        action={
          <Button component={Link} href={homePathFor(auth.user.role)} color="inherit" size="small">
            {isStaff(auth.user.role) ? 'Go to Tickets' : 'Go to start'}
          </Button>
        }
      >
        This page isn&apos;t available for your account.
      </Alert>
    );
  }

  return <>{children}</>;
}
