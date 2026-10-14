import Typography from '@mui/material/Typography';
import RequestsList from '@/components/RequestsList';
import RequireAuth from '@/components/RequireAuth';

export const metadata = { title: 'Submissions | Daily Monitoring Ticketing System' };

// The page at /submissions: every request, for staff. The heading stays on the server; the
// data is fetched by the browser, because only the browser has the login token.
// RequireAuth hides the list from other roles, and the API refuses them (403) regardless.
export default function SubmissionsPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Submissions
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Every request sent by anyone, newest first.
      </Typography>
      <RequireAuth next="/submissions" roles={['ADMIN', 'DEVELOPER']}>
        <RequestsList source="all" />
      </RequireAuth>
    </>
  );
}
