---
title: OmniCompiler
size: poster
order: 4
made: '2025-09'
status: Paper under review
tagline: One debugger for five languages.
summary: "A web debugger for five languages that puts the native debugger of each one behind a single interface. Research paper submitted, under review."
palette: { bg: '#2a3a70', fg: '#eef1fb', accent: '#ff8a5c' }
art: { template: code }
stats:
  - { value: '5', label: languages in one place }
  - { value: '10/12', label: debugger actions that work in all five }
  - { value: '300', label: milliseconds to start a clean container }
sectors:
  - title: One set of controls
    body: Python, JavaScript, Java, C++ and Go each bring their own debugger. Five small adapters turn all of them into the same short messages, so the buttons never change. Measured on live sessions, ten of twelve actions work in all five.
  - title: Safe to paste into
    body: Every run gets a new Docker container, with limits on processor and memory, and it is thrown away after. An infinite loop hurts nobody. In the tests, 250 runs out of 250 finished right.
  - title: It guesses for you
    body: Paste code and it works out the language. On a test set with text made to fool it, it got none wrong. A second model marks the lines where a breakpoint is likely to help, with an F1 score of 0.86.
stack: [Python, FastAPI, Docker, React, Random Forest, Gemini]
links: { repo: 'https://github.com/Pratham2994/OmniCompiler' }
flow:
  nodes:
    - { id: editor, at: [1, 1], name: Editor, note: you paste code and press Debug, kind: you }
    - { id: detect, at: [2, 1], name: Detector, note: 'patterns first, then Pygments, or it says unsure' }
    - { id: api, at: [3, 1], name: API, note: FastAPI. Makes the session }
    - { id: box, at: [4, 1], name: Container, note: 'new Docker box, with limits, used once' }
    - { id: shim, at: [5, 1], name: Adapter, note: one per language. Speaks JSON on stdin }
    - { id: native, at: [5, 2], name: Debugger, note: 'bdb, Inspector, jdb, gdb or Delve' }
    - { id: bridge, at: [4, 2], name: Bridge, note: the server turns each event into one shape }
    - { id: socket, at: [3, 2], name: WebSocket, note: 'one stream per session, back to the page' }
    - { id: model, at: [2, 2], name: Breakpoints, note: a Random Forest scores each line }
    - { id: view, at: [1, 2], name: Debug view, note: 'the same buttons, whatever is under it' }
  links:
    - [editor, detect]
    - [detect, api]
    - [api, box]
    - [box, shim]
    - [shim, native]
    - [native, bridge]
    - [bridge, socket]
    - [socket, model]
    - [model, view]
---
Every language ships its own debugger with its own commands. Switching between them is a small tax you pay all day, and for someone still learning it is one more thing to fight before the actual bug.

OmniCompiler runs and debugs five languages behind one interface. Each one still uses its own real debugger. A thin layer in the middle makes them all say the same thing.

It grew into a research paper. That is submitted and under review.
