// Shows a list of requests as a table. Used by /submissions (everyone's, with author columns)
// and /my-requests (your own, where the author columns would just repeat your name).
import Chip, { type ChipProps } from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { CATEGORY_LABELS, PRIORITY_LABELS, type FeatureRequest, type Priority } from '@/lib/types';

// One theme colour per priority, so urgent rows stand out at a glance.
const PRIORITY_COLORS: Record<Priority, ChipProps['color']> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'success',
};

// Turns "2026-10-13T09:30:00.000Z" into e.g. "13 Oct 2026, 10:30" in the viewer's own
// language and time zone.
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export default function RequestsTable({ rows, showAuthor }: { rows: FeatureRequest[]; showAuthor: boolean }) {
  return (
    // TableContainer scrolls sideways on a phone, so the wide table never makes the whole
    // page scroll sideways.
    <TableContainer component={Paper}>
      <Table size="small" sx={{ minWidth: showAuthor ? 800 : 560 }}>
        <TableHead>
          <TableRow>
            <TableCell>Received</TableCell>
            {showAuthor && <TableCell>Name</TableCell>}
            {showAuthor && <TableCell>Email</TableCell>}
            <TableCell>Category</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* key lets React tell rows apart; the database id is unique, so it's ideal. */}
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{dateFormat.format(new Date(row.createdAt))}</TableCell>
              {showAuthor && <TableCell>{row.name}</TableCell>}
              {showAuthor && <TableCell>{row.email}</TableCell>}
              <TableCell>{CATEGORY_LABELS[row.category]}</TableCell>
              <TableCell>
                <Chip label={PRIORITY_LABELS[row.priority]} color={PRIORITY_COLORS[row.priority]} size="small" />
              </TableCell>
              {/* minWidth keeps long descriptions readable instead of one word per line. */}
              <TableCell sx={{ minWidth: 240 }}>{row.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
