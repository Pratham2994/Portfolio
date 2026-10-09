---
title: Prats-Deck
size: poster
order: 3
status: On my desk right now
tagline: A tiny touch screen that runs my desk.
palette: { bg: '#ff7a1a', fg: '#1f0d00', accent: '#fff4e6' }
art: { template: device }
stats:
  - { value: '15', label: apps on one small screen }
  - { value: '40', label: 'frames a second, up from 5' }
  - { value: '1', label: cat that dances }
sectors:
  - title: From 5 frames to 40
    body: The cat first drew at 5 frames a second. Faster drawing code, a better compiler setting and the second processor core took it to about 40.
  - title: No torn pictures
    body: This screen tears pictures that move. The deck reads which line the screen is drawing, and sends each picture only when it cannot cross it.
  - title: Tested without touching it
    body: A simulator runs the same code on a PC and saves screenshots. A script taps the real deck over USB and checks every app.
stack: [C++, Python, Raspberry Pi Pico 2 W]
links: { repo: 'https://github.com/Pratham2994/Prats-Deck' }
---
I bought a Raspberry Pi Pico and a small touch screen with no plan at all. Now it sits next to my keyboard and I use it all day.

It is a USB keyboard and a mouse, so the PC needs nothing installed. Buttons for music and shortcuts, a trackpad, and one screen that shows what the PC is doing. There are no libraries in it. The screen driver, the fonts and the drawing are all in the repo.

It also has a cat on it. Her name is Chindi and she dances to whatever I am playing. That part was not strictly necessary.
