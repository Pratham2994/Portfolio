---
title: Algomotion
size: postcard
order: 10
status: Side project
tagline: Sorting and pathfinding, one step at a time.
palette: { bg: '#171a24', fg: '#ece8df', accent: '#2f6bff' }
art: { template: bars, motif: sort }
stats:
  - { value: '11', label: ways to sort }
  - { value: '6', label: ways to find a path }
  - { value: '4', label: kinds of list to test them on }
sectors:
  - title: Recorded, then played
    body: Each algorithm runs to the end first and writes down every compare and every swap. The page then plays that list back at the speed you pick. So slow motion and a pause cost nothing.
  - title: Pathfinding
    body: Draw walls, build a maze, add weights, allow diagonal moves. Six algorithms look for the way out, and the same seed gives the same maze, so two of them can be compared fairly.
  - title: The curve
    body: It counts the work, not the time, on bigger and bigger lists of four kinds, a few tries each. The Big-O line you were told about shows up by itself. You can paste your own code too, and a model estimates its Big-O.
stack: [JavaScript, React, Vite]
links: { repo: 'https://github.com/Pratham2994/Algomotion' }
flow:
  nodes:
    - { id: you, at: [1, 1], name: You, note: 'pick an algorithm, a list and a speed', kind: you }
    - { id: seed, at: [2, 1], name: Seed, note: the same seed gives the same list or maze }
    - { id: run, at: [3, 1], name: Run it once, note: 'to the end, at full speed, before any drawing' }
    - { id: steps, at: [4, 1], name: Step list, note: 'each compare, swap and visit, written down', kind: store }
    - { id: player, at: [5, 1], name: Player, note: plays the list back at the speed you set }
    - { id: view, at: [5, 2], name: Bars and grid, note: drawn from the step that is playing }
    - { id: count, at: [4, 2], name: Counters, note: 'compares and writes, as they happen' }
    - { id: bench, at: [3, 2], name: Bench, note: 'the same work on bigger lists, a few tries' }
    - { id: curve, at: [2, 2], name: Curve, note: 'the counts, set against the Big-O line' }
    - { id: ai, at: [1, 2], name: Code check, note: paste code. A model estimates its Big-O }
  links:
    - [you, seed]
    - [seed, run]
    - [run, steps]
    - [steps, player]
    - [player, view]
    - [view, count]
    - [count, bench]
    - [bench, curve]
    - [curve, ai]
---
I only understood algorithms once I could watch them move. This is the thing I wanted back when I was learning them.

Under it there is one idea. No algorithm is slowed down. Each one runs at full speed and leaves a list of what it did, and the page plays the list.
