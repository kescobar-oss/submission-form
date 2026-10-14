import Typography from '@mui/material/Typography';
import SubmissionsView from '@/components/SubmissionsView';

export const metadata = { title: 'Submissions | Daily Monitoring Ticketing System' };

// The page at /submissions. Like the home page, the static heading stays on the server and
// only the interactive part (key field, Load button, table) is a client component.
// The data itself is never fetched here on the server: it needs the admin key, which only
// the person at the keyboard knows, so the browser fetches it after they type the key.
export default function SubmissionsPage() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Submissions
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Enter the admin key to see every feature request.
      </Typography>
      <SubmissionsView />
    </>
  );
}
