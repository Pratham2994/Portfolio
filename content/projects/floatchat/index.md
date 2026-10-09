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
    body: Thousands of Argo floats drift around the oceans and measure temperature and salt. Their files get cleaned and loaded into Postgres, and the notes about them are indexed so they can be searched by meaning.
  - title: The tools
    body: The model does not answer from memory. It picks one of five tools, and the tool runs a real query. One draws a time series, one compares two of them, one draws a heatmap, one puts points on a map, and one runs SQL.
  - title: The chat
    body: You type a question in plain words. The answer streams back with the chart or the map next to it, and you can see which tool it used.
stack: [Python, FastMCP, PostgreSQL, ChromaDB, Node, React]
links: { repo: 'https://github.com/VarnikaBajpai4/FloatChat_DebugDynasty_SiH' }
---
Ocean data is public. Reading it is another matter: odd file formats, a lot of scripting, and you need to know what you are looking for before you start.

FloatChat lets you just ask. "How warm was the Arabian Sea last March?" comes back as a real answer from real float data, with the map to prove it.

We built it in 2025, when wiring a language model to tools was still new here and nothing came with a tutorial.
