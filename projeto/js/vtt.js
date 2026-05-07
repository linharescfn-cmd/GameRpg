// vtt.js — editor/VTT com suporte a grid, mapa e câmera
(function(){
  // =====================
  // DOM REFERENCES
  // =====================
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("toggleBtn");
  const scaleInput = document.getElementById("cellMeters");
  const scaleBtn = document.getElementById("applyScale");
  const scaleInfo = document.getElementById("scaleInfo");
  const imgUpload = document.getElementById("imgUpload");
  const imgW = document.getElementById("imgW");
  const imgH = document.getElementById("imgH");
  const applyMapBtn = document.getElementById("applyMap");
  const mapNameLabel = document.getElementById("mapNameLabel");
  const mapWValue = document.getElementById("mapWValue");
  const mapHValue = document.getElementById("mapHValue");
  const mapWPlus = document.getElementById("mapWPlus");
  const mapWMinus = document.getElementById("mapWMinus");
  const mapHPlus = document.getElementById("mapHPlus");
  const mapHMinus = document.getElementById("mapHMinus");
  const gridZoomIn = document.getElementById("gridZoomIn");
  const gridZoomOut = document.getElementById("gridZoomOut");
  const addTokenBtn = document.getElementById("addTokenBtn");
  const tokenImageUpload = document.getElementById("tokenImageUpload");
  const tokenList = document.getElementById("tokenList");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const editorEl = document.getElementById("editor");

  // Rulers
  const topRuler = document.getElementById("topRuler");
  const topRulerCtx = topRuler.getContext("2d");
  const leftRuler = document.getElementById("leftRuler");
  const leftRulerCtx = leftRuler.getContext("2d");

  // =====================
  // STATE MANAGEMENT
  // =====================
  const state = {
    ui: { sidebarOpen: true },
    grid: {
      cellMultiplier: 1,
      metersPerCell: null
    },
    image: {
      src: null,
      widthCells: 10,
      heightCells: 10,
      anchor: { col: 3, row: 3 },
      name: null,
      active: false
    },
    tokens: []
  };

  // =====================
  // CAMERA SYSTEM
  // =====================
  let camera = { x: 0, y: 0 };
  let isDragging = false;
  let activePointerId = null;
  let lastMouse = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let zoom = 1;
  const BASE = 80;
  let imgObj = null;
  let pendingImg = null;
  let pendingName = null;
  let pendingTokenImg = null;
  let pendingTokenName = null;
  let draggingToken = null;
  let draggingTokenPointerId = null;
  let draggingTokenStart = null;
  const TOKEN_DEFAULT_SIZE = 50;
  let tokenCreationCount = 0;
  const TOKEN_PRIMARY_COLORS = ["#ef4444", "#3b82f6", "#fbbf24"];
  const TOKEN_SECONDARY_TERTIARY_COLORS = ["#10b981", "#f97316", "#a855f7", "#ec4899", "#06b6d4", "#84cc16"];

  // =====================
  // LOAD SAVED GAME DATA
  // =====================
  function loadSavedGameData() {
    const savedData = sessionStorage.getItem('loadedGameData');
    if (savedData) {
      try {
        const gameData = JSON.parse(savedData);
        
        // Aplicar state salvo
        if (gameData.state) {
          Object.assign(state, gameData.state);
        }

        // Aplicar camera salva
        if (gameData.camera) {
          camera.x = gameData.camera.x || 0;
          camera.y = gameData.camera.y || 0;
        }

        // Aplicar imagem salva
        if (gameData.image && gameData.image.src) {
          pendingImg = new Image();
          pendingImg.src = gameData.image.src;
          pendingImg.onload = () => {
            imgObj = pendingImg;
            state.image = { ...gameData.image };
            state.image.active = true;
            document.getElementById("mapSetup").style.display = "none";
            document.getElementById("mapEditControls").style.display = "block";
            updateMapUI();
            draw();
          };
        }

        // Limpar sessionStorage
        sessionStorage.removeItem('loadedGameData');
      } catch (err) {
        console.error('Erro ao carregar dados do jogo:', err);
      }
    }
  }

  // =====================
  // SIDEBAR TOGGLE
  // =====================
  toggleBtn.onclick = () => {
    state.ui.sidebarOpen = !state.ui.sidebarOpen;
    sidebar.style.transform = state.ui.sidebarOpen
      ? "translateX(0)"
      : "translateX(-100%)";
  };

  // =====================
  // SCALE CONTROLS
  // =====================
  scaleBtn.onclick = () => {
    const value = parseFloat(scaleInput.value);
    if (!value || value <= 0) return;
    state.grid.metersPerCell = value;
    scaleInfo.innerHTML = `Proporção: <b>${value} m por célula</b>`;
  };

  // =====================
  // MAP UPLOAD
  // =====================
  imgUpload.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    pendingName = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader();
    reader.onload = (ev) => {
      pendingImg = new Image();
      pendingImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // =====================
  // APPLY MAP
  // =====================
  applyMapBtn.onclick = () => {
    if (!pendingImg) return alert("Selecione uma imagem");
    state.image.src = pendingImg.src;
    state.image.widthCells = parseInt(imgW.value) || 10;
    state.image.heightCells = parseInt(imgH.value) || 10;
    state.image.name = pendingName;
    state.image.active = true;
    imgObj = pendingImg;
    document.getElementById("mapSetup").style.display = "none";
    document.getElementById("mapEditControls").style.display = "block";
    updateMapUI();
    draw();
  };

  // =====================
  // MAP UI UPDATE
  // =====================
  function updateMapUI() {
    mapNameLabel.innerText = "Mapa ativo: " + state.image.name;
    mapWValue.innerText = state.image.widthCells;
    mapHValue.innerText = state.image.heightCells;
  }

  // =====================
  // MAP DIMENSIONS CONTROLS
  // =====================
  mapWPlus.onclick = () => {
    state.image.widthCells++;
    updateMapUI();
    draw();
  };

  mapWMinus.onclick = () => {
    if (state.image.widthCells <= 1) return;
    state.image.widthCells--;
    updateMapUI();
    draw();
  };

  mapHPlus.onclick = () => {
    state.image.heightCells++;
    updateMapUI();
    draw();
  };

  mapHMinus.onclick = () => {
    if (state.image.heightCells <= 1) return;
    state.image.heightCells--;
    updateMapUI();
    draw();
  };

  // =====================
  // GRID ZOOM CONTROLS
  // =====================
  if (gridZoomIn) {
    gridZoomIn.onclick = () => {
      state.grid.cellMultiplier *= 1.2;
      draw();
    };
  }

  if (gridZoomOut) {
    gridZoomOut.onclick = () => {
      state.grid.cellMultiplier *= 0.8;
      draw();
    };
  }

  // =====================
  // TOKEN CONTROLS
  // =====================
  function generateTokenId() {
    return "token_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  function getNextTokenBorderColor() {
    const usePrimary = tokenCreationCount < 3;
    const pool = usePrimary ? TOKEN_PRIMARY_COLORS : TOKEN_SECONDARY_TERTIARY_COLORS;
    const color = pool[Math.floor(Math.random() * pool.length)];
    tokenCreationCount++;
    return color;
  }

  function getTokenAtPoint(screenPoint) {
    for (let i = state.tokens.length - 1; i >= 0; i--) {
      const token = state.tokens[i];
      const center = worldToScreen({ x: token.x, y: token.y });
      const radius = (token.size * zoom) / 2;
      const d = Math.hypot(screenPoint.x - center.x, screenPoint.y - center.y);
      if (d <= radius) return token;
    }
    return null;
  }

  function updateTokenList() {
    if (!tokenList) return;
    tokenList.innerHTML = "";
    state.tokens.forEach((token) => {
      const tokenItem = document.createElement("div");
      tokenItem.className = "token-item";

      const iconImg = document.createElement("img");
      iconImg.className = "token-icon";
      iconImg.src = token.src;
      iconImg.style.borderColor = token.borderColor || "#3b82f6";

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "token-actions";

      const minusBtn = document.createElement("button");
      minusBtn.textContent = "-";
      minusBtn.onclick = () => {
        token.size = Math.max(10, token.size - 10);
        draw();
      };

      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      plusBtn.onclick = () => {
        token.size = Math.min(200, token.size + 10);
        draw();
      };

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-delete";
      deleteBtn.textContent = "x";
      deleteBtn.onclick = () => {
        state.tokens = state.tokens.filter((t) => t.id !== token.id);
        updateTokenList();
        draw();
      };

      actionsDiv.appendChild(minusBtn);
      actionsDiv.appendChild(plusBtn);
      actionsDiv.appendChild(deleteBtn);
      tokenItem.appendChild(iconImg);
      tokenItem.appendChild(actionsDiv);
      tokenList.appendChild(tokenItem);
    });
  }

  if (addTokenBtn && tokenImageUpload) {
    addTokenBtn.onclick = () => {
      tokenImageUpload.click();
    };

    tokenImageUpload.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      pendingTokenName = file.name.replace(/\.[^\/\.]+$/, "");
      const reader = new FileReader();
      reader.onload = (ev) => {
        pendingTokenImg = new Image();
        pendingTokenImg.src = ev.target.result;
        pendingTokenImg.onload = () => {
          const centerScreen = { x: width / 2, y: height / 2 };
          const centerWorld = screenToWorld(centerScreen);
          state.tokens.push({
            id: generateTokenId(),
            src: ev.target.result,
            x: centerWorld.x,
            y: centerWorld.y,
            size: TOKEN_DEFAULT_SIZE,
            name: pendingTokenName,
            imageObj: pendingTokenImg,
            borderColor: getNextTokenBorderColor()
          });
          tokenImageUpload.value = "";
          updateTokenList();
          draw();
        };
      };
      reader.readAsDataURL(file);
    };
  }

  // =====================
  // CAMERA DRAG / PINCH / WHEEL ZOOM
  // =====================
  const pointers = new Map();
  let pinchState = null;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 4;

  function getCellSize(z) {
    const zval = typeof z === 'number' ? z : zoom;
    return BASE * state.grid.cellMultiplier * zval;
  }

  function getCanvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function screenToWorld(pt) {
    const scale = getCellSize();
    return { x: (pt.x - camera.x) / scale, y: (pt.y - camera.y) / scale };
  }

  function worldToScreen(wp) {
    const scale = getCellSize();
    return { x: wp.x * scale + camera.x, y: wp.y * scale + camera.y };
  }

  function setZoom(newZoom, screenX, screenY) {
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    if (newZoom === zoom) return;
    // manter o ponto do mundo sob (screenX,screenY)
    const oldScale = getCellSize(zoom);
    const wx = (screenX - camera.x) / oldScale;
    const wy = (screenY - camera.y) / oldScale;
    zoom = newZoom;
    const newScale = getCellSize(zoom);
    camera.x = screenX - wx * newScale;
    camera.y = screenY - wy * newScale;
    draw();
  }

  function distance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function onPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const pt = getCanvasPoint(e);
    pointers.set(e.pointerId, pt);
    canvas.setPointerCapture(e.pointerId);

    const hitToken = getTokenAtPoint(pt);
    if (hitToken) {
      draggingToken = hitToken;
      draggingTokenPointerId = e.pointerId;
      draggingTokenStart = { x: hitToken.x, y: hitToken.y };
      lastMouse = pt;
      e.preventDefault();
      return;
    }

    if (pointers.size === 1) {
      isDragging = true;
      activePointerId = e.pointerId;
      lastMouse = pt;
    } else if (pointers.size === 2) {
      const ps = Array.from(pointers.values());
      pinchState = {
        startDistance: distance(ps[0], ps[1]),
        startZoom: zoom,
        center: midpoint(ps[0], ps[1])
      };
      isDragging = false;
      activePointerId = null;
    }
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    const pt = getCanvasPoint(e);
    pointers.set(e.pointerId, pt);

    if (pinchState && pointers.size >= 2) {
      const ps = Array.from(pointers.values());
      const currDist = distance(ps[0], ps[1]);
      if (pinchState.startDistance > 0) {
        const factor = currDist / pinchState.startDistance;
        setZoom(pinchState.startZoom * factor, pinchState.center.x, pinchState.center.y);
      }
      e.preventDefault();
      return;
    }

    if (draggingToken && e.pointerId === draggingTokenPointerId) {
      const current = getCanvasPoint(e);
      const scale = getCellSize();
      draggingToken.x += (current.x - lastMouse.x) / scale;
      draggingToken.y += (current.y - lastMouse.y) / scale;
      lastMouse = current;
      draw();
      e.preventDefault();
      return;
    }

    if (isDragging && e.pointerId === activePointerId) {
      const dx = pt.x - lastMouse.x;
      const dy = pt.y - lastMouse.y;
      camera.x += dx;
      camera.y += dy;
      lastMouse = pt;
      draw();
      e.preventDefault();
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}

    if (draggingToken && e.pointerId === draggingTokenPointerId) {
      draggingToken = null;
      draggingTokenPointerId = null;
      draggingTokenStart = null;
      draw();
    }

    if (e.pointerId === activePointerId) {
      isDragging = false;
      activePointerId = null;
    }
    if (pointers.size < 2) pinchState = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("lostpointercapture", onPointerUp);

  // Wheel zoom (afeta apenas grid e imagem)
  canvas.addEventListener("wheel", (e) => {
    const pt = getCanvasPoint(e);
    const zoomFactor = Math.exp(-e.deltaY * 0.0015);
    setZoom(zoom * zoomFactor, pt.x, pt.y);
    e.preventDefault();
  }, { passive: false });

  // =====================
  // DRAW IMAGE
  // =====================
  function drawImage() {
    if (!state.image.active || !imgObj) return;
    const size = BASE * state.grid.cellMultiplier * zoom;
    const x = state.image.anchor.col * size + camera.x;
    const y = state.image.anchor.row * size + camera.y;
    const w = state.image.widthCells * size;
    const h = state.image.heightCells * size;
    ctx.drawImage(imgObj, x, y, w, h);
  }

  // =====================
  // DRAW GRID
  // =====================
  function drawGrid() {
    const size = BASE * state.grid.cellMultiplier * zoom;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    let offsetX = camera.x % size;
    if (offsetX < 0) offsetX += size;
    let offsetY = camera.y % size;
    if (offsetY < 0) offsetY += size;
    for (let x = offsetX; x < width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = offsetY; y < height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // =====================
  // DRAW TOKENS
  // =====================
  function drawTokens() {
    state.tokens.forEach((token) => {
      const center = worldToScreen({ x: token.x, y: token.y });
      const size = token.size * zoom;
      const rx = size / 2;
      const ry = size / 2;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.clip();

      if (token.imageObj && token.imageObj.complete) {
        ctx.drawImage(token.imageObj, center.x - rx, center.y - ry, size, size);
      } else {
        ctx.fillStyle = "#555";
        ctx.fillRect(center.x - rx, center.y - ry, size, size);
      }
      ctx.restore();

      ctx.strokeStyle = token.borderColor || "#3b82f6";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // =====================
  // DRAW RENDER LOOP
  // =====================
  function draw() {
    ctx.fillStyle = "#2f2f2f";
    ctx.fillRect(0, 0, width, height);
    drawGrid();
    drawImage();
    drawTokens();
    
    // Atualizar réguas
    drawTopRuler();
    drawLeftRuler();
  }

  // =====================
  // RESIZE HANDLER
  // =====================
  function resize() {
    width = innerWidth - 50; // Offset pela régua esquerda
    height = innerHeight - 30; // Offset pela régua topo
    canvas.width = width;
    canvas.height = height;
    
    // Redimensionar réguas
    topRuler.width = width;
    topRuler.height = 30;
    leftRuler.width = 50;
    leftRuler.height = height;
    
    draw();
  }

  // =====================
  // RULER UTILITIES
  // =====================
  function numberToExcelColumn(n) {
    let col = '';
    while (n > 0) {
      n--;
      col = String.fromCharCode(65 + (n % 26)) + col;
      n = Math.floor(n / 26);
    }
    return col;
  }

  // =====================
  // DRAW TOP RULER
  // =====================
  function drawTopRuler() {
    topRulerCtx.fillStyle = "#2a2a2a";
    topRulerCtx.fillRect(0, 0, topRuler.width, 30);
    
    topRulerCtx.strokeStyle = "#3b82f6";
    topRulerCtx.lineWidth = 1;
    topRulerCtx.fillStyle = "#aaa";
    topRulerCtx.font = "11px monospace";
    topRulerCtx.textAlign = "center";
    topRulerCtx.textBaseline = "middle";
    
    const cellSize = BASE * state.grid.cellMultiplier * zoom;
    const startCol = Math.floor(-camera.x / cellSize);
    const endCol = startCol + Math.ceil(topRuler.width / cellSize) + 1;
    
    for (let col = Math.max(1, startCol); col <= endCol; col++) {
      const x = col * cellSize + camera.x;
      
      if (x >= 0 && x <= topRuler.width) {
        // Linha vertical
        topRulerCtx.beginPath();
        topRulerCtx.moveTo(x, 0);
        topRulerCtx.lineTo(x, 30);
        topRulerCtx.stroke();
        
        // Label
        const label = numberToExcelColumn(col);
        topRulerCtx.fillText(label, x + cellSize / 2, 15);
      }
    }
    
    // Borda inferior
    topRulerCtx.strokeStyle = "#3b82f6";
    topRulerCtx.lineWidth = 2;
    topRulerCtx.beginPath();
    topRulerCtx.moveTo(0, 29);
    topRulerCtx.lineTo(topRuler.width, 29);
    topRulerCtx.stroke();
  }

  // =====================
  // DRAW LEFT RULER
  // =====================
  function drawLeftRuler() {
    leftRulerCtx.fillStyle = "#2a2a2a";
    leftRulerCtx.fillRect(0, 0, 50, leftRuler.height);
    
    leftRulerCtx.strokeStyle = "#3b82f6";
    leftRulerCtx.lineWidth = 1;
    leftRulerCtx.fillStyle = "#aaa";
    leftRulerCtx.font = "11px monospace";
    leftRulerCtx.textAlign = "center";
    leftRulerCtx.textBaseline = "middle";
    
    const cellSize = BASE * state.grid.cellMultiplier * zoom;
    const startRow = Math.floor(-camera.y / cellSize);
    const endRow = startRow + Math.ceil(leftRuler.height / cellSize) + 1;
    
    for (let row = Math.max(1, startRow); row <= endRow; row++) {
      const y = row * cellSize + camera.y;
      
      if (y >= 0 && y <= leftRuler.height) {
        // Linha horizontal
        leftRulerCtx.beginPath();
        leftRulerCtx.moveTo(0, y);
        leftRulerCtx.lineTo(50, y);
        leftRulerCtx.stroke();
        
        // Label
        leftRulerCtx.fillText(row.toString(), 25, y + cellSize / 2);
      }
    }
    
    // Borda direita
    leftRulerCtx.strokeStyle = "#3b82f6";
    leftRulerCtx.lineWidth = 2;
    leftRulerCtx.beginPath();
    leftRulerCtx.moveTo(49, 0);
    leftRulerCtx.lineTo(49, leftRuler.height);
    leftRulerCtx.stroke();
  }

  window.addEventListener("resize", resize);
  resize();

  // =====================
  // INITIALIZATION
  // =====================
  updateTokenList();

  // =====================
  // VTT PUBLIC API
  // =====================
  const VTT = {
    init(campaign) {
      if (!editorEl) return;
      if (!campaign) editorEl.textContent = "Nenhuma campanha carregada.";
      else editorEl.textContent = JSON.stringify(campaign, null, 2);
    },
    getState() {
      return state;
    },
    getCamera() {
      return camera;
    },
    saveState() {
      return {
        state,
        camera,
        image: state.image
      };
    }
  };

  window.VTT = VTT;

  // =====================
  // INITIALIZATION
  // =====================
  loadSavedGameData();
})();
