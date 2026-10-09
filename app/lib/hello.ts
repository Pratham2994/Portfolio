const CAT = String.raw`
  /\_/\
 ( o.o )
  > ^ <
`;

let said = false;

/** A note in the browser console, for the people who open it. */
export function sayHello(email: string): void {
  if (said) return;
  said = true;
  console.log(
    `%c${CAT}%cYou looked. Good.\nSay hello: ${email}\n\nThe wall has secrets. Start by typing "meow" on it.`,
    'color: #ff7a1a; font: 700 14px/1.2 monospace',
    'font: 13px/1.6 monospace',
  );
}
