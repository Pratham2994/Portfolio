---
title: OmniCompiler
size: poster
order: 4
status: Paper under review
tagline: One debugger for five languages.
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
---
Every language ships its own debugger with its own commands. Switching between them is a small tax you pay all day, and for someone still learning it is one more thing to fight before the actual bug.

OmniCompiler runs and debugs five languages behind one interface. Each one still uses its own real debugger. A thin layer in the middle makes them all say the same thing.

It grew into a research paper. That is submitted and under review.
