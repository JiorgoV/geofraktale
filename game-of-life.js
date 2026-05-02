const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const COLS = 60; // Anzahl Spalten
const ROWS = 40; // Anzahl Zeilen
let CELL_SIZE = 12; // Größe der Zellen in Pixeln

canvas.width = Math.min(720, window.innerWidth - 32);
canvas.height = Math.min(480, window.innerHeight - 200);

let colorAlive = '#85B7EB';
let colorDead = '#1a1a1a';
let colorGrid = '#333333';
let showGrid = true;

let birthRules = [3];
let survivalRules = [2, 3];

let fillRate = 0.3; // 30% der Zellen werden zufällig lebendig




function render() {
    drawCells();
    drawGrid();
}

document.getElementById('color-grid').addEventListener('input', function() {
    colorGrid = this.value;
    render();
});


function drawGrid() {
    if (!showGrid) return;
    ctx.strokeStyle = ctx.strokeStyle = colorGrid;
    ctx.beginPath(); // einmal öffnen

    for (let x = 0; x <= canvas.width; x += CELL_SIZE) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y <= canvas.height; y += CELL_SIZE) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }

    ctx.stroke(); // einmal zeichnen
}

function createGrid(rows, cols) {
    const arr = new Array(rows);
    for (let i = 0; i < rows; i++) {
        arr[i] = new Array(cols).fill(0);
    }
    return arr;
}

function clearGrid() {
    grid = createGrid(ROWS, COLS);
    running = false;
    document.getElementById('btn-start').textContent = 'Start';
    render();
}

function drawCells() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Erst ganzen Hintergrund füllen
    ctx.fillStyle = colorDead;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dann lebendige Zellen zeichnen
    ctx.fillStyle = colorAlive;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (grid[row][col] === 1) {
                ctx.fillRect(
                    col * CELL_SIZE + 1,
                    row * CELL_SIZE + 1,
                    CELL_SIZE - 2,
                    CELL_SIZE - 2
                );
            }
        }
    }
}

function toggleGrid() {
    showGrid = !showGrid;
    console.log('showGrid ist jetzt:', showGrid);
    document.getElementById('btn-grid').textContent = showGrid ? 'Grid ausblenden' : 'Grid anzeigen';
    render();
}

canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    if (mode === 'draw') {
        grid[row][col] = 1;
    } else {
        const selected = document.getElementById('pattern-select').value;
        const pattern = PATTERNS[selected];
        for (const [dr, dc] of pattern) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                grid[r][c] = 1;
            }
        }
    }

    render();
});

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const col = Math.floor((touch.clientX - rect.left) / CELL_SIZE);
    const row = Math.floor((touch.clientY - rect.top) / CELL_SIZE);
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        grid[row][col] = 1;
        render();
    }
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const col = Math.floor((touch.clientX - rect.left) / CELL_SIZE);
    const row = Math.floor((touch.clientY - rect.top) / CELL_SIZE);
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        grid[row][col] = 1;
        render();
    }
}, { passive: false });


document.getElementById('color-alive').addEventListener('input', function() {
    colorAlive = this.value;
    render();
});

document.getElementById('color-dead').addEventListener('input', function() {
    colorDead = this.value;
    render();
});

document.getElementById('btn-grid').addEventListener('click', toggleGrid);


function step() {
    const newGrid = createGrid(ROWS, COLS);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const aliveNeighbors = countAliveNeighbors(row, col);
            if (grid[row][col] === 1) {
                newGrid[row][col] = survivalRules.includes(aliveNeighbors) ? 1 : 0;
            } else {
                newGrid[row][col] = birthRules.includes(aliveNeighbors) ? 1 : 0;
            }
        }
    }
    grid = newGrid;
    render();
}


function countAliveNeighbors(row, col) {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue; // sich selbst überspringen
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
                count += grid[r][c];
            }
        }
    }
    return count;
}

let running = false;

let lastTime = 0;
let INTERVAL = 150; // Millisekunden zwischen Generationen

document.getElementById('speed').addEventListener('input', function() {
    INTERVAL = 1000 / this.value;
    document.getElementById('speed-out').textContent = this.value + '/s';
});

document.getElementById('fill-rate').addEventListener('input', function() {
    fillRate = parseFloat(this.value);
    document.getElementById('fill-rate-out').textContent = Math.round(fillRate * 100) + '%';
});

document.getElementById('cell-size').addEventListener('input', function() {
    CELL_SIZE = parseInt(this.value);
    document.getElementById('cell-size-out').textContent = this.value + 'px';
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
    render();
});

function loop(timestamp) {
    if (!running) return;
    if (timestamp - lastTime >= INTERVAL) {
        step();
        lastTime = timestamp;
    }
    requestAnimationFrame(loop);
}

function randomize() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            grid[row][col] = Math.random() < fillRate ? 1 : 0;
        }
    }
    render();
}



function placePattern(pattern) {

    const centerRow = Math.floor(ROWS / 4);
    const centerCol = Math.floor(COLS / 4);
    for (const [dr, dc] of pattern) {
        grid[centerRow + dr][centerCol + dc] = 1;
    }
    render();
}


let mode = 'draw'; // 'draw' oder 'place'

document.getElementById('btn-mode').addEventListener('click', function() {
    mode = mode === 'draw' ? 'place' : 'draw';
    this.textContent = mode === 'draw' ? 'Modus: Zeichnen' : 'Modus: Platzieren';
});








document.getElementById('btn-place').addEventListener('click', function() {
    const selected = document.getElementById('pattern-select').value;
    placePattern(PATTERNS[selected]);
});

document.getElementById('btn-start').addEventListener('click', function() {
    running = !running; // toggle an/aus
    this.textContent = running ? 'Stop' : 'Start';
    if (running) requestAnimationFrame(loop);
});


document.getElementById('btn-clear').addEventListener('click', clearGrid);


document.getElementById('birth-boxes').addEventListener('change', function() {
    birthRules = Array.from(this.querySelectorAll('input:checked'))
        .map(cb => parseInt(cb.value));
});

document.getElementById('survival-boxes').addEventListener('change', function() {
    survivalRules = Array.from(this.querySelectorAll('input:checked'))
        .map(cb => parseInt(cb.value));
});

document.getElementById('btn-info').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'flex';
});

document.getElementById('btn-close').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
});



document.getElementById('btn-random').addEventListener('click', randomize);
let grid = createGrid(ROWS, COLS);
render();