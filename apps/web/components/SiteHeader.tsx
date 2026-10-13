'use client';
// A client component because we hand Next's Link to MUI's Button through the `component`
// prop. Handing over a component like that is only allowed between client components.
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Link from 'next/link';

export default function SiteHeader() {
  return (
    // position="static" keeps the bar at the top of the page instead of floating over content.
    <AppBar position="static">
      <Toolbar>
        {/* flexGrow: 1 makes the title take up the free space, pushing the buttons right.
            On phones (xs) the title is a little smaller so title + buttons fit on one line;
            noWrap cuts it off with "…" instead of wrapping if a screen is narrower still. */}
        <Typography
          variant="h6"
          component="div"
          noWrap
          sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          Feature Requests
        </Typography>
        {/* component={Link} renders MUI's button styling but navigates like a Next.js link,
            so moving between pages doesn't reload the whole site.
            Less side padding on phones (xs) leaves more room for the title. */}
        <Button color="inherit" component={Link} href="/" sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
          New
        </Button>
        <Button
          color="inherit"
          component={Link}
          href="/submissions"
          sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}
        >
          Submissions
        </Button>
      </Toolbar>
    </AppBar>
  );
}
