import { useRef, useState } from 'react';

import { you } from '~/content';
import { track } from '~/lib/analytics';
import { ANALYTICS } from '~/lib/analytics.config';
import { SITE } from '~/lib/meta';

import s from './Contact.module.css';

const short = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

type Strip = { key: string; text: string; label: string; href?: string; copy?: string; download?: boolean };

/** Each strip is a different way to reach me. `null` is the one that was taken before you came. */
const STRIPS: (Strip | null)[] = [
  { key: 'email', text: you.email, label: 'Email. Pull to copy the address', copy: you.email },
  { key: 'github', text: short(you.github), label: 'GitHub', href: you.github },
  null,
  { key: 'linkedin', text: 'LinkedIn', label: 'LinkedIn', href: you.linkedin },
  ...(you.resume ? [{ key: 'resume', text: 'Resume (PDF)', label: 'Resume (PDF)', href: you.resume, download: true }] : []),
  { key: 'site', text: short(SITE), label: 'This site. Pull to copy the link', copy: SITE },
  { key: 'email-2', text: you.email, label: 'Email. Pull to copy the address', copy: you.email },
];

/**
 * The last thing on the page is a flyer of the kind pinned to a notice board, with a row of
 * strips cut along the bottom. Each strip is one way to reach me. Pulling it tears it off
 * and does what it says: copies the address, or opens the page.
 */
export function Contact() {
  const address = useRef<HTMLSpanElement>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [said, setSaid] = useState('Pull a strip.');

  const take = async (strip: Strip) => {
    setTaken((before) => [...before, strip.key]);
    track('strip_pulled', { strip: strip.key });
    if (!strip.copy) return setSaid(strip.download ? 'The resume is on its way.' : `${strip.label} is open in a new tab.`);
    try {
      await navigator.clipboard.writeText(strip.copy);
      setSaid('Copied');
      if (strip.copy === you.email) track('email_copied');
    } catch {
      // Some browsers refuse the clipboard. Select the address so one key press copies it.
      const range = document.createRange();
      range.selectNodeContents(address.current!);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
      setSaid('Selected');
    }
  };

  const left = STRIPS.filter((strip) => strip && !taken.includes(strip.key)).length;

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
        <p className={s.said} aria-live="polite" data-said>
          {left ? said : 'All gone. The address is still up there.'}
        </p>
        <ul className={s.strips} style={{ gridTemplateColumns: `repeat(${STRIPS.length}, minmax(0, 1fr))` }}>
          {STRIPS.map((strip, i) => {
            // A strip that is gone leaves its place empty, and cannot be pulled again.
            if (!strip) return <li key={i} data-gone="before" />;
            const gone = taken.includes(strip.key);
            const text = <span aria-hidden="true">{strip.text}</span>;
            return (
              <li key={strip.key} data-gone={gone || undefined}>
                {strip.href ? (
                  <a
                    href={strip.href}
                    target={strip.download ? undefined : '_blank'}
                    rel="noreferrer"
                    download={strip.download}
                    aria-label={strip.label}
                    tabIndex={gone ? -1 : undefined}
                    onClick={() => {
                      if (strip.download) track('resume_downloaded', { from: 'contact' });
                      void take(strip);
                    }}
                    data-strip={strip.key}
                    data-resume={strip.download || undefined}
                  >
                    {text}
                  </a>
                ) : (
                  <button type="button" disabled={gone} onClick={() => take(strip)} aria-label={strip.label} data-strip={strip.key}>
                    {text}
                  </button>
                )}
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
