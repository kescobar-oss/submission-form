import Typography from '@mui/material/Typography';
import RequestsList from '@/components/RequestsList';
import RequireAuth from '@/components/RequireAuth';
import { STAFF_ROLES } from '@/lib/roles';

export const metadata = { title: 'Tickets | Daily Monitoring Ticketing System' };

// The page at /tickets: every ticket, for Admin and Developer, who land here after logging in.
// The heading stays on the server; the data is fetched by the browser, because only the
// browser has the login token. RequireAuth hides it from Users, and the API refuses them (403).
export default function TicketsPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Tickets
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Every ticket, newest first. Change a ticket&apos;s status and the person who sent it will see it.
      </Typography>
      <RequireAuth next="/tickets" roles={STAFF_ROLES}>
        <RequestsList source="all" />
      </RequireAuth>
    </>
  );
}
