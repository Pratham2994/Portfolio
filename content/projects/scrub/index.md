---
title: Scrub
size: poster
order: 1
hero: true
status: Runs on your own PC
tagline: ffmpeg, minus the terminal.
palette: { bg: '#ece8df', fg: '#14161c', accent: '#ff5a1f' }
art: { template: frames }
stats:
  - { value: '24', label: things it can do to a file }
  - { value: '338', label: 'tests, 67 of them on real ffmpeg' }
  - { value: '0', label: files that leave your PC }
sectors:
  - title: It can hit a size
    body: Discord says 10 MB and does not care how good your video looks. Give Scrub the limit and it works out the bitrate from the length, then encodes in two passes to land under it.
  - title: The command is on screen
    body: You see the exact ffmpeg command before it runs, and you can edit it. One function builds what you see and what runs, so the two can never disagree.
  - title: Trim over real frames
    body: Drag two handles over frames pulled from your own file. Jobs wait in a queue, and a finished result can go straight into the next step.
stack: [TypeScript, Node, React, ffmpeg]
links: { repo: 'https://github.com/Pratham2994/Scrub' }
---
ffmpeg can do anything to a video. The catch is that you have to remember how to ask, and nobody does.

Scrub is the window I wanted in front of it. Drop a file in, pick what you want, and see the frames while you do it. Trim, merge, crossfade, convert, compress, make a GIF.

It all runs on your own machine. Nothing is uploaded anywhere, so you can use it on things you would not paste into some website.

The fun part was under the window. A box where you can edit a command, on a server your browser can reach, is a nice way to get hacked. So Scrub only listens to your own machine, and it checks that a request really came from its own page. And the tests do not fake ffmpeg. They run it, then open the output file to see if it is right.
