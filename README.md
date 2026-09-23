# Leaf Lane DAW — iPhone Web Prototype v1

A free, browser-based DAW prototype aimed at iPhone Safari. It intentionally uses no paid AI API.

## What is working in this prototype
- FL-style dark workstation layout with Browser, Playlist, Piano Roll, Velocity lane and Creator AI.
- Touch-friendly piano roll note drawing/erasing, scale-aware note placement, snap, zoom and velocity display.
- 30+ built-in 12-TET/world-inspired scale definitions plus an optional loader for the 5,350+ Scala archive source files. Loaded source scales can be transposed and projected into 12-TET piano-roll highlights, producing 64,200+ derived profiles. The derived-profile count is not a claim of 64,200 unique named historical scales.
- Prompt-based MIDI generation using a deterministic local procedural engine with a 9,000,000+ deterministic idea-space target. This is a generated variation universe, not nine million bundled files.
- 10,000+ prompt combinations generated from genre, mood, rhythm, harmony, register, texture and era vocabularies.
- Prompt-based MIDI editing: simplify, densify, humanize, syncopate, legato, staccato, octaves, arpeggiate, voice and melody extraction.
- Local chatbot with music-production guidance.
- Heuristic project-structure analyzer.
- MIDI-oriented AI mixer suggestions.
- MIDI import/export in the browser.
- Imported audio preview.
- Browser audio instruments: sampled piano, poly synth, mono bass and a guitar-style drive/cab/compressor chain.
- Recording/export path using the browser recorder (container format depends on iOS browser support).

## Deliberate limitations
- iPhone Safari cannot load desktop VST2/VST3/AU plugins as plugins. The browser version therefore uses Web Audio instruments/effects instead.
- The mixer currently analyzes MIDI structure, not isolated audio stems. True AI audio mixing requires stem analysis/DSP beyond this first static browser build.
- The local AI is procedural/rule-based. A cloud LLM/Music model can be connected later, but that would no longer be a guaranteed $0/no-key service.
- The 5,350+ Scala source-file count comes from the current Scala scale archive. The UI derives more highlight profiles instead of falsely calling every transposition a unique world scale.

## Free hosting
Netlify Drop can publish a static folder/zip by drag-and-drop and is currently offered as a free tier. GitHub Pages also supports static HTML/CSS/JS hosting for GitHub Free public repositories.

## External libraries
- Tone.js — https://tonejs.github.io/ (MIT)
- @tonejs/midi — https://www.npmjs.com/package/@tonejs/midi (MIT)
- TonalJS — https://github.com/tonaljs/tonal (MIT)

## Free asset references
- Salamander Grand Piano: CC-BY 3.0; https://sfzinstruments.github.io/pianos/salamander/
- CC0 drum samples: https://github.com/Boochi44/free-drum-samples
- Mutopia public-domain/CC MIDI and score collection: https://www.mutopiaproject.org/
- Scala scale archive: https://www.huygens-fokker.org/scala/downloads.html
