---
title: Local LLM lab
size: poster
order: 8
status: Verdict written
tagline: Which local model is actually worth running?
palette: { bg: '#14161c', fg: '#ece8df', accent: '#3ddc84' }
art: { template: bars, motif: rank }
stats:
  - { value: '4,101', label: test runs }
  - { value: '34', label: tasks of my own }
  - { value: '1', label: 'number that matters: right answers per hour' }
sectors:
  - title: The number
    body: Tokens per second tells you how fast a model talks. Right answers per hour tells you how much work it gets done. Those are not the same model.
  - title: The harness
    body: It loads a model, runs every task, and checks the answer for real - it runs the tests, or compares the rows the SQL returns.
  - title: What I found
    body: The biggest model passed the most tasks. A smaller one got more right per hour. Neither replaces the big hosted models yet.
stack: [Python, llama.cpp]
links: { repo: 'https://github.com/Pratham2994/LocaLLM' }
---
I got an RTX 5070 and wanted to know which open model was worth running on it. The benchmarks and the internet did not agree with each other.

So I measured it myself, on my own tasks, with one question: how many correct answers do I get per hour?

Now I know exactly how far local models are from the hosted ones on my machine. Further than the hype, closer than I expected.
