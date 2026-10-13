import Typography from '@mui/material/Typography';
import RequestForm from '@/components/RequestForm';

// A server component (no 'use client'): the heading never changes, so it's built once into
// HTML. Only the interactive part, RequestForm, is sent to the browser as JavaScript.
export default function Home() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Submit a feature request
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Found a bug or have an idea? Tell the product team.
      </Typography>
      <RequestForm />
    </>
  );
}
