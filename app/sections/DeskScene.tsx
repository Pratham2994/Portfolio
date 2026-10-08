import { useEffect, useState } from 'react';

import type { DeskId } from '~/content/schema';

import s from './Desk.module.css';

type Props = { active: DeskId; onPick: (id: DeskId) => void };

/** The hour and minute in Pune, as angles for the clock hands. */
function usePuneTime() {
  const [time, setTime] = useState<{ hour: number; minute: number; text: string } | null>(null);
  useEffect(() => {
    const read = () => {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      const hour = Number(parts.find((p) => p.type === 'hour')!.value);
      const minute = Number(parts.find((p) => p.type === 'minute')!.value);
      setTime({ hour, minute, text: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` });
    };
    // The time is only known in the browser, so it is read once on mount and then every 20 seconds.
    read();
    const timer = setInterval(read, 20_000);
    return () => clearInterval(timer);
  }, []);
  return time;
}

const CLOCK_COLOURS = ['#2f6bff', '#ffc21a', '#ff3b3b', '#3ddc84', '#ff7a1a', '#b46bff'];

/**
 * His desk, drawn flat from the front: the upright screen and the main one, the keyboard
 * with yellow keys, the orange mouse, the headset, the laptop on its stand, the small
 * figures, and the tower with its fans on the floor.
 */
export function DeskScene({ active, onPick }: Props) {
  const time = usePuneTime();
  const part = (id: DeskId) => ({
    className: s.object,
    'data-object': id,
    'data-active': active === id || undefined,
    onClick: () => onPick(id),
  });
  const hourAngle = time ? ((time.hour % 12) + time.minute / 60) * 30 : 300;
  const minuteAngle = time ? time.minute * 6 : 60;

  return (
    <div className={s.scene}>
      <svg viewBox="0 0 1000 600" aria-hidden="true">
        {/* wall clock, showing the time in Pune */}
        <g className={s.clock}>
          <circle cx="900" cy="74" r="52" className={s.clockRim} />
          <circle cx="900" cy="74" r="44" className={s.clockFace} />
          {CLOCK_COLOURS.concat(CLOCK_COLOURS).map((colour, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return <circle key={i} cx={900 + Math.sin(angle) * 35} cy={74 - Math.cos(angle) * 35} r="3.4" fill={colour} />;
          })}
          <line x1="900" y1="74" x2="900" y2="50" className={s.hand} transform={`rotate(${hourAngle} 900 74)`} />
          <line x1="900" y1="74" x2="900" y2="40" className={s.handThin} transform={`rotate(${minuteAngle} 900 74)`} />
        </g>

        {/* desk top and legs */}
        <rect className={s.top} x="40" y="388" width="920" height="12" rx="2" />
        <rect className={s.leg} x="118" y="400" width="16" height="170" />
        <rect className={s.leg} x="850" y="400" width="16" height="170" />
        <rect className={s.leg} x="80" y="570" width="96" height="8" />
        <rect className={s.leg} x="812" y="570" width="96" height="8" />
        <rect className={s.footrest} x="430" y="536" width="150" height="34" rx="3" />

        {/* upright screen: sport */}
        <g {...part('sports')}>
          <rect className={s.bezel} x="96" y="118" width="164" height="258" rx="5" />
          <rect className={s.wallpaper} x="104" y="126" width="148" height="242" />
          <path className={s.peak} d="M104 300 L150 232 L176 262 L206 214 L252 286 V368 H104 Z" />
          <circle className={s.moon} cx="212" cy="162" r="9" />
          <rect className={s.stand} x="168" y="376" width="20" height="12" />
        </g>

        {/* main screen with its light bar: games */}
        <g {...part('games')}>
          <rect className={s.bar} x="318" y="176" width="214" height="7" rx="3" />
          <rect className={s.bezel} x="290" y="190" width="270" height="164" rx="5" />
          <rect className={s.wallpaperDeep} x="298" y="198" width="254" height="148" />
          <circle className={s.moon} cx="510" cy="224" r="15" />
          <path className={s.peakDeep} d="M298 346 V300 L344 276 L392 304 L440 262 L500 310 L552 284 V346 Z" />
          <rect className={s.stand} x="414" y="354" width="22" height="34" />
        </g>

        {/* keyboard, pad and the orange mouse */}
        <g className={s.still}>
          <rect className={s.pad} x="470" y="372" width="230" height="16" rx="2" />
          <rect className={s.keys} x="300" y="364" width="170" height="24" rx="3" />
          <rect className={s.keyYellow} x="308" y="369" width="22" height="6" />
          <rect className={s.keyYellow} x="418" y="369" width="28" height="6" />
          <rect className={s.keyYellow} x="352" y="379" width="64" height="5" />
          <circle className={s.knob} cx="458" cy="372" r="5" />
          <rect className={s.mouse} x="566" y="362" width="40" height="22" rx="11" />
        </g>

        {/* headset on its stand: music */}
        <g {...part('music')}>
          <rect className={s.stand} x="640" y="290" width="8" height="98" />
          <rect className={s.stand} x="622" y="382" width="44" height="6" />
          <path className={s.band} d="M610 318 a34 38 0 0 1 68 0" />
          <rect className={s.cup} x="600" y="310" width="18" height="44" rx="7" />
          <rect className={s.cup} x="670" y="310" width="18" height="44" rx="7" />
        </g>

        {/* laptop on its stand, with the small deck on top: right now */}
        <g {...part('now')}>
          <path className={s.laptop} d="M742 388 L772 300 L900 320 L872 388 Z" />
          <path className={s.laptopLine} d="M786 316 L852 352 M826 322 L802 372" />
          <rect className={s.deck} x="790" y="278" width="38" height="24" rx="3" />
          <rect className={s.deckScreen} x="794" y="282" width="30" height="16" />
        </g>

        {/* small figures: anime. the helmet and bottle are part of the picture. */}
        <g {...part('anime')}>
          <rect className={s.figBody} x="60" y="362" width="18" height="26" rx="2" />
          <rect className={s.figHat} x="54" y="352" width="30" height="8" rx="2" />
          <rect className={s.figHat} x="60" y="344" width="18" height="10" rx="3" />
        </g>
        <g className={s.still}>
          <path className={s.helmet} d="M20 388 a17 17 0 0 1 34 0 Z" />
          <path className={s.grill} d="M40 376 h14 M40 381 h14 M40 386 h14" />
          <rect className={s.bottle} x="268" y="330" width="14" height="58" rx="5" />
        </g>

        {/* the cube */}
        <g {...part('cube')}>
          <rect className={s.cubeFace} x="700" y="364" width="24" height="24" />
          <path className={s.cubeLine} d="M708 364v24M716 364v24M700 372h24M700 380h24" />
          <rect className={s.cubeA} x="700" y="364" width="8" height="8" />
          <rect className={s.cubeB} x="716" y="372" width="8" height="8" />
          <rect className={s.cubeC} x="708" y="380" width="8" height="8" />
        </g>

        {/* the tower on the floor, with three fans: the PC */}
        <g {...part('pc')}>
          <rect className={s.tower} x="884" y="438" width="96" height="140" rx="4" />
          <rect className={s.glass} x="892" y="446" width="80" height="124" />
          {[472, 508, 544].map((cy) => (
            <g key={cy} className={s.fan} style={{ transformOrigin: `948px ${cy}px` }}>
              <circle cx="948" cy={cy} r="15" className={s.fanRing} />
              <path className={s.fanBlade} d={`M948 ${cy - 12} v24 M936 ${cy} h24`} />
            </g>
          ))}
          <rect className={s.gpu} x="898" y="500" width="30" height="8" />
        </g>
      </svg>
      <p className={s.time}>
        Pune, <span data-time>{time?.text ?? '--:--'}</span>
      </p>
    </div>
  );
}
