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
  const mapEditList = document.getElementById("mapEditList");
  const gridZoomIn = document.getElementById("gridZoomIn");
  const gridZoomOut = document.getElementById("gridZoomOut");
  const addTokenBtn = document.getElementById("addTokenBtn");
  const addEnemyTokenBtn = document.getElementById("addEnemyTokenBtn");
  const tokenDrawerBtn = document.getElementById("tokenDrawerBtn");
  const tokenDrawerContent = document.getElementById("tokenDrawerContent");
  const enemyTokenDrawerBtn = document.getElementById("enemyTokenDrawerBtn");
  const enemyTokenDrawerContent = document.getElementById("enemyTokenDrawerContent");
  const tokenImageUpload = document.getElementById("tokenImageUpload");
  const enemyTokenImageUpload = document.getElementById("enemyTokenImageUpload");
  const tokenList = document.getElementById("tokenList");
  const enemyTokenList = document.getElementById("enemyTokenList");
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
    maps: [],
    tokens: [],
    enemyTokens: []
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
  let pendingImg = null;
  let pendingName = null;
  let pendingTokenImg = null;
  let pendingTokenName = null;
  let draggingToken = null;
  let draggingTokenPointerId = null;
  let draggingTokenStart = null;
  let draggingTokenGroup = "tokens";
  const TOKEN_DEFAULT_SIZE = 50;
  const TOKEN_COLORS = [
    "#ef4444", "#3b82f6", "#fbbf24", "#10b981", "#f97316",
    "#a855f7", "#ec4899", "#06b6d4", "#84cc16", "#f59e0b",
    "#8b5cf6", "#14b8a6", "#f43f5e", "#7c3aed", "#06b6d4"
  ];
  let lastTokenColor = null;
  const openMapIds = new Set();
  let tokenDrawerOpen = false;
  let enemyTokenDrawerOpen = false;

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

        setTokenDrawerOpen(Array.isArray(state.tokens) && state.tokens.length > 0);
        setEnemyTokenDrawerOpen(Array.isArray(state.enemyTokens) && state.enemyTokens.length > 0);
        updateTokenList();
        updateEnemyTokenList();

        // Aplicar camera salva
        if (gameData.camera) {
          camera.x = gameData.camera.x || 0;
          camera.y = gameData.camera.y || 0;
        }

        // Carregar imagens dos mapas salvos
        if (gameData.state && gameData.state.maps && gameData.state.maps.length > 0) {
          let loadedMaps = 0;
          gameData.state.maps.forEach((map) => {
            openMapIds.add(map.id);
            const img = new Image();
            img.src = map.src;
            img.onload = () => {
              const existingMap = state.maps.find(m => m.id === map.id);
              if (existingMap) {
                existingMap.imageObj = img;
              }
              loadedMaps++;
              if (loadedMaps === gameData.state.maps.length) {
                updateMapList();
                draw();
              }
            };
          });
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
  // APPLY MAP
  // =====================
  function generateMapId() {
    return "map_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
  }

  applyMapBtn.onclick = () => {
    if (!pendingImg) return alert("Selecione uma imagem");
    
    const mapId = generateMapId();
    const mapNumber = state.maps.length + 1;
    
    const newMap = {
      id: mapId,
      src: pendingImg.src,
      widthCells: parseInt(imgW.value) || 10,
      heightCells: parseInt(imgH.value) || 10,
      anchor: { col: 3, row: 3 },
      number: mapNumber,
      imageObj: pendingImg
    };
    
    state.maps.push(newMap);
    openMapIds.add(mapId);
    imgUpload.value = "";
    updateMapList();
    draw();
  };

  // =====================
  // UPDATE MAP LIST (Gera controles dinamicamente)
  // =====================
  function updateMapList() {
    mapEditList.innerHTML = "";

    state.maps.forEach((map) => {
      const mapContainer = document.createElement("div");
      mapContainer.className = "map-drawer";

      const mapTitleButton = document.createElement("button");
      mapTitleButton.type = "button";
      mapTitleButton.className = "map-drawer-toggle";
      mapTitleButton.textContent = `Mapa ${map.number}`;
      mapTitleButton.setAttribute("aria-expanded", String(openMapIds.has(map.id)));

      const mapContent = document.createElement("div");
      mapContent.className = "map-drawer-content";
      mapContent.style.display = openMapIds.has(map.id) ? "block" : "none";

      mapTitleButton.onclick = () => {
        const shouldOpen = !openMapIds.has(map.id);
        if (shouldOpen) {
          openMapIds.add(map.id);
        } else {
          openMapIds.delete(map.id);
        }
        mapContent.style.display = shouldOpen ? "block" : "none";
        mapTitleButton.setAttribute("aria-expanded", String(shouldOpen));
      };

      const widthDiv = document.createElement("div");
      widthDiv.className = "map-grid-row";
      widthDiv.innerHTML = `<span style="font-size:0.9rem;color:#ccc;">Largura:</span><br>`;

      const wMinusBtn = document.createElement("button");
      wMinusBtn.textContent = "-";
      wMinusBtn.style.width = "48%";
      wMinusBtn.style.display = "inline-block";
      wMinusBtn.onclick = () => {
        if (map.widthCells > 1) {
          map.widthCells--;
          updateMapList();
          draw();
        }
      };

      const wPlusBtn = document.createElement("button");
      wPlusBtn.textContent = "+";
      wPlusBtn.style.width = "48%";
      wPlusBtn.style.display = "inline-block";
      wPlusBtn.style.marginLeft = "2%";
      wPlusBtn.onclick = () => {
        map.widthCells++;
        updateMapList();
        draw();
      };

      const wValueSpan = document.createElement("span");
      wValueSpan.textContent = map.widthCells;
      wValueSpan.style.marginLeft = "8px";

      widthDiv.appendChild(wMinusBtn);
      widthDiv.appendChild(wPlusBtn);
      widthDiv.appendChild(wValueSpan);

      const heightDiv = document.createElement("div");
      heightDiv.className = "map-grid-row";
      heightDiv.innerHTML = `<span style="font-size:0.9rem;color:#ccc;">Altura:</span><br>`;

      const hMinusBtn = document.createElement("button");
      hMinusBtn.textContent = "-";
      hMinusBtn.style.width = "48%";
      hMinusBtn.style.display = "inline-block";
      hMinusBtn.onclick = () => {
        if (map.heightCells > 1) {
          map.heightCells--;
          updateMapList();
          draw();
        }
      };

      const hPlusBtn = document.createElement("button");
      hPlusBtn.textContent = "+";
      hPlusBtn.style.width = "48%";
      hPlusBtn.style.display = "inline-block";
      hPlusBtn.style.marginLeft = "2%";
      hPlusBtn.onclick = () => {
        map.heightCells++;
        updateMapList();
        draw();
      };

      const hValueSpan = document.createElement("span");
      hValueSpan.textContent = map.heightCells;
      hValueSpan.style.marginLeft = "8px";

      heightDiv.appendChild(hMinusBtn);
      heightDiv.appendChild(hPlusBtn);
      heightDiv.appendChild(hValueSpan);

      const posDiv = document.createElement("div");
      posDiv.className = "map-position-row";
      posDiv.style.marginTop = "8px";
      posDiv.innerHTML = `<span style="font-size:0.9rem;color:#ccc;">Posição:</span><br>`;

      const upBtn = document.createElement("button");
      upBtn.textContent = "⬆ Cima";
      upBtn.style.width = "100%";
      upBtn.onclick = () => {
        map.anchor.row = Math.max(-100, map.anchor.row - 1);
        draw();
      };

      const downBtn = document.createElement("button");
      downBtn.textContent = "⬇ Baixo";
      downBtn.style.width = "100%";
      downBtn.onclick = () => {
        map.anchor.row = Math.min(100, map.anchor.row + 1);
        draw();
      };

      const leftBtn = document.createElement("button");
      leftBtn.textContent = "⬅ Esquerda";
      leftBtn.style.width = "100%";
      leftBtn.onclick = () => {
        map.anchor.col = Math.max(-100, map.anchor.col - 1);
        draw();
      };

      const rightBtn = document.createElement("button");
      rightBtn.textContent = "➡ Direita";
      rightBtn.style.width = "100%";
      rightBtn.onclick = () => {
        map.anchor.col = Math.min(100, map.anchor.col + 1);
        draw();
      };

      posDiv.appendChild(upBtn);
      posDiv.appendChild(downBtn);
      posDiv.appendChild(leftBtn);
      posDiv.appendChild(rightBtn);

      mapContent.appendChild(widthDiv);
      mapContent.appendChild(heightDiv);
      mapContent.appendChild(posDiv);
      mapContainer.appendChild(mapTitleButton);
      mapContainer.appendChild(mapContent);
      mapEditList.appendChild(mapContainer);
    });
  }

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
    let color;
    do {
      color = TOKEN_COLORS[Math.floor(Math.random() * TOKEN_COLORS.length)];
    } while (color === lastTokenColor && TOKEN_COLORS.length > 1);
    lastTokenColor = color;
    return color;
  }

  function getTokenAtPoint(screenPoint) {
    const groups = [
      { name: "enemyTokens", tokens: state.enemyTokens },
      { name: "tokens", tokens: state.tokens }
    ];

    for (const group of groups) {
      for (let i = group.tokens.length - 1; i >= 0; i--) {
        const token = group.tokens[i];
        const center = worldToScreen({ x: token.x, y: token.y });
        const radius = (token.size * zoom) / 2;
        const d = Math.hypot(screenPoint.x - center.x, screenPoint.y - center.y);
        if (d <= radius) return { token, group: group.name };
      }
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

  function updateEnemyTokenList() {
    if (!enemyTokenList) return;
    enemyTokenList.innerHTML = "";
    state.enemyTokens.forEach((token) => {
      const tokenItem = document.createElement("div");
      tokenItem.className = "token-item";

      const iconImg = document.createElement("img");
      iconImg.className = "token-icon";
      iconImg.src = token.src;
      iconImg.style.borderColor = "#ef4444";
      iconImg.style.borderWidth = "4px";

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
        state.enemyTokens = state.enemyTokens.filter((t) => t.id !== token.id);
        updateEnemyTokenList();
        draw();
      };

      actionsDiv.appendChild(minusBtn);
      actionsDiv.appendChild(plusBtn);
      actionsDiv.appendChild(deleteBtn);
      tokenItem.appendChild(iconImg);
      tokenItem.appendChild(actionsDiv);
      enemyTokenList.appendChild(tokenItem);
    });
  }

  function setTokenDrawerOpen(open) {
    tokenDrawerOpen = open;
    if (tokenDrawerBtn) {
      tokenDrawerBtn.setAttribute("aria-expanded", String(open));
    }
    if (tokenDrawerContent) {
      tokenDrawerContent.style.display = open ? "block" : "none";
    }
  }

  function setEnemyTokenDrawerOpen(open) {
    enemyTokenDrawerOpen = open;
    if (enemyTokenDrawerBtn) {
      enemyTokenDrawerBtn.setAttribute("aria-expanded", String(open));
    }
    if (enemyTokenDrawerContent) {
      enemyTokenDrawerContent.style.display = open ? "block" : "none";
    }
  }

  if (tokenDrawerBtn) {
    tokenDrawerBtn.onclick = () => {
      setTokenDrawerOpen(!tokenDrawerOpen);
    };
  }

  if (enemyTokenDrawerBtn) {
    enemyTokenDrawerBtn.onclick = () => {
      setEnemyTokenDrawerOpen(!enemyTokenDrawerOpen);
    };
  }

  function createTokenFromUpload(file, targetGroup) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => {
        const centerScreen = { x: width / 2, y: height / 2 };
        const centerWorld = screenToWorld(centerScreen);
        const token = {
          id: generateTokenId(),
          src: ev.target.result,
          x: centerWorld.x,
          y: centerWorld.y,
          size: TOKEN_DEFAULT_SIZE,
          name: file.name.replace(/\.[^\/\.]+$/, ""),
          imageObj: img,
          borderColor: targetGroup === "enemyTokens" ? "#ef4444" : getNextTokenBorderColor(),
          borderWidth: targetGroup === "enemyTokens" ? 4 : 2
        };
        state[targetGroup].push(token);
        setTokenDrawerOpen(state.tokens.length > 0 || tokenDrawerOpen);
        setEnemyTokenDrawerOpen(state.enemyTokens.length > 0 || enemyTokenDrawerOpen);
        if (targetGroup === "tokens") updateTokenList();
        if (targetGroup === "enemyTokens") updateEnemyTokenList();
        draw();
      };
    };
    reader.readAsDataURL(file);
  }

  if (addTokenBtn && tokenImageUpload) {
    addTokenBtn.onclick = () => {
      tokenImageUpload.click();
    };

    tokenImageUpload.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      createTokenFromUpload(file, "tokens");
      tokenImageUpload.value = "";
    };
  }

  if (addEnemyTokenBtn && enemyTokenImageUpload) {
    addEnemyTokenBtn.onclick = () => {
      enemyTokenImageUpload.click();
    };

    enemyTokenImageUpload.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      createTokenFromUpload(file, "enemyTokens");
      enemyTokenImageUpload.value = "";
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
      draggingToken = hitToken.token;
      draggingTokenGroup = hitToken.group;
      draggingTokenPointerId = e.pointerId;
      draggingTokenStart = { x: hitToken.token.x, y: hitToken.token.y };
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
  // DRAW IMAGES (All maps)
  // =====================
  function drawImage() {
    state.maps.forEach((map) => {
      if (!map.imageObj || !map.imageObj.complete) return;
      const size = BASE * state.grid.cellMultiplier * zoom;
      const x = map.anchor.col * size + camera.x;
      const y = map.anchor.row * size + camera.y;
      const w = map.widthCells * size;
      const h = map.heightCells * size;
      ctx.drawImage(map.imageObj, x, y, w, h);
    });
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
    const allTokens = [
      ...state.tokens.map((token) => ({ token, group: "tokens" })),
      ...state.enemyTokens.map((token) => ({ token, group: "enemyTokens" }))
    ];

    allTokens.forEach(({ token }) => {
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
      ctx.lineWidth = token.borderWidth || 2;
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // =====================
  // DRAW TOKEN MOVEMENT PATH & DISTANCE
  // =====================
  function drawMovementPath() {
    if (!draggingToken || !draggingTokenStart || state.grid.metersPerCell === null) return;

    const startScreen = worldToScreen(draggingTokenStart);
    const currentScreen = worldToScreen({ x: draggingToken.x, y: draggingToken.y });
    const dx = currentScreen.x - startScreen.x;
    const dy = currentScreen.y - startScreen.y;
    const lineLength = Math.hypot(dx, dy);

    // Desenhar linha
    ctx.strokeStyle = "#90ee90";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startScreen.x, startScreen.y);
    ctx.lineTo(currentScreen.x, currentScreen.y);
    ctx.stroke();

    // Calcular distância em metros
    const cellSize = getCellSize();
    const distanceCells = Math.hypot(draggingToken.x - draggingTokenStart.x, draggingToken.y - draggingTokenStart.y);
    const meters = distanceCells * state.grid.metersPerCell;
    const label = meters.toFixed(1) + "m";

    // Posicionar o contador de forma inteligente (offset perpendicular à linha)
    const centerX = (startScreen.x + currentScreen.x) / 2;
    const centerY = (startScreen.y + currentScreen.y) / 2;
    const offsetDistance = 60; // Distância do label em relação à linha
    let offsetX = 0;
    let offsetY = -offsetDistance;

    if (lineLength > 0.5) {
      // Calcular perpendicular à linha para não cobrir a linha
      const normalX = -dy / lineLength;
      const normalY = dx / lineLength;
      offsetX = normalX * offsetDistance;
      offsetY = normalY * offsetDistance;
    }

    const labelX = centerX + offsetX;
    const labelY = centerY + offsetY;
    const paddingX = 10;
    const paddingY = 6;

    // Desenhar fundo do contador
    ctx.font = "bold 12px sans-serif";
    const textWidth = ctx.measureText(label).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 22;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(labelX - boxWidth / 2, labelY - boxHeight / 2, boxWidth, boxHeight);
    
    // Desenhar texto do contador
    ctx.fillStyle = "#90ee90";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, labelX, labelY + 0.5);
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
    drawMovementPath();
    
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
  updateEnemyTokenList();

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
        camera
      };
    }
  };

  window.VTT = VTT;

  // =====================
  // INITIALIZATION
  // =====================
  loadSavedGameData();
})();
