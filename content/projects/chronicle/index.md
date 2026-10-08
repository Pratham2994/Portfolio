---
title: Chronicle
size: postcard
order: 9
status: Side project
tagline: Your whole Spotify history, not one year of it.
palette: { bg: '#ffc21a', fg: '#191200', accent: '#a50d25' }
art: { template: bars, motif: eq }
stats:
  - { value: '5', label: habits it measures }
  - { value: '1', label: lifetime of plays }
  - { value: '0', label: accounts or logins needed }
sectors:
  - title: The binge
    body: The most hours you ever spent on one song in a single day. Everyone has one. Mine is embarrassing.
  - title: Night or day
    body: It reads the timestamps and tells you whether you are a 2 am listener.
  - title: Eras
    body: Your history cut into chapters - school, college, work - with what you were playing in each.
stack: [React, FastAPI, DuckDB]
links: { repo: 'https://github.com/Pratham2994/Chronicle' }
---
Wrapped gives you one year and five songs. Spotify will send you every play you have ever made if you ask for it.

Chronicle reads that file on your own machine and shows how you listen, not only what.
