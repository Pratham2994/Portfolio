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
    // The part is taller than its content, and the content is pinned while the rest of it goes by.
    // It is pinned from when the part reaches the pin's place to when its end reaches the pin's end.
    const pin = how.firstElementChild as HTMLElement;
    const held = parseFloat(getComputedStyle(pin).top) || 0;
    const box = how.getBoundingClientRect();
    const travel = box.height - pin.offsetHeight;
    const through = travel > 1 ? Math.min(Math.max((held - box.top) / travel, 0), 0.999) : 0;
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
