'use client';
// A client component: it fetches with the login token (which only the browser has) and holds
// the result in state.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import RequestsTable from '@/components/RequestsTable';
import { listMyRequests, listRequests } from '@/lib/api';
import type { FeatureRequest } from '@/lib/types';

// Which list to show. A plain string (not a function), so server pages can pass it in.
type Source = 'all' | 'mine';

type ListState =
  | { status: 'loading' }
  | { status: 'loaded'; rows: FeatureRequest[] }
  | { status: 'error'; message: string };

// Loads as soon as it appears; there's no key to type any more, the login token is enough.
// Always shown inside RequireAuth, so someone allowed is logged in by now.
export default function RequestsList({ source }: { source: Source }) {
  const [state, setState] = useState<ListState>({ status: 'loading' });
  // Bumping this number makes the effect below run again: that's the Refresh button.
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    // If the page is left before the reply arrives, ignore the reply instead of updating
    // a component that's no longer on screen.
    let cancelled = false;
    async function load() {
      const result = source === 'all' ? await listRequests() : await listMyRequests();
      if (cancelled) return;
      if (result.ok) {
        setState({ status: 'loaded', rows: result.data });
      } else if (result.kind === 'forbidden') {
        setState({ status: 'error', message: "Your account doesn't have access to these requests." });
      } else if (result.kind === 'unauthorized') {
        // AuthProvider has already logged out; RequireAuth is about to show the login page.
        setState({ status: 'error', message: 'Your login has expired. Please log in again.' });
      } else if (result.kind === 'network') {
        setState({ status: 'error', message: "We couldn't reach the server. Check your connection and try again." });
      } else {
        setState({ status: 'error', message: 'Something went wrong on our side. Please try again in a moment.' });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [source, reloads]);

  function refresh() {
    setState({ status: 'loading' });
    setReloads((n) => n + 1);
  }

  if (state.status === 'loading') {
    return <Skeleton variant="rounded" height={240} />;
  }

  if (state.status === 'error') {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Alert severity="error" sx={{ alignSelf: 'stretch' }}>
          {state.message}
        </Alert>
        <Button onClick={refresh}>Try again</Button>
      </Stack>
    );
  }

  if (state.rows.length === 0) {
    return source === 'mine' ? (
      <Alert severity="info">
        You haven&apos;t sent any requests yet. <Link href="/">Send your first one</Link>.
      </Alert>
    ) : (
      <Alert severity="info">No requests have been submitted yet.</Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {/* On "mine", every row is yours, so the name and email columns are left out. */}
      <RequestsTable rows={state.rows} showAuthor={source === 'all'} />
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {state.rows.length} request{state.rows.length === 1 ? '' : 's'}, newest first.
        </Typography>
        <Button onClick={refresh}>Refresh</Button>
      </Stack>
    </Stack>
  );
}
