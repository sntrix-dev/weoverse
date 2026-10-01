/**
 * design: src/data/wv-data.js MYA — the guide's faces and clip (static brand assets in
 * public/mya). One character, a different frame per application.
 */
export const MYA = {
  faces: {
    id: '/mya/mya-face.png',
    idle: '/mya/mya-orb.png',
    reading: '/mya/mya-desk.png',
    answered: '/mya/mya-answer.png',
    chip: '/mya/mya-chip.png',
  },
  clips: { chat: '/mya/clip-intro.mp4' },
  avatar: '/mya/mya-face.png',
} as const;
