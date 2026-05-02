const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = Math.min(720, window.innerWidth - 32);
canvas.height = Math.min(480, window.innerHeight - 200);;

let colorAlive = '#85B7EB';
let colorDead = '#1a1a1a';
let colorGrid = '#333333';
let showGrid = true;
let fillRate = 0.3;
let INTERVAL = 1000 / 7;
let lastTime = 0;

let birthRules = [3];
let survivalRules = [2, 3];

function drawHexagon(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i - 30);
        const px = x + size * Math.cos(angle);
        const py = y + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
}

let SIZE = 20;
let W = Math.sqrt(3) * SIZE;
let H = 1.5 * SIZE;

let COLS = Math.ceil(canvas.width / W) + 1;
let ROWS = Math.ceil(canvas.height / H) + 1;

function createHexGrid(rows, cols) {
    const arr = new Array(rows);
    for (let i = 0; i < rows; i++) {
        arr[i] = new Array(cols).fill(0);
    }
    return arr;
}

function drawHexCells() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const x = col * W + (row % 2) * (W / 2) + SIZE;
            const y = row * H + SIZE;
            drawHexagon(ctx, x, y, SIZE);
            if (grid[row][col] === 1) {
                ctx.fillStyle = colorAlive;
            } else {
                ctx.fillStyle = colorDead;
            }
            ctx.fill();
            if (showGrid) {
                ctx.strokeStyle = colorGrid;
                ctx.stroke();
            }
        }
    }
}

canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const row = Math.round((mouseY - SIZE) / H);
    const col = Math.round((mouseX - SIZE - (row % 2) * (W / 2)) / W);

    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        if (mode === 'draw') {
            grid[row][col] = 1;
        } else {
            const selected = document.getElementById('hex-pattern-select').value;
            placeHexPattern(HEX_PATTERNS[selected]);
        }
        drawHexCells();
    }
});

canvas.addEventListener('touchstart', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    const row = Math.round((mouseY - SIZE) / H);
    const col = Math.round((mouseX - SIZE - (row % 2) * (W / 2)) / W);
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        grid[row][col] = 1;
        drawHexCells();
    }
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    const row = Math.round((mouseY - SIZE) / H);
    const col = Math.round((mouseX - SIZE - (row % 2) * (W / 2)) / W);
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        grid[row][col] = 1;
        drawHexCells();
    }
}, { passive: false });

function getNeighbors(row, col) {
    const even = row % 2 === 0;
    return [
        [row - 1, even ? col - 1 : col],
        [row - 1, even ? col : col + 1],
        [row, col - 1],
        [row, col + 1],
        [row + 1, even ? col - 1 : col],
        [row + 1, even ? col : col + 1],
    ];
}

function countAliveNeighbors(row, col) {
    let count = 0;
    for (const [r, c] of getNeighbors(row, col)) {
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            count += grid[r][c];
        }
    }
    return count;
}

function step() {
    const newGrid = createHexGrid(ROWS, COLS);
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
}

function randomize() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            grid[row][col] = Math.random() < fillRate ? 1 : 0;
        }
    }
    drawHexCells();
}

function clearGrid() {
    grid = createHexGrid(ROWS, COLS);
    running = false;
    document.getElementById('hex-btn-start').textContent = 'Start';
    drawHexCells();
}

let running = false;

function loop(timestamp) {
    if (!running) return;
    if (timestamp - lastTime >= INTERVAL) {
        step();
        drawHexCells();
        lastTime = timestamp;
    }
    requestAnimationFrame(loop);
}

document.getElementById('hex-btn-start').addEventListener('click', function() {
    running = !running;
    this.textContent = running ? 'Stop' : 'Start';
    if (running) requestAnimationFrame(loop);
});

document.getElementById('hex-btn-random').addEventListener('click', randomize);
document.getElementById('hex-btn-clear').addEventListener('click', clearGrid);

document.getElementById('hex-btn-grid').addEventListener('click', function() {
    showGrid = !showGrid;
    this.textContent = showGrid ? 'Grid ausblenden' : 'Grid anzeigen';
    drawHexCells();
});

document.getElementById('hex-color-alive').addEventListener('input', function() {
    colorAlive = this.value;
    drawHexCells();
});

document.getElementById('hex-color-dead').addEventListener('input', function() {
    colorDead = this.value;
    drawHexCells();
});

document.getElementById('hex-color-grid').addEventListener('input', function() {
    colorGrid = this.value;
    drawHexCells();
});

document.getElementById('hex-speed').addEventListener('input', function() {
    INTERVAL = 1000 / this.value;
    document.getElementById('hex-speed-out').textContent = this.value + '/s';
});

document.getElementById('hex-fill-rate').addEventListener('input', function() {
    fillRate = parseFloat(this.value);
    document.getElementById('hex-fill-rate-out').textContent = Math.round(this.value * 100) + '%';
});

document.getElementById('hex-cell-size').addEventListener('input', function() {
    SIZE = parseInt(this.value);
    W = Math.sqrt(3) * SIZE;
    H = 1.5 * SIZE;
    COLS = Math.ceil(canvas.width / W) + 1;
    ROWS = Math.ceil(canvas.height / H) + 1;
    grid = createHexGrid(ROWS, COLS);
    document.getElementById('hex-cell-size-out').textContent = this.value + 'px';
    drawHexCells();
});

let mode = 'draw';

function placeHexPattern(pattern) {
    const centerRow = Math.floor(ROWS / 2);
    const centerCol = Math.floor(COLS / 2);
    for (const [dr, dc] of pattern) {
        const r = centerRow + dr;
        const c = centerCol + dc;
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
            grid[r][c] = 1;
        }
    }
    drawHexCells();
}

document.getElementById('hex-btn-place').addEventListener('click', function() {
    const selected = document.getElementById('hex-pattern-select').value;
    placeHexPattern(HEX_PATTERNS[selected]);
});

document.getElementById('hex-btn-mode').addEventListener('click', function() {
    mode = mode === 'draw' ? 'place' : 'draw';
    this.textContent = mode === 'draw' ? 'Modus: Zeichnen' : 'Modus: Platzieren';
});

document.getElementById('hex-birth-boxes').addEventListener('change', function() {
    birthRules = Array.from(this.querySelectorAll('input:checked'))
        .map(cb => parseInt(cb.value));
});

document.getElementById('hex-survival-boxes').addEventListener('change', function() {
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

let grid = createHexGrid(ROWS, COLS);
drawHexCells();