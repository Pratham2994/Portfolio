---
title: Neat
size: poster
order: 2
made: '2026-09'
status: I use it every day
tagline: Stops the Downloads folder from becoming a landfill.
summary: "A Windows app in Rust and Tauri that watches the Downloads folder, finds duplicates by hash, and groups files for review."
palette: { bg: '#0d3b28', fg: '#c9f7da', accent: '#ffc21a' }
art: { template: grid }
stats:
  - { value: 'v0.2', label: and already on my PC all day }
  - { value: '8', label: kinds of clutter it spots }
  - { value: '0', label: files deleted for good }
sectors:
  - title: It sorts as things arrive
    body: Half-finished downloads, the same PDF three times, a zip and the folder it came from, installers for apps you already have. Each kind gets one decision.
  - title: It learns your answer
    body: Tick one box and files like that get filed on their own from then on. Rules only ever move things.
  - title: It can take it back
    body: Every change is logged and can be undone. Anything removed goes to the Recycle Bin, never further.
stack: [Rust, Tauri, SQLite, Windows]
links: { repo: 'https://github.com/Pratham2994/Neat' }
flow:
  nodes:
    - { id: folder, at: [1, 1], name: Downloads, note: a new file lands, kind: you }
    - { id: watch, at: [2, 1], name: Watcher, note: in the tray. Waits until the file is whole }
    - { id: scan, at: [3, 1], name: Scan, note: 'top level only. Skips what is in use' }
    - { id: signs, at: [4, 1], name: Signals, note: 'source site, hash, name, installed apps' }
    - { id: detect, at: [5, 1], name: Detect, note: 'groups. A file is in one group only' }
    - { id: rules, at: [5, 2], name: Rules, note: what you said to always do }
    - { id: queue, at: [4, 2], name: Review queue, note: 'one decision each, with the reason' }
    - { id: engine, at: [3, 2], name: Engine, note: moves it or sends it to the Recycle Bin }
    - { id: log, at: [2, 2], name: Journal, note: SQLite. Every change. Undo reads it, kind: store }
    - { id: tidy, at: [1, 2], name: Tidy folder, note: nothing left the folder }
  links:
    - [folder, watch]
    - [watch, scan]
    - [scan, signs]
    - [signs, detect]
    - [detect, rules]
    - [rules, queue]
    - [queue, engine]
    - [engine, log]
    - [log, tidy]
---
Everyone's Downloads folder is the same. Gigabytes of installers you ran once, duplicates everywhere, and the one file you need buried under all of it. You only notice when you have to find something.

Neat lives in the tray and keeps it in order as files come in. It tells you why it wants to move a thing, and it waits for you before it removes anything.
