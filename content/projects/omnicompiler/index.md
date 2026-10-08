---
title: OmniCompiler
size: poster
order: 4
status: Paper under review
tagline: Run and debug five languages in one place.
palette: { bg: '#2447d8', fg: '#f3f5ff', accent: '#ff3b3b' }
art: { template: code }
stats:
  - { value: '5', label: languages }
  - { value: '10/12', label: debug functions in all five }
  - { value: '0.86', label: 'F1, breakpoint model' }
sectors:
  - title: One event model
    body: Python, JavaScript, Java, C++ and Go each have their own debugger. A thin layer in the style of DAP turns all five into the same events.
  - title: Sandboxes
    body: Every run is in its own short-lived Docker container, with limits on time and memory.
  - title: Breakpoint advice
    body: A Random Forest model looks at the code and suggests where to pause.
stack: [React, FastAPI, Docker, Random Forest, Gemini]
links: { repo: 'https://github.com/Pratham2994/OmniCompiler' }
role: Built with Varnika Bajpai. A paper on the system is under review.
---
Each language has its own debugger with its own commands. Moving between them is slow, and for a student it is one more thing to learn before the actual bug.

OmniCompiler puts five of them behind one interface. We wrote a paper on it, and the paper also reports the part that did not work: giving the control-flow graph to a language model made no measurable difference.
