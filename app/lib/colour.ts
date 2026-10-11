// How bright a colour is, from 0 to 1, by the WCAG rule.
function light(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The contrast of two colours, from 1 (the same) to 21 (black on white). */
export function contrast(one: string, other: string): number {
  const [a, b] = [light(one), light(other)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
