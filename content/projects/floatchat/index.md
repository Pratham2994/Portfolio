---
title: FloatChat
size: poster
order: 5
status: Smart India Hackathon 2025
tagline: Ask the ocean a question in plain language.
palette: { bg: '#06243a', fg: '#cfeeff', accent: '#ffc21a' }
art: { template: waves }
stats:
  - { value: '22/75', label: commits }
  - { value: '5', label: MCP tools }
  - { value: '3', label: layers }
sectors:
  - title: Data
    body: Argo float profiles in NetCDF files go through ETL into Postgres and a vector store.
  - title: Tools
    body: An MCP server gives the model SQL, heatmaps, map points and time series, so answers come from data and not from memory.
  - title: Chat
    body: Streamed answers with plots, a map picker and a prediction panel.
stack: [React, Node, Python, PostgreSQL, ChromaDB, MCP]
links: { repo: 'https://github.com/VarnikaBajpai4/FloatChat_DebugDynasty_SiH' }
role: Team of five. I worked on the chat client, the prompts and the wiring between the client and the model.
---
Ocean data is public, but you need to know NetCDF and a fair amount of scripting to ask it anything.

FloatChat lets you ask in plain language and answers with real Argo float data, on a map or a chart.
