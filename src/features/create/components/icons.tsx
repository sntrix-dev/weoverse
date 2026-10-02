// design: create.jsx MOD_ICO, CFORMAT_ICO (+ the spark AiDraft draws)
import type { ReactNode } from 'react';

export const MOD_ICO: Record<string, ReactNode> = {
  cat: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 3.6v16.8M3.6 12h16.8" />
    </>
  ),
  title: <path d="M5 7.4h14M5 12h9M5 16.6h6" />,
  media: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  tags: (
    <>
      <circle cx="9.4" cy="9.4" r="2" />
      <path d="M13.6 3.8H20v6.4L10.4 19.8a2 2 0 0 1-2.8 0L4.2 16.4a2 2 0 0 1 0-2.8z" />
    </>
  ),
  price: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.6 12h6.8" />
    </>
  ),
  goal: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M4.4 14.2a20 20 0 0 0 15.2 0" />
    </>
  ),
  qty: (
    <>
      <circle cx="8" cy="8" r="3.2" />
      <circle cx="16" cy="8" r="3.2" />
      <circle cx="12" cy="15.6" r="3.2" />
    </>
  ),
  circ: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.4 9.6a4.6 4.6 0 0 1 7.2 1M15.6 14.4a4.6 4.6 0 0 1-7.2-1" />
    </>
  ),
  days: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.6v4.6l3.2 1.9" />
    </>
  ),
  rules: (
    <>
      <path d="M6 4.4h9l3.4 3.4v11.8H6z" />
      <path d="M9 11h6M9 14.6h4" />
    </>
  ),
  reserve: (
    <>
      <rect x="5" y="11" width="14" height="8.6" rx="2.4" />
      <path d="M8.4 11V8.6a3.6 3.6 0 0 1 7.2 0V11" />
    </>
  ),
  resell: <path d="M4.6 9.4h11.8l-2.8-2.8M19.4 14.6H7.6l2.8 2.8" />,
};

export const CFORMAT_ICO: Record<string, ReactNode> = {
  Listing: (
    <>
      <path d="M3.4 4.6h2.2l2.2 9.6h8.8l2-6.6H6.6" />
      <circle cx="9.4" cy="18.4" r="1.4" />
      <circle cx="16.4" cy="18.4" r="1.4" />
    </>
  ),
  Pool: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M4.4 14.2a20 20 0 0 0 15.2 0" />
      <path d="M12 8v3.2" />
    </>
  ),
  Bid: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 16V8.4M8.8 11.4L12 8.2l3.2 3.2" />
    </>
  ),
  Hunt: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2" />
    </>
  ),
  Drop: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 8v7.6M8.8 12.6L12 15.8l3.2-3.2" />
    </>
  ),
  Request: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 8.2v7.6M8.2 12h7.6" />
    </>
  ),
  Gift: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M7.8 11.4h8.4v4.6H7.8zM12 11.4v4.6M9.6 11.4c-1.3 0-2-.8-2-1.6s.8-1.4 1.6-1.2c1 .2 1.9 1.3 2.8 2.8M14.4 11.4c1.3 0 2-.8 2-1.6s-.8-1.4-1.6-1.2c-1 .2-1.9 1.3-2.8 2.8" />
    </>
  ),
  Subscription: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.4 9.6a4.6 4.6 0 0 1 7.2 1" />
      <path d="M15.6 14.4a4.6 4.6 0 0 1-7.2-1" />
      <path d="M15.8 7.4v2.4h-2.4M8.2 16.6v-2.4h2.4" />
    </>
  ),
};

export const SPARK = (
  <>
    <path d="M12 3.4l1.9 4.7 4.7 1.9-4.7 1.9L12 16.6l-1.9-4.7L5.4 10l4.7-1.9z" />
    <circle cx="18.4" cy="17.6" r="1.5" />
  </>
);
