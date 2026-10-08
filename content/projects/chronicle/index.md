---
title: Chronicle
size: postcard
order: 7
status: Data documentary
tagline: Your whole Spotify history, not one year of it.
palette: { bg: '#ffc21a', fg: '#191200', accent: '#c8102e' }
art: { template: bars, motif: eq }
stats:
  - { value: '5', label: behaviour metrics }
  - { value: '3', label: layers }
  - { value: '1', label: lifetime of plays }
sectors:
  - title: Binge curve
    body: Hours spent on one track inside a 24 hour window.
  - title: Night or day
    body: Timestamps decide whether you listen at night or in daylight.
  - title: Eras
    body: The history cut into the chapters of a life.
stack: [React, FastAPI, DuckDB]
links: { repo: 'https://github.com/Pratham2994/Chronicle' }
---
Wrapped gives you one year and five songs. Spotify will send you every play you have ever made if you ask for it.

Chronicle reads that export and shows how you listen, not only what.
