import { useEffect, useRef, useState } from 'react';

import styles from './Wall.module.css';

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// One fixed, neutral light on the middle of the wall. It has no colour, so the wall stays one tone
// and the posters carry all the colour. The grain is left alone.
const fragment = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float pool(vec2 p, vec2 at, float reach) {
    float d = distance(p, at) / reach;
    return exp(-d * d);
  }

  void main() {
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(vUv.x * aspect, vUv.y);
    float spot = pool(p, vec2(0.5 * aspect, 0.52), 0.62);
    vec3 colour = vec3(0.058, 0.056, 0.054) * spot;
    colour += (hash(gl_FragCoord.xy) - 0.5) / 96.0;
    gl_FragColor = vec4(max(colour, 0.0), 1.0);
  }
`;

function supported(): boolean {
  return (
    window.matchMedia('(min-width: 900px) and (orientation: landscape)').matches &&
    navigator.hardwareConcurrency >= 4 &&
    !!document.createElement('canvas').getContext('webgl2')
  );
}

export function Light() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- support is only known in the browser
  useEffect(() => setOn(supported()), []);

  useEffect(() => {
    const el = canvas.current;
    if (!on || !el) return;
    let disposed = false;
    let observer: ResizeObserver | undefined;
    const onLost = () => setOn(false);
    el.addEventListener('webglcontextlost', onLost);

    void import('ogl').then(({ Renderer, Program, Mesh, Triangle }) => {
      if (disposed) return;
      const renderer = new Renderer({ canvas: el, dpr: Math.min(window.devicePixelRatio, 1.5) });
      const { gl } = renderer;
      const uniforms = { uRes: { value: [1, 1] } };
      const scene = new Mesh(gl, { geometry: new Triangle(gl), program: new Program(gl, { vertex, fragment, uniforms }) });
      const draw = () => {
        const { clientWidth: width, clientHeight: height } = el.parentElement!;
        renderer.setSize(width, height);
        uniforms.uRes.value = [width, height];
        renderer.render({ scene });
      };
      // The light is fixed, so it is drawn once and again only when the wall changes size.
      observer = new ResizeObserver(draw);
      observer.observe(el.parentElement!);
    });

    return () => {
      disposed = true;
      observer?.disconnect();
      el.removeEventListener('webglcontextlost', onLost);
    };
  }, [on]);

  if (!on) return null;
  return <canvas ref={canvas} className={styles.light} data-light aria-hidden="true" />;
}
