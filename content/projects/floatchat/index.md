---
title: FloatChat
size: poster
order: 5
status: Smart India Hackathon 2025
tagline: Ask the ocean a question. Get a map back.
summary: "A natural-language interface to Argo ocean float data. A chain of model calls writes SQL through MCP tools and returns charts and maps. Smart India Hackathon 2025."
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
flow:
  nodes:
    - { id: chat, at: [1, 1], name: Chat, note: you ask in plain words, kind: you }
    - { id: server, at: [2, 1], name: Server, note: Node. Checks the login and saves the message }
    - { id: core, at: [3, 1], name: Core, note: FastAPI. It runs the whole chain }
    - { id: gate, at: [4, 1], name: Gatekeeper, note: 'model call 1: go on, ask back, or refuse' }
    - { id: schema, at: [5, 1], name: Schema, note: 'the tables, read from the MCP server', kind: store }
    - { id: pick, at: [5, 2], name: Orchestrator, note: 'call 2: which picture answers this' }
    - { id: sql, at: [4, 2], name: SQL writer, note: 'call 3: a query from the schema only' }
    - { id: query, at: [3, 2], name: sql_query, note: MCP tool. Postgres. SELECT only, kind: store }
    - { id: plot, at: [2, 2], name: Plot tool, note: MCP tool. Draws it and gives a link }
    - { id: sum, at: [1, 2], name: Summary, note: 'call 4: written for who is asking' }
  links:
    - [chat, server]
    - [server, core]
    - [core, gate]
    - [gate, schema]
    - [schema, pick]
    - [pick, sql]
    - [sql, query]
    - [query, plot]
    - [plot, sum]
    - [sum, chat]
---
Ocean data is public. Reading it is another matter: odd file formats, a lot of scripting, and you need to know what you are looking for before you start.

FloatChat lets you just ask. "How warm was the Arabian Sea last March?" comes back as a real answer from real float data, with the map to prove it.

We built it in 2025, when wiring a language model to tools was still new here and nothing came with a tutorial.
