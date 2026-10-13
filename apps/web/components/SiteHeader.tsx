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
        {/* flexGrow: 1 makes the title take up the free space, pushing the buttons right. */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Feature Requests
        </Typography>
        {/* component={Link} renders MUI's button styling but navigates like a Next.js link,
            so moving between pages doesn't reload the whole site. */}
        <Button color="inherit" component={Link} href="/">
          New
        </Button>
        <Button color="inherit" component={Link} href="/submissions">
          Submissions
        </Button>
      </Toolbar>
    </AppBar>
  );
}
