const SWATCH_HEX: Readonly<Record<string, string>> = {
  black: '#1c1a19',
  white: '#f4f3f1',
  ivory: '#efe9dd',
  cream: '#efe6d6',
  oatmeal: '#d9cfc0',
  sand: '#cdbfa6',
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
  purple: '#5b4b8a',
  stone: '#b8b2a7',
  taupe: '#a89e91',
};

const FALLBACK_HEX = '#b8b2a7';

export function colorToHex(name: string): string {
  const normalised = name.trim().toLowerCase();

  if (SWATCH_HEX[normalised]) {
    return SWATCH_HEX[normalised];
  }

  const word = Object.keys(SWATCH_HEX).find((key) => normalised.includes(key));

  return word ? SWATCH_HEX[word]! : FALLBACK_HEX;
}
