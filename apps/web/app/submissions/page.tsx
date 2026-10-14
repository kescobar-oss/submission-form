import Typography from '@mui/material/Typography';
import RequestsList from '@/components/RequestsList';
import RequireAuth from '@/components/RequireAuth';
import { USER_ROLES } from '@/lib/roles';

export const metadata = { title: 'Submissions | Daily Monitoring Ticketing System' };

// The page at /submissions: a User's own requests and their current status.
// Which rows are "yours" is decided by the API from the token, never by the browser.
// Staff don't submit, so they're pointed to Tickets instead.
export default function SubmissionsPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Submissions
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Everything you&apos;ve sent, newest first, and where each one stands.
      </Typography>
      <RequireAuth next="/submissions" roles={USER_ROLES}>
        <RequestsList source="mine" />
      </RequireAuth>
    </>
  );
}
