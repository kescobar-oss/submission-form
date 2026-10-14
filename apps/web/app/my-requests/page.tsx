import Typography from '@mui/material/Typography';
import RequestsList from '@/components/RequestsList';
import RequireAuth from '@/components/RequireAuth';

export const metadata = { title: 'My requests | Daily Monitoring Ticketing System' };

// The page at /my-requests: the logged-in person's own requests, for every role.
// Which rows are "yours" is decided by the API from the token, never by the browser.
export default function MyRequestsPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        My requests
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Everything you&apos;ve sent, newest first.
      </Typography>
      <RequireAuth next="/my-requests">
        <RequestsList source="mine" />
      </RequireAuth>
    </>
  );
}
