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
    }
  };

  // =====================
  // CAMERA SYSTEM
  // =====================
  let camera = { x: 0, y: 0 };
  let isDragging = false;
  let lastMouse = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let zoom = 1;
  const BASE = 80;
  let imgObj = null;
  let pendingImg = null;
  let pendingName = null;

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
  gridZoomIn.onclick = () => {
    state.grid.cellMultiplier *= 1.2;
    draw();
  };

  gridZoomOut.onclick = () => {
    state.grid.cellMultiplier *= 0.8;
    draw();
  };

  // =====================
  // CAMERA DRAG
  // =====================
  canvas.onmousedown = (e) => {
    isDragging = true;
    lastMouse.x = e.clientX - 50; // Offset pela régua esquerda
    lastMouse.y = e.clientY - 30; // Offset pela régua topo
  };

  window.onmouseup = () => {
    isDragging = false;
  };

  window.onmousemove = (e) => {
    if (!isDragging) return;
    const dx = (e.clientX - 50) - lastMouse.x; // Offset
    const dy = (e.clientY - 30) - lastMouse.y; // Offset
    camera.x += dx;
    camera.y += dy;
    lastMouse.x = (e.clientX - 50);
    lastMouse.y = (e.clientY - 30);
    draw();
  };

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
  // DRAW RENDER LOOP
  // =====================
  function draw() {
    ctx.fillStyle = "#2f2f2f";
    ctx.fillRect(0, 0, width, height);
    drawGrid();
    drawImage();
    
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
