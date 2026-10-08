---
title: OmniCompiler
size: poster
order: 4
status: Paper under review
tagline: One debugger for five languages.
palette: { bg: '#2447d8', fg: '#f3f5ff', accent: '#ff3b3b' }
art: { template: code }
stats:
  - { value: '5', label: languages in one place }
  - { value: '10/12', label: debugger actions that work in all five }
  - { value: '0.86', label: 'F1 score, breakpoint suggestions' }
sectors:
  - title: One set of controls
    body: Python, JavaScript, Java, C++ and Go each bring their own debugger. A layer built on the ideas of DAP turns all five into the same buttons - step, pause, inspect.
  - title: Safe to paste into
    body: Every run gets its own short-lived Docker container with limits on time and memory. An infinite loop hurts nobody.
  - title: It suggests where to stop
    body: A model reads the code and marks the lines where a breakpoint is likely to be useful.
stack: [React, FastAPI, Docker, Random Forest, Gemini]
links: { repo: 'https://github.com/Pratham2994/OmniCompiler' }
---
Every language ships its own debugger with its own commands. Switching between them is a small tax you pay all day, and for someone still learning it is one more thing to fight before the actual bug.

OmniCompiler runs and debugs five languages behind one interface. Frontend, backend, the Docker plumbing and the debugger layer in between.

It grew into a research paper. That is submitted and under review.
