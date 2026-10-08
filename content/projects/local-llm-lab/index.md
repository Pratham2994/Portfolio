---
title: Local LLM lab
size: postcard
order: 10
status: 'Closed, verdict written'
tagline: Which local model gets the most right per hour on my PC.
palette: { bg: '#14161c', fg: '#ece8df', accent: '#3ddc84' }
art: { template: bars, motif: rank }
stats:
  - { value: '4,101', label: runs }
  - { value: '34', label: tasks }
  - { value: '1', label: 'metric: correct answers per hour' }
sectors:
  - title: The metric
    body: Tokens per second says how fast a model talks. Correct answers per hour says how much work it gets done.
  - title: The harness
    body: It drives llama.cpp, runs each task, and checks the answer by running tests or comparing SQL rows.
  - title: The finding
    body: The biggest model passed the most tasks. A smaller one got more right per hour.
stack: [Python, llama.cpp]
links: { repo: 'https://github.com/Pratham2994/LocaLLM' }
---
I got an RTX 5070 and wanted to know which open model was worth running on it. Benchmarks and tweets did not agree, so I measured it on my own tasks.

The answer for now: none of them replaces a frontier model yet. But I know how far off they are.
