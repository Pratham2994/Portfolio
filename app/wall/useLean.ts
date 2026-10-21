import gsap from 'gsap';
import { useRef, type PointerEvent } from 'react';

import { finePointer, prefersReducedMotion } from '~/lib/motion';

// How far a sheet leans toward the pointer, in degrees.
const LEAN = 13;

/**
 * A sheet on the wall leans toward the pointer like loose paper, and springs back when the
 * pointer leaves. It sets --rx and --ry on the element; the CSS turns them into a rotation.
 */
export function useLean<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  const lean = (rx: number, ry: number, settle = false) =>
    gsap.to(ref.current, {
      '--rx': rx,
      '--ry': ry,
      duration: settle ? 1.1 : 0.45,
      ease: settle ? 'elastic.out(1, 0.45)' : 'power3.out',
      overwrite: 'auto',
    });

  const onPointerMove = (event: PointerEvent<T>) => {
    if (event.pointerType !== 'mouse' || !finePointer() || prefersReducedMotion()) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    lean(-y * LEAN, x * LEAN);
  };

  return { ref, onPointerMove, onPointerLeave: () => lean(0, 0, true) };
}
