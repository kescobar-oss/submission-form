import Typography from '@mui/material/Typography';
import CategoryCards from '@/components/CategoryCards';

// The welcome page at /. A server component (no 'use client'): the text never changes, so
// it's built once into HTML. Picking a card goes to /new with that category pre-selected.
export default function Home() {
  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        What would you like to tell the product team?
      </Typography>
      <CategoryCards />
    </>
  );
}
