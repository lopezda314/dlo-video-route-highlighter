# VideoRouteHighlighter — The Co-Op Life Map Animator

A lightweight local tool for generating **2–5 second animated route progress callouts** (e.g., *Hudson River Greenway: Battery Park → 14th Street*) with marching dashed lines and custom bobbing head cutouts of **David & Amanda**.

## Quick Start

1. **Option A (Recommended for 60fps Video Export with Map Tiles):**
   Double-click **`start.command`** in Finder (or run `./start.command` in Terminal). It opens `http://localhost:8765/index.html` in your browser and ensures map tiles record with zero browser CORS restrictions.
2. **Option B (Direct Open):**
   Open `index.html` directly in Chrome, Arc, or Safari.

---

## Core Features

- **Pre-Loaded with *The Co-Op Life* Episode Blueprints**:
  - **Hudson River Greenway** (Default: *Battery Park → 14th St / Little Island* in `3.0s`)
  - **Video 1: Bedford Avenue** (*Greenpoint / McCarren Park → Sheepshead Bay*)
  - **Video 2: 34th Avenue Open Street** (*Jackson Heights → Corona Plaza*)
  - **Video 3: Ocean Parkway** (*Prospect Park Machate Circle → Brighton Beach & Coney Island*)
  - **Video 4: Grand Concourse** (*The Hub 149th St → Poe Park*)
  - **Video 5: St. Nicholas Avenue** (*110th St → 181st St*)
  - **Challenge: Citi Bike to LGA Airport**
- **Segment-by-Segment Callouts**:
  - Pick any **Start Segment At** and **Animate Up To** stop (or click any stop pill at the bottom; `Shift+Click` sets the start stop).
  - Prior completed segments stay subtly highlighted while the active segment fills out with marching dashes.
- **Snap to Real Bike Lanes (`🛣️ Snap to Real Bike Lanes`)**:
  - Queries the OpenStreetMap/OSRM Cycling router so your animated dashed line hugs the actual curves of the Hudson River Greenway and NYC bike paths.
- **Custom Floating Head Cutouts (Auto-Saved)**:
  - Upload PNG/JPG cutouts for **David** and **Amanda** (stored in `localStorage` so they stay loaded every time you open the tool).
  - Choose between **Circular Badge Heads + Bike Icon** or **Raw Floating Heads (No Circle Crop)** with adjustable **Playful Head Tilt + Pedal Bob**.
- **16:9 YouTube & 9:16 Shorts/Reels**:
  - Switch between `1920×1080` (Long-Form) and `1080×1920` (TikTok / Reels / Shorts) or export on **Green Screen (`#00FF00`)** / **Transparent Alpha (`.webm`)** to overlay directly onto your DJI Osmo Action 5 Pro / Insta360 footage.
