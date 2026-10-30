---
title: Sandglass
size: poster
order: 3
made: '2026-10'
status: Live in the browser
tagline: Pour it, burn it, melt it. Then rewind.
summary: "A falling-sand physics sandbox in the browser: 246 elements built from physical properties, a chemistry compiler that makes the reaction table at load, a deterministic simulation with a 30-second rewind, and WebGL2 lighting."
palette: { bg: '#1f130c', fg: '#f2dfb4', accent: '#ff6a1f' }
art: { template: sand }
stats:
  - { value: '246', label: 'elements, each made of real properties' }
  - { value: '0', label: 'findings in 181,548 audit runs' }
  - { value: '30', label: seconds you can rewind }
sectors:
  - title: Chemistry from rules
    body: Every element is a list of real properties, like density, hardness, melting point and what it dissolves in. When the page loads, a small compiler turns general rules into a table of what happens when any two meet. About a hundred hand-written reactions sit on top, for things no rule covers, like lye and oil turning into soap.
  - title: An exact rewind
    body: The same seed and the same inputs always give the same world. So the last 30 seconds can be played back exactly. Drag back, draw something new, and the world goes on from there.
  - title: Tested by running it
    body: The audit puts every pair of elements together, cold, warm and hot, and anything the rules do not explain is a finding. That is 181,548 runs, and it shows 0. Another 284 checks each build a small scene and measure one thing an element promises.
stack: [TypeScript, WebGL2, Vite, Playwright]
links: { repo: 'https://github.com/Pratham2994/sandglass', live: 'https://sandglass.prathampanchal02994.workers.dev/' }
---
In most falling-sand games, every reaction is written by hand, one pair at a time. I wanted the chemistry to come out of what the elements are made of, and I wanted to be able to take back what I just did.

So in Sandglass, salt water is water carrying salt. Boil it and the salt comes back. Wire a battery to an LED with no resistor and the LED burns out. It all runs in your browser, with no server and no account.
