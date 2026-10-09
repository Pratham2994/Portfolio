import { useRef, useState } from 'react';

import { you } from '~/content';
import { track } from '~/lib/analytics';
import { ANALYTICS } from '~/lib/analytics.config';

import s from './Contact.module.css';

const STRIPS = 7;
// One strip is gone before you get here, as on every real flyer.
const TAKEN_ALREADY = 2;

/**
 * The last thing on the page is a flyer of the kind pinned to a notice board, with the address
 * cut into strips along the bottom. Pulling a strip tears it off and copies the address.
 */
export function Contact() {
  const address = useRef<HTMLSpanElement>(null);
  const [taken, setTaken] = useState<number[]>([TAKEN_ALREADY]);
  const [said, setSaid] = useState('Pull a strip. It copies the address.');

  const take = async (strip: number) => {
    setTaken((before) => [...before, strip]);
    try {
      await navigator.clipboard.writeText(you.email);
      setSaid('Copied');
      track('email_copied');
    } catch {
      // Some browsers refuse the clipboard. Select the address so one key press copies it.
      const range = document.createRange();
      range.selectNodeContents(address.current!);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      setSaid('Selected');
    }
  };

  const left = STRIPS - taken.length;

  return (
    <footer id="contact" className={s.contact} aria-labelledby="contact-title">
      <div className={s.flyer} data-reveal data-flyer>
        <i className={s.pin} aria-hidden="true" />
        <p className={s.kicker}>Take one</p>
        <h2 id="contact-title">Say hello</h2>
        <p className={s.pitch}>For a job, a project, or a wrong fact on this site. I answer all three.</p>
        <p className={s.email}>
          <span ref={address}>{you.email}</span>
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
        <p className={s.said} aria-live="polite" data-said>
          {left ? said : 'All gone. The address is still up there.'}
        </p>
        <ul className={s.strips}>
          {Array.from({ length: STRIPS }, (_, strip) => {
            const gone = taken.includes(strip);
            return (
              <li key={strip} data-gone={gone || undefined}>
                {/* A strip that is gone leaves its place empty, and cannot be pulled again. */}
                <button type="button" disabled={gone} onClick={() => take(strip)} aria-label="Pull a strip to copy the email address" data-strip>
                  <span aria-hidden="true">{you.email}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className={s.small}>
        Pratham Panchal, 2026.
        {/* Said only when it is true: with no key, nothing is counted. */}
        {ANALYTICS.key && ' This site counts visits and clicks, so I can see what people look at. No cookies.'}
      </p>
    </footer>
  );
}
