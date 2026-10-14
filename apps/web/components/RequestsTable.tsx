// Shows a list of requests as a table. Used by /tickets (everyone's, with author columns and
// a status dropdown) and /submissions (your own, where the author columns would just repeat
// your name and the status is read-only).
import Chip, { type ChipProps } from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUSES,
  STATUS_LABELS,
  type FeatureRequest,
  type Priority,
  type Status,
} from '@/lib/types';

// One theme colour per priority, so urgent rows stand out at a glance.
const PRIORITY_COLORS: Record<Priority, ChipProps['color']> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'success',
};

// One theme colour per status: grey for "not looked at yet", blue for "being worked on",
// amber for "on hold", green for "done", red for "won't be done".
const STATUS_COLORS: Record<Status, ChipProps['color']> = {
  OPEN: 'default',
  IN_PROGRESS: 'info',
  PAUSED: 'warning',
  COMPLETED: 'success',
  REJECTED: 'error',
};

function StatusChip({ status }: { status: Status }) {
  return <Chip label={STATUS_LABELS[status]} color={STATUS_COLORS[status]} size="small" />;
}

// Turns "2026-10-13T09:30:00.000Z" into e.g. "13 Oct 2026, 10:30" in the viewer's own
// language and time zone.
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

type Props = {
  rows: FeatureRequest[];
  showAuthor: boolean;
  // Given only on /tickets: then the status is a dropdown, and picking a value calls this.
  // Left out on /submissions, where Users can see the status but not change it.
  onStatusChange?: (id: string, status: Status) => void;
  // Tickets whose new status is being saved right now; their dropdown is disabled meanwhile.
  savingIds?: ReadonlySet<string>;
};

export default function RequestsTable({ rows, showAuthor, onStatusChange, savingIds }: Props) {
  return (
    // TableContainer scrolls sideways on a phone, so the wide table never makes the whole
    // page scroll sideways.
    <TableContainer component={Paper}>
      <Table size="small" sx={{ minWidth: showAuthor ? 940 : 680 }}>
        <TableHead>
          <TableRow>
            <TableCell>Received</TableCell>
            {showAuthor && <TableCell>Name</TableCell>}
            {showAuthor && <TableCell>Email</TableCell>}
            <TableCell>Category</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Status</TableCell>
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
              <TableCell sx={{ minWidth: 150 }}>
                {onStatusChange ? (
                  <Select
                    size="small"
                    value={row.status}
                    onChange={(e) => onStatusChange(row.id, e.target.value as Status)}
                    disabled={savingIds?.has(row.id)}
                    // The closed dropdown shows the same coloured badge Users see.
                    renderValue={(value) => <StatusChip status={value} />}
                    // A screen reader announces which ticket this dropdown belongs to.
                    inputProps={{ 'aria-label': `Status of the request from ${row.name}` }}
                    sx={{ minWidth: 140 }}
                  >
                    {STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </MenuItem>
                    ))}
                  </Select>
                ) : (
                  <StatusChip status={row.status} />
                )}
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
