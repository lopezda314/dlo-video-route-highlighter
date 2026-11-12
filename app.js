// VideoRouteHighlighter — Core Slippy Map + Route & Avatar Animation Engine
(function () {
  const canvas = document.getElementById("stageCanvas");
  const ctx = canvas.getContext("2d");

  // Tile URL templates (all support CORS anonymous for canvas recording)
  let cartoApiKey = "";
  try {
    cartoApiKey = localStorage.getItem("vrh_carto_api_key") || "";
  } catch (e) {}

  function cartoQuery() {
    return cartoApiKey.trim() ? `?key=${encodeURIComponent(cartoApiKey.trim())}` : "";
  }

  const TILE_PROVIDERS = {
    carto_dark: (z, x, y) =>
      `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png${cartoQuery()}`,
    carto_voyager: (z, x, y) =>
      `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}@2x.png${cartoQuery()}`,
    carto_light: (z, x, y) =>
      `https://a.basemaps.cartocdn.com/light_all/${z}/${x}/${y}@2x.png${cartoQuery()}`,
    osm: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
  };

  const tileCache = new Map();

  // Application State
  let currentPresetId = "nz_full";
  let routeTitle = window.ROUTE_PRESETS.nz_full.title;
  let routeSubtitle = window.ROUTE_PRESETS.nz_full.subtitle;
  let stops = JSON.parse(JSON.stringify(window.ROUTE_PRESETS.nz_full.stops));
  // Detailed routed sub-paths per segment: segmentPaths[i] = array of {lat, lon} from stops[i] to stops[i+1]
  let segmentPaths = [];

  let startStopIdx = window.ROUTE_PRESETS.nz_full.defaultStart;
  let endStopIdx = window.ROUTE_PRESETS.nz_full.defaultEnd;

  // Map Camera State (Center Lat/Lon and Zoom)
  let mapCenter = { lat: -42.0, lon: 171.5 };
  let mapZoom = 5.6;

  // Animation State
  let isPlaying = true;
  let isLooping = true;
  let progress = 0; // 0..1
  let durationSec = 3.0;
  let holdEndSec = 0.6;
  let holdTimer = 0;
  let lastFrameTime = performance.now();

  // Interaction State
  let isDraggingMap = false;
  let draggingStopIdx = -1;
  let dragStartMouse = { x: 0, y: 0 };
  let dragStartCenter = { lat: 0, lon: 0 };
  let addStopMode = false;

  // Avatars
  let davidImg = null;
  let amandaImg = null;

  // Load saved avatars from localStorage if present, otherwise use bundled cutouts
  function loadAvatarImg(src, setter) {
    const img = new Image();
    img.onload = () => setter(img);
    img.src = src;
  }
  try {
    const savedDavid = localStorage.getItem("vrh_david_img");
    loadAvatarImg(savedDavid || "./assets/david_head.png", (img) => (davidImg = img));
    const savedAmanda = localStorage.getItem("vrh_amanda_img");
    loadAvatarImg(savedAmanda || "./assets/amanda_head.png", (img) => (amandaImg = img));
  } catch (e) {
    loadAvatarImg("./assets/david_head.png", (img) => (davidImg = img));
    loadAvatarImg("./assets/amanda_head.png", (img) => (amandaImg = img));
  }

  // DOM References
  const presetSelect = document.getElementById("presetSelect");
  const startStopSelect = document.getElementById("startStopSelect");
  const endStopSelect = document.getElementById("endStopSelect");
  const durationSlider = document.getElementById("durationSlider");
  const durationVal = document.getElementById("durationVal");
  const holdEndSelect = document.getElementById("holdEndSelect");
  const scrubSlider = document.getElementById("scrubSlider");
  const timeReadout = document.getElementById("timeReadout");
  const routeBadge = document.getElementById("routeBadge");
  const segmentBadge = document.getElementById("segmentBadge");
  const stopsContainer = document.getElementById("stopsContainer");

  const btnPlay = document.getElementById("btnPlay");
  const btnRestart = document.getElementById("btnRestart");
  const btnLoop = document.getElementById("btnLoop");
  const btnSnapBike = document.getElementById("btnSnapBike");
  const btnExportVideo = document.getElementById("btnExportVideo");
  const exportBtnLabel = document.getElementById("exportBtnLabel");
  const recordingBanner = document.getElementById("recordingBanner");
  const btnFitRoute = document.getElementById("btnFitRoute");
  const btnFitSegment = document.getElementById("btnFitSegment");
  const btnAddStopMode = document.getElementById("btnAddStopMode");
  const btnResetPreset = document.getElementById("btnResetPreset");
  const btnSaveJson = document.getElementById("btnSaveJson");
  const fileImportInput = document.getElementById("fileImportInput");

  const markerStyleSelect = document.getElementById("markerStyleSelect");
  const headSizeSlider = document.getElementById("headSizeSlider");
  const headSizeVal = document.getElementById("headSizeVal");
  const bobStyleSelect = document.getElementById("bobStyleSelect");
  const btnClearAvatars = document.getElementById("btnClearAvatars");

  const pathStyleSelect = document.getElementById("pathStyleSelect");
  const routeColorPicker = document.getElementById("routeColorPicker");
  const routeColorPreset = document.getElementById("routeColorPreset");
  const tileStyleSelect = document.getElementById("tileStyleSelect");
  const cartoApiKeyInput = document.getElementById("cartoApiKeyInput");
  if (cartoApiKeyInput) {
    cartoApiKeyInput.value = cartoApiKey;
    cartoApiKeyInput.addEventListener("input", () => {
      cartoApiKey = cartoApiKeyInput.value;
      try {
        localStorage.setItem("vrh_carto_api_key", cartoApiKey);
      } catch (e) {}
      tileCache.clear();
    });
  }
  const lineWidthSlider = document.getElementById("lineWidthSlider");
  const cameraModeSelect = document.getElementById("cameraModeSelect");
  const aspectRatioSelect = document.getElementById("aspectRatioSelect");

  const chkShowLabels = document.getElementById("chkShowLabels");
  const chkShowPrior = document.getElementById("chkShowPrior");
  const chkShowHud = document.getElementById("chkShowHud");

  // --- Web Mercator Projection Helpers ---
  function lonToTileX(lon, z) {
    return ((lon + 180) / 360) * Math.pow(2, z);
  }

  function latToTileY(lat, z) {
    const rad = (lat * Math.PI) / 180;
    return (
      ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
      Math.pow(2, z)
    );
  }

  function tileXToLon(x, z) {
    return (x / Math.pow(2, z)) * 360 - 180;
  }

  function tileYToLat(y, z) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  function latLonToCanvas(lat, lon, centerLat, centerLon, zoom) {
    const tileSize = 256;
    const cx = lonToTileX(centerLon, zoom) * tileSize;
    const cy = latToTileY(centerLat, zoom) * tileSize;
    const px = lonToTileX(lon, zoom) * tileSize;
    const py = latToTileY(lat, zoom) * tileSize;
    return {
      x: canvas.width / 2 + (px - cx),
      y: canvas.height / 2 + (py - cy)
    };
  }

  function canvasToLatLon(x, y, centerLat, centerLon, zoom) {
    const tileSize = 256;
    const cx = lonToTileX(centerLon, zoom) * tileSize;
    const cy = latToTileY(centerLat, zoom) * tileSize;
    const px = cx + (x - canvas.width / 2);
    const py = cy + (y - canvas.height / 2);
    return {
      lon: tileXToLon(px / tileSize, zoom),
      lat: tileYToLat(py / tileSize, zoom)
    };
  }

  // Build default Catmull-Rom smooth paths between stops when not using OSRM
  function rebuildDefaultSegmentPaths() {
    segmentPaths = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const p0 = stops[Math.max(0, i - 1)];
      const p1 = stops[i];
      const p2 = stops[i + 1];
      const p3 = stops[Math.min(stops.length - 1, i + 2)];
      const sub = [];
      const steps = 28;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const t2 = t * t;
        const t3 = t2 * t;
        const lat =
          0.5 *
          (2 * p1.lat +
            (-p0.lat + p2.lat) * t +
            (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 +
            (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3);
        const lon =
          0.5 *
          (2 * p1.lon +
            (-p0.lon + p2.lon) * t +
            (2 * p0.lon - 5 * p1.lon + 4 * p2.lon - p3.lon) * t2 +
            (-p0.lon + 3 * p1.lon - 3 * p2.lon + p3.lon) * t3);
        sub.push({ lat, lon });
      }
      segmentPaths.push(sub);
    }
  }

  // Snap waypoints to real cycling network via OSRM public API
  async function snapToRealBikeLanes() {
    if (stops.length < 2) return;
    const origText = btnSnapBike.textContent;
    btnSnapBike.textContent = "⏳ Snapping to Bike Lanes...";
    btnSnapBike.disabled = true;

    const newSegPaths = [];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i];
      const b = stops[i + 1];
      const coordsQuery = `${a.lon},${a.lat};${b.lon},${b.lat}`;
      let fetched = null;

      const urls = [
        `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson`,
        `https://router.project-osrm.org/route/v1/bike/${coordsQuery}?overview=full&geometries=geojson`
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes[0]?.geometry?.coordinates) {
              fetched = data.routes[0].geometry.coordinates.map(([lon, lat]) => ({
                lat,
                lon
              }));
              break;
            }
          }
        } catch (err) {}
      }

      if (fetched && fetched.length >= 2) {
        newSegPaths.push(fetched);
      } else {
        newSegPaths.push([
          { lat: a.lat, lon: a.lon },
          { lat: b.lat, lon: b.lon }
        ]);
      }
    }

    segmentPaths = newSegPaths;
    btnSnapBike.textContent = "✅ Snapped to Bike Lanes!";
    btnSnapBike.disabled = false;
    setTimeout(() => {
      btnSnapBike.textContent = origText;
    }, 2000);
  }

  // Fit camera to a subset of stops
  function fitCameraToStops(subsetStops, paddingFactor = 0.68) {
    if (!subsetStops || subsetStops.length === 0) return;
    const lats = subsetStops.map((s) => s.lat);
    const lons = subsetStops.map((s) => s.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    mapCenter = {
      lat: (minLat + maxLat) / 2,
      lon: (minLon + maxLon) / 2
    };

    // Find zoom level that fits bounding box comfortably (supports city blocks to whole countries)
    for (let z = 16.5; z >= 2.0; z -= 0.2) {
      const p1 = latLonToCanvas(maxLat, minLon, mapCenter.lat, mapCenter.lon, z);
      const p2 = latLonToCanvas(minLat, maxLon, mapCenter.lat, mapCenter.lon, z);
      const spanX = Math.abs(p2.x - p1.x);
      const spanY = Math.abs(p2.y - p1.y);
      if (
        spanX <= canvas.width * paddingFactor &&
        spanY <= canvas.height * paddingFactor
      ) {
        mapZoom = z;
        return;
      }
    }
    mapZoom = 5.5;
  }

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  function applyAutoDuration() {
    let totalKm = 0;
    for (let i = startStopIdx; i < endStopIdx; i++) {
      if (stops[i] && stops[i + 1]) {
        totalKm += haversineKm(stops[i], stops[i + 1]);
      }
    }
    const scaled = 1.8 + 1.15 * Math.pow(Math.max(0.5, totalKm), 0.34);
    const clamped = Math.max(2.5, Math.min(25.0, Math.round(scaled * 2) / 2));
    durationSec = clamped;
    durationSlider.value = clamped.toFixed(1);
    durationVal.textContent = `${clamped.toFixed(1)}s`;
  }

  function updateUIControls() {
    startStopSelect.innerHTML = "";
    endStopSelect.innerHTML = "";
    stops.forEach((s, idx) => {
      const o1 = document.createElement("option");
      o1.value = idx;
      o1.textContent = `${idx + 1}. ${s.icon || "📍"} ${s.name}`;
      startStopSelect.appendChild(o1);

      const o2 = document.createElement("option");
      o2.value = idx;
      o2.textContent = `${idx + 1}. ${s.icon || "📍"} ${s.name}`;
      endStopSelect.appendChild(o2);
    });

    startStopIdx = Math.min(startStopIdx, Math.max(0, stops.length - 2));
    endStopIdx = Math.max(startStopIdx + 1, Math.min(endStopIdx, stops.length - 1));
    startStopSelect.value = startStopIdx;
    endStopSelect.value = endStopIdx;

    routeBadge.textContent = routeTitle;
    const sName = stops[startStopIdx]?.name || "Start";
    const eName = stops[endStopIdx]?.name || "End";
    segmentBadge.textContent = `${sName} → ${eName}`;

    renderStopPills();
  }

  function renderStopPills() {
    stopsContainer.innerHTML = "";
    stops.forEach((s, i) => {
      const inActiveRange = i >= startStopIdx && i <= endStopIdx;
      const isEndpoint = i === startStopIdx || i === endStopIdx;

      const pill = document.createElement("div");
      pill.className = `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer select-none transition ${
        isEndpoint
          ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow"
          : inActiveRange
          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
          : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
      }`;

      const labelSpan = document.createElement("span");
      labelSpan.textContent = `${i + 1}. ${s.icon || "📍"} ${s.name} (${s.mile || ""})`;
      labelSpan.onclick = (e) => {
        if (e.shiftKey) {
          if (i < endStopIdx) startStopIdx = i;
        } else {
          if (i > startStopIdx) endStopIdx = i;
          else if (i < startStopIdx) startStopIdx = i;
        }
        progress = 0;
        isPlaying = true;
        updatePlayBtnText();
        updateUIControls();
      };
      labelSpan.ondblclick = () => {
        const newName = prompt("Rename stop:", s.name);
        if (newName && newName.trim()) {
          s.name = newName.trim();
          const newIcon = prompt("Stop Emoji Icon:", s.icon || "📍");
          if (newIcon) s.icon = newIcon.trim();
          updateUIControls();
        }
      };
      pill.appendChild(labelSpan);

      if (stops.length > 2) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "×";
        delBtn.className = "ml-1 hover:text-rose-400 font-bold";
        delBtn.title = "Delete stop";
        delBtn.onclick = (e) => {
          e.stopPropagation();
          stops.splice(i, 1);
          rebuildDefaultSegmentPaths();
          updateUIControls();
        };
        pill.appendChild(delBtn);
      }

      stopsContainer.appendChild(pill);
    });
  }

  function loadPreset(presetId) {
    const p = window.ROUTE_PRESETS[presetId];
    if (!p) return;
    currentPresetId = presetId;
    routeTitle = p.title;
    routeSubtitle = p.subtitle;
    stops = JSON.parse(JSON.stringify(p.stops));
    startStopIdx = p.defaultStart;
    endStopIdx = p.defaultEnd;
    routeColorPicker.value = p.defaultColor || "#22c55e";
    progress = 0;
    rebuildDefaultSegmentPaths();
    applyAutoDuration();
    updateUIControls();
    fitCameraToStops(stops.slice(startStopIdx, endStopIdx + 1), 0.68);
  }

  // --- Map Tile Rendering ---
  function getTileImage(providerKey, z, x, y) {
    const maxTile = Math.pow(2, z);
    const wrappedX = ((x % maxTile) + maxTile) % maxTile;
    if (y < 0 || y >= maxTile) return null;

    const key = `${providerKey}_${z}_${wrappedX}_${y}`;
    if (tileCache.has(key)) {
      return tileCache.get(key);
    }

    const urlFn = TILE_PROVIDERS[providerKey];
    if (!urlFn) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    const entry = { img, loaded: false };
    img.onload = () => {
      entry.loaded = true;
    };
    img.src = urlFn(z, wrappedX, y);
    tileCache.set(key, entry);
    return entry;
  }

  function drawMapTiles(centerLat, centerLon, zoom, styleKey) {
    const w = canvas.width;
    const h = canvas.height;

    if (styleKey === "chroma") {
      ctx.fillStyle = "#00FF00";
      ctx.fillRect(0, 0, w, h);
      return;
    }

    if (styleKey === "transparent") {
      ctx.clearRect(0, 0, w, h);
      return;
    }

    // Background fallback color while tiles load
    ctx.fillStyle = styleKey === "carto_dark" ? "#0b1120" : "#e2e8f0";
    ctx.fillRect(0, 0, w, h);

    const intZ = Math.max(2, Math.min(18, Math.floor(zoom)));
    const scale = Math.pow(2, zoom - intZ);
    const scaledTileSize = 256 * scale;

    const centerTileX = lonToTileX(centerLon, intZ);
    const centerTileY = latToTileY(centerLat, intZ);

    const halfCols = Math.ceil(w / 2 / scaledTileSize) + 1;
    const halfRows = Math.ceil(h / 2 / scaledTileSize) + 1;

    const minX = Math.floor(centerTileX) - halfCols;
    const maxX = Math.floor(centerTileX) + halfCols;
    const minY = Math.floor(centerTileY) - halfRows;
    const maxY = Math.floor(centerTileY) + halfRows;

    for (let tx = minX; tx <= maxX; tx++) {
      for (let ty = minY; ty <= maxY; ty++) {
        const entry = getTileImage(styleKey, intZ, tx, ty);
        const screenX = w / 2 + (tx - centerTileX) * scaledTileSize;
        const screenY = h / 2 + (ty - centerTileY) * scaledTileSize;
        if (entry && entry.loaded) {
          ctx.drawImage(
            entry.img,
            Math.floor(screenX),
            Math.floor(screenY),
            Math.ceil(scaledTileSize),
            Math.ceil(scaledTileSize)
          );
        }
      }
    }
  }

  // --- Avatar & Bike Marker Rendering ---
  function drawHeadAvatar(x, y, size, label, borderColor, img, bobY, tiltRad, circularCrop) {
    ctx.save();
    ctx.translate(x, y + bobY);
    ctx.rotate(tiltRad);

    const r = size / 2;
    ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 5;

    if (circularCrop || !img) {
      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = borderColor;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (img) {
        const aspect = img.width / img.height;
        let dw = size;
        let dh = size;
        if (aspect > 1) dw = dh * aspect;
        else dh = dw / aspect;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      } else {
        // Default illustrated avatar head
        ctx.fillStyle = borderColor;
        ctx.fillRect(-r, -r, size, size);

        // Skin face
        ctx.fillStyle = "#fde68a";
        ctx.beginPath();
        ctx.arc(0, r * 0.1, r * 0.58, 0, Math.PI * 2);
        ctx.fill();

        // Bike helmet
        ctx.fillStyle = label === "David" ? "#0f172a" : "#be123c";
        ctx.beginPath();
        ctx.arc(0, -r * 0.08, r * 0.62, Math.PI, 0);
        ctx.fill();

        // Sunglasses
        ctx.fillStyle = "#090d16";
        ctx.fillRect(-r * 0.38, -r * 0.04, r * 0.3, r * 0.17);
        ctx.fillRect(r * 0.08, -r * 0.04, r * 0.3, r * 0.17);
        ctx.fillRect(-r * 0.1, 0, r * 0.2, r * 0.05);

        // Smile
        ctx.strokeStyle = "#090d16";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, r * 0.2, r * 0.22, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
    } else {
      // Raw transparent cutout mode (no circle crop)
      const aspect = img.width / img.height;
      const dh = size * 1.35;
      const dw = dh * aspect;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    }

    ctx.restore();
  }

  function drawBikeBadge(x, y, size, color, bobY, tiltRad) {
    ctx.save();
    ctx.translate(x, y + bobY);
    ctx.rotate(tiltRad);

    const r = size * 0.42;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#090d16";
    ctx.font = `${Math.round(r * 1.15)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚲", 0, 1);
    ctx.restore();
  }

  // Flatten active segment coordinates for smooth arc-length interpolation
  function getActiveSegmentLatLons() {
    const pts = [];
    for (let s = startStopIdx; s < endStopIdx; s++) {
      const seg = segmentPaths[s] || [stops[s], stops[s + 1]];
      seg.forEach((p, idx) => {
        if (s > startStopIdx && idx === 0) return;
        pts.push(p);
      });
    }
    if (pts.length < 2) {
      return [stops[startStopIdx], stops[endStopIdx]];
    }
    return pts;
  }

  function getPriorSegmentLatLons() {
    const pts = [];
    for (let s = 0; s < startStopIdx; s++) {
      const seg = segmentPaths[s] || [stops[s], stops[s + 1]];
      seg.forEach((p, idx) => {
        if (s > 0 && idx === 0) return;
        pts.push(p);
      });
    }
    return pts;
  }

  function getFullRouteLatLons() {
    const pts = [];
    for (let s = 0; s < stops.length - 1; s++) {
      const seg = segmentPaths[s] || [stops[s], stops[s + 1]];
      seg.forEach((p, idx) => {
        if (s > 0 && idx === 0) return;
        pts.push(p);
      });
    }
    return pts;
  }

  // Interpolate along a polyline by normalized distance t in [0, 1]
  function sampleAlongPolyline(latLons, t) {
    if (latLons.length === 0) return { current: { lat: 0, lon: 0 }, partial: [] };
    if (latLons.length === 1 || t <= 0) {
      return { current: latLons[0], partial: [latLons[0]] };
    }

    const dists = [0];
    let totalDist = 0;
    for (let i = 1; i < latLons.length; i++) {
      const dLat = latLons[i].lat - latLons[i - 1].lat;
      const dLon = latLons[i].lon - latLons[i - 1].lon;
      const d = Math.hypot(dLat, dLon);
      totalDist += d;
      dists.push(totalDist);
    }

    if (totalDist === 0 || t >= 1) {
      return { current: latLons[latLons.length - 1], partial: latLons.slice() };
    }

    const targetDist = t * totalDist;
    const partial = [latLons[0]];
    let current = latLons[0];

    for (let i = 1; i < latLons.length; i++) {
      if (dists[i] <= targetDist) {
        partial.push(latLons[i]);
        current = latLons[i];
      } else {
        const segLen = dists[i] - dists[i - 1];
        const frac = segLen > 0 ? (targetDist - dists[i - 1]) / segLen : 0;
        current = {
          lat: latLons[i - 1].lat + (latLons[i].lat - latLons[i - 1].lat) * frac,
          lon: latLons[i - 1].lon + (latLons[i].lon - latLons[i - 1].lon) * frac
        };
        partial.push(current);
        break;
      }
    }

    return { current, partial };
  }

  // --- Main Render Loop ---
  function renderFrame(now) {
    const dt = Math.min(0.1, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    if (isPlaying) {
      if (progress < 1) {
        progress += dt / durationSec;
        if (progress >= 1) {
          progress = 1;
          holdTimer = 0;
        }
      } else {
        holdTimer += dt;
        if (holdTimer >= holdEndSec) {
          if (isLooping) {
            progress = 0;
            holdTimer = 0;
          } else {
            isPlaying = false;
            updatePlayBtnText();
          }
        }
      }
      scrubSlider.value = Math.round(progress * 1000);
    }

    // Smooth ease-in-out
    const eased =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    timeReadout.textContent = `${(progress * durationSec).toFixed(1)}s / ${durationSec.toFixed(1)}s (${Math.round(progress * 100)}%)`;

    const activeLatLons = getActiveSegmentLatLons();
    const { current: riderLatLon, partial: activePartial } = sampleAlongPolyline(
      activeLatLons,
      eased
    );

    // Determine effective camera center & zoom for this frame
    let renderCenter = { lat: mapCenter.lat, lon: mapCenter.lon };
    let renderZoom = mapZoom;
    const camMode = cameraModeSelect.value;

    if (camMode === "follow_smooth") {
      renderCenter = {
        lat: mapCenter.lat * 0.25 + riderLatLon.lat * 0.75,
        lon: mapCenter.lon * 0.25 + riderLatLon.lon * 0.75
      };
    } else if (camMode === "cinematic_push") {
      renderZoom = mapZoom + eased * 0.45;
    }

    const tileStyle = tileStyleSelect.value;
    const routeColor = routeColorPicker.value;
    const lineWidth = parseInt(lineWidthSlider.value, 10);
    const pathStyle = pathStyleSelect.value;

    // 1. Draw Map Tiles
    drawMapTiles(renderCenter.lat, renderCenter.lon, renderZoom, tileStyle);

    // 2. Draw Unvisited Full Route Ghost Track
    const fullPts = getFullRouteLatLons().map((p) =>
      latLonToCanvas(p.lat, p.lon, renderCenter.lat, renderCenter.lon, renderZoom)
    );
    if (fullPts.length > 1) {
      ctx.save();
      ctx.beginPath();
      fullPts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.strokeStyle =
        tileStyle === "carto_light" || tileStyle === "osm"
          ? "rgba(15, 23, 42, 0.22)"
          : "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = Math.max(4, lineWidth * 0.65);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.setLineDash([12, 12]);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Completed Prior Segments (0 -> startStopIdx)
    if (chkShowPrior.checked && startStopIdx > 0) {
      const priorPts = getPriorSegmentLatLons().map((p) =>
        latLonToCanvas(p.lat, p.lon, renderCenter.lat, renderCenter.lon, renderZoom)
      );
      if (priorPts.length > 1) {
        ctx.save();
        ctx.beginPath();
        priorPts.forEach((p, idx) =>
          idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
        );
        ctx.strokeStyle = routeColor;
        ctx.globalAlpha = 0.48;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Draw Active Progress Segment (startStopIdx -> current animated point)
    const activeCanvasPts = activePartial.map((p) =>
      latLonToCanvas(p.lat, p.lon, renderCenter.lat, renderCenter.lon, renderZoom)
    );
    if (activeCanvasPts.length > 1) {
      ctx.save();
      ctx.beginPath();
      activeCanvasPts.forEach((p, idx) =>
        idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = routeColor;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = routeColor;
      ctx.lineWidth = lineWidth;

      if (pathStyle === "marching_dashes") {
        ctx.setLineDash([lineWidth * 2.1, lineWidth * 1.35]);
        ctx.lineDashOffset = -(now * 0.06);
        ctx.stroke();
      } else if (pathStyle === "glow_dashes") {
        ctx.globalAlpha = 0.55;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = Math.max(3, lineWidth * 0.45);
        ctx.setLineDash([lineWidth * 1.5, lineWidth * 1.6]);
        ctx.lineDashOffset = -(now * 0.065);
        ctx.stroke();
      } else if (pathStyle === "dots") {
        ctx.setLineDash([2, lineWidth * 1.8]);
        ctx.lineDashOffset = -(now * 0.05);
        ctx.stroke();
      } else {
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. Draw Stop Nodes & Callout Pills
    stops.forEach((s, idx) => {
      const pt = latLonToCanvas(
        s.lat,
        s.lon,
        renderCenter.lat,
        renderCenter.lon,
        renderZoom
      );
      const isStartOrEnd = idx === startStopIdx || idx === endStopIdx;
      const isVisited =
        idx < startStopIdx ||
        (idx === startStopIdx && progress >= 0) ||
        (idx === endStopIdx && progress >= 0.98);

      ctx.save();
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isStartOrEnd ? 10 : 6.5, 0, Math.PI * 2);
      ctx.fillStyle = isVisited ? routeColor : "#1e293b";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      if (chkShowLabels.checked) {
        const label = `${s.icon ? s.icon + " " : ""}${s.name}`;
        ctx.font = isStartOrEnd
          ? "bold 17px -apple-system, BlinkMacSystemFont, sans-serif"
          : "600 14px -apple-system, BlinkMacSystemFont, sans-serif";
        const tw = ctx.measureText(label).width;
        const padX = 12;
        const boxH = isStartOrEnd ? 32 : 26;
        const bx = pt.x + 16;
        const by = pt.y - boxH / 2;

        ctx.shadowColor = "rgba(0,0,0,0.45)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = isStartOrEnd
          ? "rgba(15, 23, 42, 0.94)"
          : "rgba(15, 23, 42, 0.80)";
        ctx.beginPath();
        ctx.roundRect(bx, by, tw + padX * 2, boxH, 8);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.lineWidth = isStartOrEnd ? 2 : 1;
        ctx.strokeStyle = isStartOrEnd ? routeColor : "rgba(148, 163, 184, 0.35)";
        ctx.stroke();

        ctx.fillStyle = "#f8fafc";
        ctx.textBaseline = "middle";
        ctx.fillText(label, bx + padX, by + boxH / 2 + 1);
      }
      ctx.restore();
    });

    // 6. Draw Moving Rider Marker (David & Amanda Heads / Bike Icon)
    const riderPt = latLonToCanvas(
      riderLatLon.lat,
      riderLatLon.lon,
      renderCenter.lat,
      renderCenter.lon,
      renderZoom
    );
    const headSize = parseInt(headSizeSlider.value, 10);
    const markerStyle = markerStyleSelect.value;
    const bobStyle = bobStyleSelect.value;

    const phase = now * 0.013;
    const bobAmp = bobStyle === "none" ? 0 : bobStyle === "wobble" ? 6.5 : 3.5;
    const tiltAmp = bobStyle === "wobble" ? 0.14 : bobStyle === "gentle" ? 0.05 : 0;

    const bob1 = Math.sin(phase) * bobAmp;
    const bob2 = Math.cos(phase * 1.08) * bobAmp;
    const tilt1 = Math.sin(phase * 0.85) * tiltAmp;
    const tilt2 = -Math.sin(phase * 0.85) * tiltAmp;

    if (markerStyle === "duo" || markerStyle === "duo_clean") {
      const circular = markerStyle === "duo";
      const offsetX = headSize * 0.56;
      const offsetY = -headSize * 0.65;
      drawHeadAvatar(
        riderPt.x - offsetX,
        riderPt.y + offsetY,
        headSize,
        "David",
        "#38bdf8",
        davidImg,
        bob1,
        tilt1,
        circular
      );
      drawHeadAvatar(
        riderPt.x + offsetX,
        riderPt.y + offsetY,
        headSize,
        "Amanda",
        "#f472b6",
        amandaImg,
        bob2,
        tilt2,
        circular
      );
      drawBikeBadge(riderPt.x, riderPt.y, headSize * 0.82, routeColor, 0, 0);
    } else if (markerStyle === "single") {
      drawHeadAvatar(
        riderPt.x,
        riderPt.y - headSize * 0.55,
        headSize * 1.15,
        "David",
        routeColor,
        davidImg || amandaImg,
        bob1,
        tilt1,
        true
      );
    } else if (markerStyle === "bike") {
      drawBikeBadge(riderPt.x, riderPt.y, headSize * 1.15, routeColor, bob1, tilt1);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.arc(riderPt.x, riderPt.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = routeColor;
      ctx.shadowColor = routeColor;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.restore();
    }

    // 7. Lower-Third HUD Title Card
    if (chkShowHud.checked) {
      ctx.save();
      const cardX = 36;
      const cardY = canvas.height - 114;
      const cardW = Math.min(580, canvas.width - 72);
      const cardH = 78;

      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "rgba(9, 13, 22, 0.90)";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardW, cardH, 14);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = routeColor;
      ctx.stroke();

      ctx.fillStyle = routeColor;
      ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(routeTitle.toUpperCase(), cardX + 20, cardY + 28);

      const sStop = stops[startStopIdx]?.name || "Start";
      const eStop = stops[endStopIdx]?.name || "Finish";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(`${sStop}  →  ${eStop}`, cardX + 20, cardY + 56);
      ctx.restore();
    }

    requestAnimationFrame(renderFrame);
  }

  // --- Event Listeners ---
  presetSelect.onchange = () => loadPreset(presetSelect.value);

  startStopSelect.onchange = () => {
    startStopIdx = parseInt(startStopSelect.value, 10);
    if (endStopIdx <= startStopIdx) {
      endStopIdx = Math.min(stops.length - 1, startStopIdx + 1);
    }
    progress = 0;
    applyAutoDuration();
    updateUIControls();
  };

  endStopSelect.onchange = () => {
    endStopIdx = parseInt(endStopSelect.value, 10);
    if (startStopIdx >= endStopIdx) {
      startStopIdx = Math.max(0, endStopIdx - 1);
    }
    progress = 0;
    applyAutoDuration();
    updateUIControls();
  };

  durationSlider.oninput = () => {
    durationSec = parseFloat(durationSlider.value);
    durationVal.textContent = `${durationSec.toFixed(1)}s`;
  };

  holdEndSelect.onchange = () => {
    holdEndSec = parseFloat(holdEndSelect.value);
  };

  scrubSlider.oninput = () => {
    isPlaying = false;
    updatePlayBtnText();
    progress = parseFloat(scrubSlider.value) / 1000;
  };

  headSizeSlider.oninput = () => {
    headSizeVal.textContent = `${headSizeSlider.value}px`;
  };

  routeColorPreset.onchange = () => {
    routeColorPicker.value = routeColorPreset.value;
  };

  aspectRatioSelect.onchange = () => {
    if (aspectRatioSelect.value === "9:16") {
      canvas.width = 1080;
      canvas.height = 1920;
    } else {
      canvas.width = 1920;
      canvas.height = 1080;
    }
    fitCameraToStops(stops.slice(startStopIdx, endStopIdx + 1), 0.62);
  };

  function updatePlayBtnText() {
    btnPlay.textContent = isPlaying ? "⏸ Pause" : "▶ Play Segment";
  }

  btnPlay.onclick = () => {
    if (!isPlaying && progress >= 0.999) progress = 0;
    isPlaying = !isPlaying;
    updatePlayBtnText();
  };

  btnRestart.onclick = () => {
    progress = 0;
    holdTimer = 0;
    isPlaying = true;
    updatePlayBtnText();
  };

  btnLoop.onclick = () => {
    isLooping = !isLooping;
    btnLoop.textContent = isLooping ? "🔁 Loop: ON" : "🔁 Loop: OFF";
  };

  btnSnapBike.onclick = () => snapToRealBikeLanes();

  btnFitRoute.onclick = () => fitCameraToStops(stops, 0.68);
  btnFitSegment.onclick = () =>
    fitCameraToStops(stops.slice(startStopIdx, endStopIdx + 1), 0.58);

  btnAddStopMode.onclick = () => {
    addStopMode = !addStopMode;
    btnAddStopMode.textContent = addStopMode
      ? "✅ Done Adding Stops"
      : "➕ Click Map to Add Stop";
    btnAddStopMode.classList.toggle("bg-emerald-500", addStopMode);
    btnAddStopMode.classList.toggle("text-slate-950", addStopMode);
  };

  btnResetPreset.onclick = () => loadPreset(currentPresetId);

  // Canvas Pan, Zoom & Stop Dragging
  function getCanvasMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  canvas.addEventListener("mousedown", (e) => {
    const pos = getCanvasMousePos(e);

    if (addStopMode) {
      const coord = canvasToLatLon(pos.x, pos.y, mapCenter.lat, mapCenter.lon, mapZoom);
      stops.push({
        name: `Stop ${stops.length + 1}`,
        mile: "",
        icon: "📍",
        lat: coord.lat,
        lon: coord.lon
      });
      endStopIdx = stops.length - 1;
      rebuildDefaultSegmentPaths();
      updateUIControls();
      return;
    }

    // Check if user clicked on an existing stop node to drag it
    for (let i = 0; i < stops.length; i++) {
      const sp = latLonToCanvas(
        stops[i].lat,
        stops[i].lon,
        mapCenter.lat,
        mapCenter.lon,
        mapZoom
      );
      if (Math.hypot(pos.x - sp.x, pos.y - sp.y) < 20) {
        draggingStopIdx = i;
        return;
      }
    }

    isDraggingMap = true;
    dragStartMouse = pos;
    dragStartCenter = { lat: mapCenter.lat, lon: mapCenter.lon };
  });

  window.addEventListener("mousemove", (e) => {
    if (draggingStopIdx >= 0) {
      const pos = getCanvasMousePos(e);
      const coord = canvasToLatLon(pos.x, pos.y, mapCenter.lat, mapCenter.lon, mapZoom);
      stops[draggingStopIdx].lat = coord.lat;
      stops[draggingStopIdx].lon = coord.lon;
      rebuildDefaultSegmentPaths();
      return;
    }

    if (!isDraggingMap) return;
    const pos = getCanvasMousePos(e);
    const dx = pos.x - dragStartMouse.x;
    const dy = pos.y - dragStartMouse.y;
    const newCenter = canvasToLatLon(
      canvas.width / 2 - dx,
      canvas.height / 2 - dy,
      dragStartCenter.lat,
      dragStartCenter.lon,
      mapZoom
    );
    mapCenter = newCenter;
  });

  window.addEventListener("mouseup", () => {
    isDraggingMap = false;
    draggingStopIdx = -1;
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      mapZoom = Math.max(2.0, Math.min(18.0, mapZoom + delta));
    },
    { passive: false }
  );

  // Avatar Uploads
  function bindAvatarInput(inputEl, storageKey, setter) {
    inputEl.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const img = new Image();
        img.onload = () => setter(img);
        img.src = dataUrl;
        try {
          localStorage.setItem(storageKey, dataUrl);
        } catch (err) {}
      };
      reader.readAsDataURL(file);
    });
  }

  bindAvatarInput(document.getElementById("davidFile"), "vrh_david_img", (img) => {
    davidImg = img;
  });
  bindAvatarInput(document.getElementById("amandaFile"), "vrh_amanda_img", (img) => {
    amandaImg = img;
  });

  btnClearAvatars.onclick = () => {
    try {
      localStorage.removeItem("vrh_david_img");
      localStorage.removeItem("vrh_amanda_img");
    } catch (e) {}
    loadAvatarImg("./assets/david_head.png", (img) => (davidImg = img));
    loadAvatarImg("./assets/amanda_head.png", (img) => (amandaImg = img));
  };

  // Save & Import (.json / .gpx)
  btnSaveJson.onclick = () => {
    const payload = {
      title: routeTitle,
      subtitle: routeSubtitle,
      stops,
      startStopIdx,
      endStopIdx,
      routeColor: routeColorPicker.value
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${routeTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    a.click();
  };

  fileImportInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      if (file.name.endsWith(".json")) {
        try {
          const data = JSON.parse(content);
          if (Array.isArray(data.stops) && data.stops.length >= 2) {
            routeTitle = data.title || "Custom Route";
            routeSubtitle = data.subtitle || "";
            stops = data.stops;
            startStopIdx = data.startStopIdx || 0;
            endStopIdx = data.endStopIdx || stops.length - 1;
            if (data.routeColor) routeColorPicker.value = data.routeColor;
            rebuildDefaultSegmentPaths();
            updateUIControls();
            fitCameraToStops(stops, 0.65);
          }
        } catch (err) {
          alert("Could not parse JSON route file.");
        }
      } else {
        // Parse GPX
        const xml = new DOMParser().parseFromString(content, "text/xml");
        const trkpts = Array.from(xml.querySelectorAll("trkpt, rtept"));
        if (trkpts.length < 2) {
          alert("No GPX track points found.");
          return;
        }
        const rawCoords = trkpts.map((pt) => ({
          lat: parseFloat(pt.getAttribute("lat")),
          lon: parseFloat(pt.getAttribute("lon"))
        }));
        const count = Math.min(8, rawCoords.length);
        const newStops = [];
        for (let i = 0; i < count; i++) {
          const idx = Math.floor((i / (count - 1)) * (rawCoords.length - 1));
          newStops.push({
            name:
              i === 0 ? "Start" : i === count - 1 ? "Finish" : `Checkpoint ${i}`,
            mile: "",
            icon: i === 0 ? "🟢" : i === count - 1 ? "🏁" : "📍",
            lat: rawCoords[idx].lat,
            lon: rawCoords[idx].lon
          });
        }
        routeTitle = file.name.replace(/\.gpx$/i, "");
        stops = newStops;
        startStopIdx = 0;
        endStopIdx = stops.length - 1;
        rebuildDefaultSegmentPaths();
        updateUIControls();
        fitCameraToStops(stops, 0.65);
      }
    };
    reader.readAsText(file);
  });

  // --- 60fps Video Recording Export ---
  btnExportVideo.onclick = () => {
    if (typeof canvas.captureStream !== "function") {
      alert("Canvas video capture requires Chrome, Edge, or Firefox.");
      return;
    }

    const stream = canvas.captureStream(60);
    const chunks = [];
    const mimeCandidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4"
    ];
    const supportedMime =
      mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";

    let recorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: supportedMime,
        videoBitsPerSecond: 25_000_000
      });
    } catch (err) {
      alert(
        "Unable to record canvas stream. If you opened index.html via file://, run ./start.command for CORS-clean tile recording."
      );
      return;
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      recordingBanner.classList.add("hidden");
      btnExportVideo.disabled = false;
      exportBtnLabel.textContent = "Record Segment Video (60fps)";

      const ext = supportedMime.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: supportedMime || "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const sName = (stops[startStopIdx]?.name || "start")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      const eName = (stops[endStopIdx]?.name || "end")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");
      a.download = `coop-route-${sName}-to-${eName}.${ext}`;
      a.click();
    };

    const prevLoop = isLooping;
    isLooping = false;
    progress = 0;
    holdTimer = 0;
    isPlaying = true;
    updatePlayBtnText();

    btnExportVideo.disabled = true;
    exportBtnLabel.textContent = "Recording...";
    recordingBanner.classList.remove("hidden");

    recorder.start();
    const totalMs = (durationSec + holdEndSec) * 1000 + 250;
    setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
      isLooping = prevLoop;
    }, totalMs);
  };

  // Initialize with New Zealand Grand Adventure
  loadPreset("nz_full");
  requestAnimationFrame(renderFrame);
})();
