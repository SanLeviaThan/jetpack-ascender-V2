# Jetpack Ascender V2

A browser-based vertical survival game built with HTML, CSS, and vanilla JavaScript using the Phaser 3 game framework.

## Project Structure

- `index.html` — Main game entry point
- `style.css` — All game styles
- `game.js` — Phaser bootstrap
- `js/` — Game source files
  - `core/` — Config and state
  - `data/` — Level layer data
  - `entities/` — Player, enemies, world items
  - `scenes/` — Phaser scenes (boot, menu, game)
  - `systems/` — Audio, input, HUD, backend, spawn, storage, UI
- `assets/` — Game images and sprites
- `player/` — Player sprite assets

## Tech Stack

- Pure static HTML/CSS/JavaScript (no build system)
- [Phaser 3](https://phaser.io/) loaded from CDN
- Google Fonts (Orbitron, Share Tech Mono) loaded from CDN
- JSONBin.io for global leaderboard/ranking

## Running Locally

The app is served with `serve . -l 5000` as a static file server.

## Deployment

Configured as a static deployment with `publicDir: "."`.
