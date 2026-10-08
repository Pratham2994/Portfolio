---
title: Scrub
size: poster
order: 1
hero: true
status: Local tool
tagline: A local ffmpeg GUI that can hit an exact file size.
palette: { bg: '#ece8df', fg: '#14161c', accent: '#ff5a1f' }
art: { template: frames }
stats:
  - { value: '24', label: operations }
  - { value: '2', label: pass encode to fit a size }
  - { value: '0', label: bytes sent to the internet }
sectors:
  - title: Fit a size
    body: Pick Discord, WhatsApp or email. Scrub works out the bitrate from the limit and the length, then encodes in two passes to get under it.
  - title: Command on screen
    body: The exact ffmpeg command is shown before it runs. You can copy it or edit it.
  - title: Trim on real frames
    body: Drag handles over frames from your own file. Crop works the same way.
stack: [TypeScript, ffmpeg]
links: { repo: 'https://github.com/Pratham2994/Scrub' }
---
I kept needing to get a clip under a size limit, and every ffmpeg front-end asked me how good I wanted it to look. That is the wrong question when Discord says 10 MB.

So Scrub asks for the limit and does the maths. It runs on my machine and nothing leaves it.
