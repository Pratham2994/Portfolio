---
title: iDEA Hackathon
size: poster
order: 6
status: 3rd prize
tagline: A bank service desk that knows who is asking.
summary: "A bank service desk that identifies the customer by password and face, transcribes speech, and routes the query to a department queue."
palette: { bg: '#a90d26', fg: '#fff4ee', accent: '#ffc21a' }
art: { template: type, motif: P3 }
stats:
  - { value: '3rd', label: 'prize, national hackathon' }
  - { value: '3', label: 'ways to ask: type, speak, or record' }
  - { value: '4', label: departments it sorts into }
sectors:
  - title: Two locks
    body: You log in with a password and your face. The face is turned into numbers when you sign up, and each login is checked against them. The staff log in the same way.
  - title: Say it your way
    body: Type it, speak it, or record a video. Whisper turns speech into text. Then the words in it pick one of four departments, and the word lists hold the usual misheard words too.
  - title: Wait, or book
    body: Take a live turn and see your place in the queue, or book a half-hour slot in the next seven days. The staff side shows the queue, most urgent first.
stack: [Python, FastAPI, Whisper, DeepFace, Node, PostgreSQL, React, Twilio]
links: { repo: 'https://github.com/AmaanSyed2004/ideahack-DebugDynasty' }
flow:
  nodes:
    - { id: you, at: [1, 1], name: Customer, note: 'types, speaks, or records a video', kind: you }
    - { id: login, at: [2, 1], name: Login, note: 'a password, then a photo of the face' }
    - { id: face, at: [3, 1], name: Face match, note: 'ArcFace numbers, set against the stored ones' }
    - { id: server, at: [4, 1], name: Server, note: Node. Takes the file and makes the ticket }
    - { id: hear, at: [5, 1], name: Whisper, note: 'speech to text. ffmpeg pulls the sound first' }
    - { id: sort, at: [5, 2], name: Sorter, note: 'counts department words, misheard ones too' }
    - { id: ticket, at: [4, 2], name: Ticket, note: 'Postgres. The file, the text, the department', kind: store }
    - { id: pick, at: [3, 2], name: Live or later, note: 'a turn in the queue, or a booked slot' }
    - { id: queue, at: [2, 2], name: Queue, note: 'highest priority first, then the oldest' }
    - { id: desk, at: [1, 2], name: Staff desk, note: takes the next one and closes it }
  links:
    - [you, login]
    - [login, face]
    - [face, server]
    - [server, hear]
    - [hear, sort]
    - [sort, ticket]
    - [ticket, pick]
    - [pick, queue]
    - [queue, desk]
---
Union Bank of India ran a national hackathon and gave us two days.

We built a service desk for a bank branch. You log in with your face, say what is wrong in your own words, and it goes to the right department. Then you choose: wait in a live queue, or book a time.

We took third place.
