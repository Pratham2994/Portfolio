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
    body: It starts llama-server with one model, sends every task five times, and checks each answer for real. It runs the tests, or compares the rows the SQL gives back. Every run is one line in a log, so a run that stops can go on later.
  - title: What I found
    body: The biggest model passed the most tasks. A smaller one got more right per hour. Of six fine-tunes, five scored below the model they came from. And none of them replaces the big hosted models yet.
stack: [Python, llama.cpp, CUDA]
links: { repo: 'https://github.com/Pratham2994/LocaLLM' }
flow:
  nodes:
    - { id: config, at: [1, 1], name: Config, note: one small file for each experiment, kind: you }
    - { id: server, at: [2, 1], name: llama-server, note: llama.cpp loads the model on the GPU }
    - { id: runner, at: [3, 1], name: Runner, note: 'sends each task. A stopped run can go on' }
    - { id: model, at: [4, 1], name: Model, note: 'answers over the same API as hosted ones' }
    - { id: checks, at: [5, 1], name: Checks, note: 'runs the tests, compares the SQL rows' }
    - { id: log, at: [5, 2], name: Log, note: 'one line a run: answer, pass, speed', kind: store }
    - { id: report, at: [4, 2], name: Report, note: 'right answers per hour, model by model' }
    - { id: needle, at: [3, 2], name: Needle, note: 'hides a fact in a long text, asks for it' }
    - { id: agent, at: [2, 2], name: Agent tier, note: '43 tasks with tools, in a small repo' }
    - { id: verdict, at: [1, 2], name: Verdict, note: 'which model to run, and when' }
  links:
    - [config, server]
    - [server, runner]
    - [runner, model]
    - [model, checks]
    - [checks, log]
    - [log, report]
    - [report, needle]
    - [needle, agent]
    - [agent, verdict]
---
I got an RTX 5070 and wanted to know which open model was worth running on it. The benchmarks and the internet did not agree with each other.

So I measured it myself, on my own tasks, with one question: how many correct answers do I get per hour?

Now I know exactly how far local models are from the hosted ones on my machine. Further than the hype, closer than I expected.
