/**
 * Follows the scroll of a project page, and writes where it is onto the page:
 * `--p` is how far down it is, from 0 to 1, and `data-sector` is how many thirds are done.
 * The "how it works" part, if the page has one that is pinned, gets the step it is on.
 * It only writes attributes. The look is in the CSS.
 */
export function follow(page: HTMLElement): () => void {
  const how = page.querySelector<HTMLElement>('[data-how]');
  let frame = 0;

  const read = () => {
    frame = 0;
    const room = page.scrollHeight - page.clientHeight;
    const done = room > 0 ? Math.min(Math.max(page.scrollTop / room, 0), 1) : 0;
    page.style.setProperty('--p', done.toFixed(4));
    page.dataset.sector = String(Math.min(Math.floor(done * 3 + 0.002), 3));

    if (!how) return;
    // The part is taller than the screen, and its content is pinned while the rest of it goes by.
    const box = how.getBoundingClientRect();
    const travel = box.height - window.innerHeight;
    const through = travel > 0 ? Math.min(Math.max(-box.top / travel, 0), 0.999) : 0;
    how.dataset.at = String(Math.floor(through * 3));
  };

  const onScroll = () => {
    frame ||= requestAnimationFrame(read);
  };
  page.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  read();
  return () => {
    cancelAnimationFrame(frame);
    page.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}
