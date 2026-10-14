// Named animations, shared by any component that needs them. A keyframes animation is a
// list of "at this point in time, look like this" steps; the browser fills in the frames
// between them. keyframes comes from Emotion (MUI's styling engine), so no CSS file is needed.
import { keyframes } from '@mui/material/styles';

// Entrance: start a little lower and invisible, end in place and fully visible.
export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Bug card: a quick side-to-side shake, like a bug twitching.
export const wiggle = keyframes`
  0%, 100% { transform: rotate(0deg); }
  20%      { transform: rotate(-14deg); }
  40%      { transform: rotate(12deg); }
  60%      { transform: rotate(-8deg); }
  80%      { transform: rotate(4deg); }
`;

// Improvement card: the bulb swells and glows, as if switching on.
export const glow = keyframes`
  0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); }
  50%      { transform: scale(1.18); filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.8)); }
`;

// Feature card: one full turn with a small pop in the middle.
export const twirl = keyframes`
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
`;

// "Get started →": the arrow keeps nudging right while you hover.
export const nudge = keyframes`
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(4px); }
`;

// Added to the sx of anything animated. Some people turn on "reduce motion" in their
// system settings because movement makes them dizzy; for them, everything stays still
// (and the entrance simply shows the element right away).
export const respectReducedMotion = {
  '@media (prefers-reduced-motion: reduce)': {
    '&, & *': { animation: 'none !important', transition: 'none !important' },
  },
} as const;
