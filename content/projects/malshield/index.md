---
title: MalShield
size: poster
order: 7
status: Hackathon build
tagline: Drop in a file. Find out if it bites.
palette: { bg: '#2a1552', fg: '#e7dcff', accent: '#3ddc84' }
art: { template: hex }
stats:
  - { value: '5', label: file types it can check }
  - { value: '2', label: 'ways it looks: still, and running' }
  - { value: '1', label: sandbox we wrote ourselves }
sectors:
  - title: Without running it
    body: It reads the structure of the file and compares it against known patterns. A model trained on malware samples gives a first verdict, and YARA rules name the family.
  - title: By running it
    body: The file is run inside a sealed Docker container while everything it touches is recorded. If it reaches for something it should not, that goes in the report.
  - title: The verdict
    body: Both views are combined into one answer you can read - what it is, what it tried to do, and how sure the system is.
stack: [Python, LightGBM, YARA, Docker]
links: { repo: 'https://github.com/VarnikaBajpai4/ctrl_alt_elite_hack8' }
---
A malware checker from my cyber security honours year.

It looks at a suspicious file in two ways. First without running it: what it is made of and what it resembles. Then by actually running it in a locked box and watching what it does.

We tried the usual sandbox tools for the second part. They fought us the whole way, so we wrote our own.
