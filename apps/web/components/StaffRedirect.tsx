'use client';
// A client component: it needs the login state, which only exists in the browser.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { homePathFor, isStaff } from '@/lib/roles';

// Placed on the welcome page. Staff have no use for "what would you like to send?", so as
// soon as we know an Admin or Developer is logged in, they're moved on to Tickets.
// Renders nothing itself. replace (not push) so Back doesn't bounce them here again.
export default function StaffRedirect() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === 'authenticated' && isStaff(auth.user.role)) {
      router.replace(homePathFor(auth.user.role));
    }
  }, [auth, router]);

  return null;
}
