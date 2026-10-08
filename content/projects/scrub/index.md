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
  - { value: '0', label: files that leave your PC }
  - { value: '1', label: window instead of a terminal }
sectors:
  - title: Cut and join
    body: Trim by dragging over the real frames of your video. Merge clips, and crossfade from one into the next.
  - title: Convert and shrink
    body: Change the format, or compress to what you need. Pick a quality, or pick a hard limit like 10 MB and it works out the rest.
  - title: Everything else
    body: Make a GIF, pull the audio out, swap it, resize, crop, speed up, loop. The exact command is on screen before it runs, if you want to learn it.
stack: [TypeScript, ffmpeg]
links: { repo: 'https://github.com/Pratham2994/Scrub' }
---
ffmpeg can do anything to a video. The catch is that you have to remember how to ask, and nobody does.

Scrub is the window I wanted in front of it. Drop a file in, pick what you want, and see the frames while you do it. Trim, merge, crossfade, convert, compress, make a GIF.

It all runs on your own machine. Nothing is uploaded anywhere, so you can use it on things you would not paste into some website.
