---
title: FloatChat
size: poster
order: 5
status: Smart India Hackathon 2025
tagline: Ask the ocean a question. Get a map back.
palette: { bg: '#06243a', fg: '#cfeeff', accent: '#ffc21a' }
art: { template: waves }
stats:
  - { value: '5', label: tools the model can call }
  - { value: '3', label: 'layers: app, server, analytics' }
  - { value: '0', label: lines of SQL you have to write }
sectors:
  - title: The data
    body: Thousands of Argo floats drift around the oceans measuring temperature and salt. Their files get cleaned, loaded into Postgres and indexed for search.
  - title: The tools
    body: The model does not answer from memory. It calls tools that run real queries, draw heatmaps, plot points on a map and build time series.
  - title: The chat
    body: You type a question in plain words. The answer streams back with a chart or a map next to it, and a panel for predictions.
stack: [React, Node, Python, PostgreSQL, ChromaDB, MCP]
links: { repo: 'https://github.com/VarnikaBajpai4/FloatChat_DebugDynasty_SiH' }
---
Ocean data is public. Reading it is another matter: odd file formats, a lot of scripting, and you need to know what you are looking for before you start.

FloatChat lets you just ask. "How warm was the Arabian Sea last March?" comes back as a real answer from real float data, with the map to prove it.

We built it in 2025, when wiring a language model to tools was still new here and nothing came with a tutorial.
