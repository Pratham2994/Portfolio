---
title: MalShield
size: poster
order: 7
made: '2025-02'
status: Hackathon build
tagline: Drop in a file. Find out if it bites.
summary: "Static malware analysis for programs and documents with LightGBM, YARA and macro extraction, and a report that names the likely family."
palette: { bg: '#2a1552', fg: '#e7dcff', accent: '#3ddc84' }
art: { template: hex }
stats:
  - { value: '5', label: kinds of file it can check }
  - { value: '74', label: YARA rules it scans with }
  - { value: '7', label: malware families it can name }
sectors:
  - title: First, what is it
    body: It does not trust the name of the file. It reads the first bytes to learn the real type, and it opens a zip inside a zip to reach what is hidden there.
  - title: Without running it
    body: A LightGBM model scores the structure of a program. Then the imports, the sections and the strings are read, and 74 YARA rules are tried. From a document it pulls out the macros. A model then names the likely family, with a reason.
  - title: By running it
    body: The file is run inside a sealed Docker container while everything it touches is recorded. We wrote this part ourselves. It is not in the public repo.
stack: [Python, FastAPI, LightGBM, YARA, Docker, Gemini]
links: { repo: 'https://github.com/VarnikaBajpai4/ctrl_alt_elite_hack8' }
flow:
  nodes:
    - { id: file, at: [1, 1], name: A file, note: 'dropped on the page, one or many', kind: you }
    - { id: unpack, at: [2, 1], name: Unpack, note: 'zips, and zips inside zips' }
    - { id: type, at: [3, 1], name: Identify, note: 'by its first bytes, not by its name' }
    - { id: model, at: [4, 1], name: Model, note: LightGBM scores the structure. In Docker }
    - { id: read, at: [5, 1], name: Static read, note: 'imports, sections, strings and hashes' }
    - { id: yara, at: [5, 2], name: YARA, note: '74 rules, tried one by one' }
    - { id: docs, at: [4, 2], name: Documents, note: macros and risky PDF keys are pulled out }
    - { id: family, at: [3, 2], name: Family, note: Gemini reads the report and names it }
    - { id: box, at: [2, 2], name: Sandbox, note: 'run in a sealed box. Not in the repo' }
    - { id: report, at: [1, 2], name: Report, note: 'a score, the family, and the reasons' }
  links:
    - [file, unpack]
    - [unpack, type]
    - [type, model]
    - [model, read]
    - [read, yara]
    - [yara, docs]
    - [docs, family]
    - [family, box]
    - [box, report]
---
A malware checker from my cyber security honours year.

It looks at a suspicious file in two ways. First without running it: what it is made of and what it resembles. Then by running it in a locked box and watching what it does.

We tried the usual sandbox tools for the second part. They fought us the whole way, so we wrote our own.
