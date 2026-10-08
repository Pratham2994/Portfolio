---
title: Neat
size: poster
order: 2
status: In daily use
tagline: A Windows tray app that treats Downloads as an inbox.
palette: { bg: '#0d3b28', fg: '#c9f7da', accent: '#ffc21a' }
art: { template: grid }
stats:
  - { value: 'v0.2', label: current version }
  - { value: '8', label: kinds of clutter it groups }
  - { value: '0', label: permanent deletes }
sectors:
  - title: Review in groups
    body: Unfinished downloads, duplicates, archives already extracted, installers for apps already installed. One decision per group.
  - title: Rules
    body: Tick one box and matching files are filed with no question from then on. Rules only move files.
  - title: Undo
    body: Every change is logged and can be undone. Removed files go to the Recycle Bin.
stack: [Rust, Windows]
links: { repo: 'https://github.com/Pratham2994/Neat' }
---
My Downloads folder was where files went to be forgotten. Sorting it by hand never lasted a week.

Neat treats the folder as an inbox. It shows what is there, says why it suggests what it suggests, and waits for me before it removes anything.
