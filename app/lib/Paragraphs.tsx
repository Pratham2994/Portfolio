/** Content text is plain paragraphs, split on blank lines. */
export function Paragraphs({ text }: { text: string }) {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, i) => <p key={i}>{part}</p>);
}
