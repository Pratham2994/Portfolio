---
title: Blind Lap
size: poster
order: 1
hero: true
made: '2026-10'
status: Live, play a lap
tagline: Name the F1 driver from the data alone.
summary: "A game and a study: a model names the driver of a real F1 qualifying lap from the telemetry alone. Ten measurements at every corner, three models tested on circuits they never saw, and a 3D replay with an engine sound made from the data."
palette: { bg: '#d0140c', fg: '#f6efe3', accent: '#14100f' }
art: { template: lap }
stats:
  - { value: '45%', label: 'right first guess, on circuits it never saw. Chance is 3%' }
  - { value: '74%', label: 'right between two teammates in the same car. Chance is 50%' }
  - { value: '7,755', label: 'real qualifying laps, from 2023 to 2026' }
sectors:
  - title: One line per circuit
    body: The fastest lap of each session becomes the line of the circuit. Every sample of every lap is placed on that line, so 300 m means the same spot for every driver. Laps that lose data, or do not match the official lap time, are left out.
  - title: How, not how fast
    body: At each corner, ten things are measured, like where the braking starts, the slowest speed, and when the throttle is fully open again. Each one is set against the whole field at that corner. So "brakes 9 m later than the field" means the same at Monza and at Monaco.
  - title: Tested where it never trained
    body: Three models read the corners, boosted trees, a random forest and a logistic regression, and their guesses are joined. The model that guesses at Monza never saw Monza, in any year. Over 7,755 laps it names the right driver 45% of the time. Picking at random gets 3%.
stack: [Python, scikit-learn, NumPy, SciPy, TypeScript, Three.js, Web Audio, Playwright]
links: { repo: 'https://github.com/Pratham2994/Blindlap', live: 'https://pratham2994.github.io/Blindlap/' }
---
F1 fans say they can tell drivers apart by how they take a corner. I wanted to find out if a model could do it from the numbers alone, with no name, no car colours and no team radio.

So Blind Lap replays a real qualifying lap with the name taken off. As the car leaves each corner, the model reads how it was driven and changes its guess. You guess too. Then the name comes back, with the driver's real team radio.

It can also take the car out of a driver's style. For nine team moves, like Hamilton to Ferrari, it guessed how the driver would drive in the new car without any of those laps. That guess beat "drives as before" in seven of the nine.
