---
title: Chronicle
size: postcard
order: 9
made: '2026-06'
status: Side project
tagline: Your whole Spotify history, not one year of it.
summary: "An analysis of a full Spotify listening history with DuckDB and FastAPI, run on the user's own machine."
palette: { bg: '#ffc21a', fg: '#191200', accent: '#a50d25' }
art: { template: bars, motif: eq }
stats:
  - { value: '8', label: ways it cuts your history }
  - { value: '300', label: artists looked up for a genre }
  - { value: '0', label: accounts or logins needed }
sectors:
  - title: Your clock, not Spotify's
    body: Spotify stores every play in UTC. Read like that, a 9 pm habit in Mumbai shows up as the afternoon. So the first thing it does is move every play to where you live.
  - title: Chapters
    body: School, college and a first job fall on different years for everyone. So you tell it the year you were born and what came after, it drafts the chapters, and you fix the dates. Each chapter gets its own top songs and its own new find.
  - title: Ghosts and binges
    body: The most times you played one song in one day. The songs you played 50 times and then dropped for two years. The songs you let run again when they ended. Mine are embarrassing.
stack: [Python, FastAPI, DuckDB, React]
links: { repo: 'https://github.com/Pratham2994/Chronicle' }
flow:
  nodes:
    - { id: zip, at: [1, 1], name: The zip, note: 'every play you made, sent by Spotify', kind: you }
    - { id: upload, at: [2, 1], name: Upload, note: 'keeps the audio files, ignores the rest' }
    - { id: duck, at: [3, 1], name: DuckDB, note: 'all the files, read into one table', kind: store }
    - { id: clock, at: [4, 1], name: Local time, note: 'each play moved from UTC to your zone' }
    - { id: chapters, at: [5, 1], name: Chapters, note: 'your life, as dates you typed in' }
    - { id: sql, at: [5, 2], name: SQL, note: 'window functions rank, and find repeats' }
    - { id: genres, at: [4, 2], name: Genres, note: 'the top 300 artists, asked of iTunes once' }
    - { id: skips, at: [3, 2], name: Skip model, note: 'a small regression on 100,000 plays' }
    - { id: api, at: [2, 2], name: API, note: 'FastAPI, one address for each part' }
    - { id: page, at: [1, 2], name: The page, note: 'clock, years, habits, chapters, places' }
  links:
    - [zip, upload]
    - [upload, duck]
    - [duck, clock]
    - [clock, chapters]
    - [chapters, sql]
    - [sql, genres]
    - [genres, skips]
    - [skips, api]
    - [api, page]
---
Wrapped gives you one year and five songs. Spotify will send you every play you have ever made if you ask for it.

Chronicle reads that file on your own machine and shows how you listen, not only what. Nothing is uploaded.
