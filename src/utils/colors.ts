const SWATCH_HEX: Readonly<Record<string, string>> = {
  black: '#1c1a19',
  white: '#f4f3f1',
  ivory: '#efe9dd',
  cream: '#efe6d6',
  oatmeal: '#d9cfc0',
  sand: '#cdbfa6',
  beige: '#d8caae',
  khaki: '#bfa87a',
  natural: '#e3d9c6',
  tan: '#b08d57',
  camel: '#c19a6b',
  brown: '#6b4f3a',
  charcoal: '#3a3a3a',
  grey: '#8a8a8a',
  gray: '#8a8a8a',
  silver: '#c0c0c0',
  navy: '#1f2a44',
  blue: '#2f5d90',
  indigo: '#3a4cc0',
  denim: '#4a6fa5',
  green: '#3d7a4e',
  olive: '#5b6142',
  sage: '#a3b18a',
  red: '#b23b2e',
  burgundy: '#6d232a',
  rust: '#a4552e',
  orange: '#c4682e',
  yellow: '#d6a742',
  mustard: '#c9a227',
  pink: '#d9a3a8',
  maroon: '#5f2233',
  teal: '#2f6f6b',
  purple: '#5b4b8a',
  stone: '#b8b2a7',
  taupe: '#a89e91',
};

const FALLBACK_HEX = '#b8b2a7';

export const KNOWN_COLOR_NAMES: readonly string[] = Object.keys(SWATCH_HEX).sort();

export function resolveSwatch(name: string): string | null {
  const normalised = name.trim().toLowerCase();

  if (!normalised) {
    return null;
  }

  if (SWATCH_HEX[normalised]) {
    return SWATCH_HEX[normalised];
  }

  const word = KNOWN_COLOR_NAMES.find((key) => normalised.includes(key));

  return word ? (SWATCH_HEX[word] ?? null) : null;
}

export function isKnownColor(name: string): boolean {
  return resolveSwatch(name) !== null;
}

export function titleCaseColor(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function colorToHex(name: string): string {
  return resolveSwatch(name) ?? FALLBACK_HEX;
}
