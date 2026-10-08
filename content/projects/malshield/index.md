---
title: MalShield
size: poster
order: 9
status: Hackathon build
tagline: Malware detection with static analysis, dynamic analysis and YARA rules.
palette: { bg: '#2a1552', fg: '#e7dcff', accent: '#3ddc84' }
art: { template: hex }
stats:
  - { value: '5', label: file formats }
  - { value: '2', label: analysis modes }
  - { value: '17/26', label: commits }
sectors:
  - title: Static
    body: Features from PE files, classified with EMBER and LightGBM.
  - title: Rules
    body: YARA rules name the family of the threat.
  - title: Containers
    body: Each analyser runs in its own Docker image.
stack: [Python, LightGBM, YARA, Docker]
links: { repo: 'https://github.com/VarnikaBajpai4/ctrl_alt_elite_hack8' }
role: Built with Varnika Bajpai.
---
A hackathon build from my cyber security honours year. Drop in a file and it tells you whether it looks malicious, and why.
