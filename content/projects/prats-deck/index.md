---
title: Prats-Deck
size: poster
order: 3
status: On my desk right now
tagline: A tiny touch screen that runs my desk.
summary: "A touch-screen control deck on a Raspberry Pi Pico 2 W, with C++ firmware and a Python companion on the PC."
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
flow:
  nodes:
    - { id: stylus, at: [1, 1], name: Stylus, note: a tap or a drag on the screen, kind: you }
    - { id: touch, at: [2, 1], name: Touch, note: 'calibrated and smoothed. A lift after 100 ms' }
    - { id: app, at: [3, 1], name: App, note: one of 15. Each is one header file }
    - { id: draw, at: [4, 1], name: Draw, note: 'smooth shapes and text, with no library' }
    - { id: cores, at: [5, 1], name: Both cores, note: each one draws its own rows of the frame }
    - { id: sync, at: [5, 2], name: Sync, note: 'waits for the scan line, then sends' }
    - { id: screen, at: [4, 2], name: Screen, note: '320 by 240, at about 41 a second' }
    - { id: pc, at: [1, 2], name: PC, note: a small script sends stats and the song, kind: store }
    - { id: usb, at: [2, 2], name: USB, note: 'serial in. Keyboard and mouse out' }
  links:
    - [stylus, touch]
    - [touch, app]
    - [pc, usb]
    - [usb, app]
    - [app, draw]
    - [draw, cores]
    - [cores, sync]
    - [sync, screen]
---
I bought a Raspberry Pi Pico and a small touch screen with no plan at all. Now it sits next to my keyboard and I use it all day.

It is a USB keyboard and a mouse, so the PC needs nothing installed. Buttons for music and shortcuts, a trackpad, and one screen that shows what the PC is doing. There are no libraries in it. The screen driver, the fonts and the drawing are all in the repo.

It also has a cat on it. Her name is Chindi and she dances to whatever I am playing. That part was not strictly necessary.
