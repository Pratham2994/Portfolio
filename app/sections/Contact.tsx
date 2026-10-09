import { useRef, useState } from 'react';

import { you } from '~/content';
import { track } from '~/lib/analytics';
import { ANALYTICS } from '~/lib/analytics.config';

import s from './Contact.module.css';

export function Contact() {
  const address = useRef<HTMLSpanElement>(null);
  const [label, setLabel] = useState('Copy');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(you.email);
      setLabel('Copied');
      track('email_copied');
    } catch {
      // Some browsers refuse the clipboard. Select the address so one key press copies it.
      const range = document.createRange();
      range.selectNodeContents(address.current!);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      setLabel('Selected');
    }
    setTimeout(() => setLabel('Copy'), 2000);
  };

  return (
    <footer id="contact" className={s.contact} aria-labelledby="contact-title">
      <h2 id="contact-title">Say hello</h2>
      <p className={s.email}>
        <span ref={address}>{you.email}</span>
        <button type="button" onClick={copy} aria-live="polite">
          {label}
        </button>
      </p>
      <ul className={s.links}>
        <li>
          <a href={you.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <a href={you.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </li>
        {you.resume && (
          <li>
            <a href={you.resume} download onClick={() => track('resume_downloaded', { from: 'contact' })} data-resume>
              Resume (PDF)
            </a>
          </li>
        )}
      </ul>
      <p className={s.small}>
        Pratham Panchal, 2026.
        {/* Said only when it is true: with no key, nothing is counted. */}
        {ANALYTICS.key && ' This site counts visits and clicks, so I can see what people look at. No cookies.'}
      </p>
    </footer>
  );
}
