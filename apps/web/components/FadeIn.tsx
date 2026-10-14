'use client';
// A client component because the animation is built with keyframes, which the server can't
// hand to the browser on its own. Wrapping is the trick: server pages stay server
// components and just put <FadeIn> around whatever should slide in.
import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { fadeUp, respectReducedMotion } from '@/lib/animations';

// delay (in milliseconds) lets several FadeIns arrive one after another instead of all at once.
export default function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <Box
      sx={{
        // Full width, so a card inside a row can still stretch to its neighbours' height.
        width: '100%',
        // "both" keeps the element invisible during its delay and in place after it ends.
        animation: `${fadeUp} 500ms cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${delay}ms`,
        ...respectReducedMotion,
      }}
    >
      {children}
    </Box>
  );
}
