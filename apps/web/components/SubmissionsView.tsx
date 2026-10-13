'use client';
// A client component: it holds the admin key and the loaded rows in state and reacts to
// clicks, none of which a server component can do.
import { useState, type FormEvent } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip, { type ChipProps } from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { listRequests } from '@/lib/api';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  type FeatureRequest,
  type Priority,
} from '@/lib/types';

// One theme colour per priority, so urgent rows stand out at a glance.
const PRIORITY_COLORS: Record<Priority, ChipProps['color']> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'success',
};

// Turns "2026-10-13T09:30:00.000Z" into e.g. "13 Oct 2026, 10:30" in the viewer's own
// language and time zone.
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function SubmissionsView() {
  // The key lives only in this state, i.e. in the page's memory. It is never written to
  // localStorage or a cookie, so closing or reloading the tab forgets it. Anything stored in
  // the browser could be read later by someone else using the same computer.
  const [adminKey, setAdminKey] = useState('');
  // null means "not loaded yet", which is different from "loaded, but there are no requests".
  const [rows, setRows] = useState<FeatureRequest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  async function handleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (adminKey.trim().length === 0) {
      setAlert('Please enter the admin key.');
      return;
    }

    setLoading(true);
    setAlert(null);
    const result = await listRequests(adminKey);
    setLoading(false);

    if (result.ok) {
      setRows(result.data);
      return;
    }
    // Hide any table from an earlier successful load, so a wrong key never shows old data.
    setRows(null);
    if (result.kind === 'unauthorized') {
      setAlert("That admin key isn't right. Check it and try again.");
    } else if (result.kind === 'network') {
      setAlert("We couldn't reach the server. Check your connection and try again.");
    } else {
      setAlert('Something went wrong on our side. Please try again in a moment.');
    }
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <form onSubmit={handleLoad} noValidate>
          {/* Side by side on bigger screens, stacked on phones so neither gets squashed. */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
            <TextField
              label="Admin key"
              // type="password" shows dots, so nobody reading over your shoulder sees the key.
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              // Asks the browser not to offer to save or autofill it.
              autoComplete="off"
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" loading={loading}>
              Load
            </Button>
          </Stack>
        </form>
      </Paper>

      {alert && <Alert severity="error">{alert}</Alert>}

      {rows && rows.length === 0 && <Alert severity="info">No requests have been submitted yet.</Alert>}

      {rows && rows.length > 0 && (
        // TableContainer scrolls sideways on a phone, so the wide table never makes the whole
        // page scroll sideways.
        <TableContainer component={Paper}>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Received</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* key lets React tell rows apart; the database id is unique, so it's ideal. */}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {dateFormat.format(new Date(row.createdAt))}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{CATEGORY_LABELS[row.category]}</TableCell>
                  <TableCell>
                    <Chip
                      label={PRIORITY_LABELS[row.priority]}
                      color={PRIORITY_COLORS[row.priority]}
                      size="small"
                    />
                  </TableCell>
                  {/* minWidth keeps long descriptions readable instead of one word per line. */}
                  <TableCell sx={{ minWidth: 240 }}>{row.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {rows && rows.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          {rows.length} request{rows.length === 1 ? '' : 's'}, newest first.
        </Typography>
      )}
    </Stack>
  );
}
