# Slow Roads-Style Relaxing Driving Game

A complete browser-based, relaxing endless driving experience inspired by **Slow Roads**, built with **Three.js** (WebGL) in vanilla HTML/JS — no build tools, no install. Open [index.html](file:///d:/car/index.html) directly in any modern browser.

## Proposed Changes

### Project Structure

```
d:\car\
  index.html        ← Main entry, HTML shell + CSS
  js/
    main.js         ← Game bootstrap & loop
    terrain.js      ← Procedural terrain + road generation
    vehicle.js      ← Car mesh, physics, steering
    environment.js  ← Trees, clouds, sky, weather
    audio.js        ← Music player + ambient sounds
    ui.js           ← HUD, menus, settings panel
  assets/
    music/          ← User places their .mp3 files here
```

### Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Renderer | Three.js r152 (CDN) | WebGL, no install needed |
| Terrain Noise | SimplexNoise (CDN) | Procedural smooth terrain |
| Physics | Custom spring/momentum | Lightweight, browser-optimized |
| Audio | Web Audio API + `<audio>` | Native browser, no deps |
| Styling | Vanilla CSS + Google Fonts | Rich glassmorphism UI |

---

## Key Features

### 1. Procedural Terrain & Road
- Uses **Simplex noise** to generate a height-mapped terrain grid that scrolls infinitely
- Road path follows a **Catmull-Rom spline** through waypoints; the car tracks this curve
- Road is rebuilt in chunks — old chunks recycled ahead of the player
- Terrain mesh tiles are reused (chunk-based), giving infinite feel without memory leaks

### 2. Realistic Car Physics
- **Acceleration / braking** with inertia
- **Steering** with speed-influenced turning radius
- **Wheel rotation** matches speed
- **Camera** follows with spring-damped lag — feels cinematic
- Optional **Autodrive** mode (car steers itself along road center)

### 3. Environment
- **Sky**: Dynamic gradient sky using `THREE.Sky` or shader, updates for time-of-day
- **Fog**: Atmospheric depth fog matches sky color
- **Trees / Foliage**: Instanced mesh for hundreds of trees with low draw calls
- **Clouds**: Billboard or volumetric cloud planes, slow drift
- **Weather**: Rain (particle system) / Snow particles toggle

### 4. Biomes / Scenes
| Biome | Colors | Trees | Sky |
|---|---|---|---|
| 🌿 Meadow | Lush greens | Oaks, pines | Blue sky |
| 🍂 Autumn | Oranges, reds | Bare + colored | Golden |
| ❄️ Snow | White, grey | Snow-capped | Cloudy grey |
| 🏜️ Desert | Sandy yellows | Cacti, sparse | Hazy orange |

### 5. Music Player
- Scans for songs at known paths (`assets/music/song1.mp3`, `song2.mp3`, …)
- Users drop their `.mp3` files into `assets/music/`
- Displayed as: track name, prev/next, play/pause, volume slider
- Smooth fade between tracks

### 6. Premium UI
- **Splash screen**: Animated 3D scene preview, game title, start button
- **HUD**: Glassmorphism panel — speedometer (analog), distance driven, current time, track name
- **Settings drawer**: Biome, time of day slider, weather toggle, music controls
- **Fonts**: `Outfit` from Google Fonts

---

## Verification Plan

### Manual Browser Testing (open [d:\car\index.html](file:///d:/car/index.html) in Chrome/Edge)
1. **Rendering**: Scene loads, terrain visible, road visible, sky gradient shows
2. **Driving**: Arrow keys / WASD steer car; car moves forward continuously
3. **Infinite road**: Drive for 60 seconds — road never ends or clips
4. **Biome switch**: Open settings → change biome → scene colors/trees change
5. **Day-Night**: Drag time slider → sky, fog, and lighting update live
6. **Weather**: Toggle rain → particles appear; toggle off → disappear
7. **Music**: Place an `.mp3` in `assets/music/` folder → click play → music plays; next/prev work
8. **Autodrive**: Toggle autodrive → car steers itself along road without player input

> [!NOTE]
> No automated tests — this is a single-file browser game. All verification is visual/interactive.
