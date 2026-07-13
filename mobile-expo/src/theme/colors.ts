/** Campus Hub 2090 — matches HTML mockup tokens exactly */
export const C = {
  bg: '#05070D',
  bg2: '#0B0F1A',
  glass: 'rgba(255,255,255,0.055)',
  glassBorder: 'rgba(255,255,255,0.10)',
  text: '#F2F4F8',
  textDim: '#8E96A8',
  textMute: '#5B6272',
  g1a: '#22E1FF',
  g1b: '#8A5CFF',
  g2a: '#00FFB2',
  g2b: '#00C2A8',
  onGrad: '#04101A',
  danger: '#E24B4A',
  avatarBg: '#1A1F2E',
  avatarMuted: '#2A3040',
  bannerStart: '#182035',
  bannerEnd: '#0C1220',
};

export const Gradients = {
  primary: [C.g1a, C.g1b] as const,
  accent: [C.g2a, C.g2b] as const,
  banner: [C.bannerStart, C.bannerEnd] as const,
  mixed: [C.g1b, C.g1a] as const,
};

// Legacy alias
export const Colors = {
  bg: C.bg,
  card: C.glass,
  surface: C.bg2,
  primary: C.g1a,
  cyan: C.g1a,
  text: C.text,
  muted: C.textDim,
  error: C.danger,
};
