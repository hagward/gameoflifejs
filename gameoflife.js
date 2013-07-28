/**
 * gameoflife.js v0.1, by Anders Hagward.
 * Date: 2013-07-28
 */

var canvasWidth = 800;
var canvasHeight = 600;
var blockSize = 10;
var colorBg = '#CCC';
var colorFg = '#BF3030';
var colorGrid = '#AAA';

var running = false;
var generations = 0;
var intervals = {'normal': 200, 'fast': 50, 'hyper': 10};
var currentInterval = 'normal';

var width, height;
resetDimensions();

var loop;

// Initialize block array.
// 0 = empty, 1 = filled
var blocks = [];
resizeBlockArray(true);

var startStopButton = document.getElementById('startStopButton');
var stepButton = document.getElementById('stepButton');
var clearButton = document.getElementById('clearButton');
var speedSelect = document.getElementById('speedSelect');
var generationsSpan = document.getElementById('generations');

var jsonTextarea = document.getElementById('jsonTextarea');
var setFromJsonButton = document.getElementById('setFromJsonButton');
var getJsonButton = document.getElementById('getJsonButton');

var canvas = document.getElementById('canvasOfLife');
canvas.width = canvasWidth;
canvas.height = canvasHeight;
canvas.style.background = colorBg;
canvas.style.marginLeft = (-canvasWidth / 2) + "px";

var gridCanvas = document.getElementById('gridCanvas');
gridCanvas.width = canvasWidth;
gridCanvas.height = canvasHeight;
gridCanvas.style.marginLeft = (-canvasWidth / 2) + "px";

var canvasContainer = document.getElementById('canvasContainer');
canvasContainer.style.width = canvasWidth + 'px';
canvasContainer.style.height = canvasHeight + 'px';

var context = canvas.getContext('2d');
var gridContext = gridCanvas.getContext('2d');

drawGrid();

/*
 * Form listeners.
 */
startStopButton.onclick = function() {
	toggleStart();
}
stepButton.onclick = function() {
	updateAndDraw();
}
clearButton.onclick = function() {
	resizeBlockArray(true);
	generations = 0;
	drawBlocks();
}
setFromJsonButton.onclick = function() {
	var filledBlocks = JSON.parse(jsonTextarea.value);
	if (!(filledBlocks instanceof Array)) {
		console.log('error: input must be an array');
		return;
	}

	resizeBlockArray(true);
	for (var i = 0; i < filledBlocks.length; i++) {
		if (filledBlocks[i].length == 2) {
			var x = filledBlocks[i][0];
			var y = filledBlocks[i][1];
			blocks[y][x] = 1;
		}
	}
	drawBlocks();
}
getJsonButton.onclick = function() {
	var filledBlocks = [];
	for (var i = 0; i < height; i++)
		for (var j = 0; j < width; j++)
			if (blocks[i][j] == 1)
				filledBlocks.push([j, i]);
	jsonTextarea.value = JSON.stringify(filledBlocks);
}
speedSelect.onchange = function() {
	setSpeedFromSelect(speedSelect);
}

/*
 * Mouse listeners.
 */
var mouseDown = 0;
var fill = true;
var lastX, lastY;
gridCanvas.onmousedown = function(event) {
	mouseDown++;

	var block = getBlockFromEvent(event);
	var x = block[0];
	var y = block[1];
	fill = blocks[y][x] == 0;

	blocks[y][x] = (blocks[y][x] + 1) % 2;
	context.fillStyle = (blocks[y][x] == 1) ? colorFg : colorBg;
	context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
}
gridCanvas.onmouseup = function() {
	mouseDown--;
}
gridCanvas.onmousemove = function(event) {
	if (mouseDown) {
		var block = getBlockFromEvent(event);
		var x = block[0];
		var y = block[1];

		if (x != lastX || y != lastY) {
			blocks[y][x] = (fill) ? 1 : 0;
			context.fillStyle = (fill) ? colorFg : colorBg;
			context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

			lastX = x;
			lastY = y;
		}
	}
}

/*
 * Key listener.
 */
window.onkeydown = function(event) {
	var keyCode = event.keyCode || event.which;
	switch (keyCode) {
		case 32: // Space.
			event.preventDefault();
			toggleStart();
			break;
		case 37: // Left.
		case 38: // Up.
		case 39: // Right.
		case 40: // Down.
			event.preventDefault();
			moveAllBlocks(keyCode - 37); // 0 - left, 1 - up etc.
			drawBlocks();
			break;
		case 46: // Del.
			event.preventDefault();
			if (!running) {
				resizeBlockArray(true);
				generations = 0;
				drawBlocks();
			}
			break;
		case 49: // 1.
		case 50: // 2.
		case 51: // 3.
			speedSelect.selectedIndex = keyCode - 49;
			setSpeedFromSelect(speedSelect);
			break;
		case 73: // I.
			zoom(5);
			break;
		case 78: // N.
			event.preventDefault();
			updateAndDraw();
			break;
		case 79: // O.
			zoom(-5);
			break;
	}
}

/**
 * Clears the game canvas and draws the blocks.
 */
function drawBlocks() {
	canvas.width = canvas.width;
	context.fillStyle = colorFg;

	for (var i = 0; i < height; i++) {
		for (var j = 0; j < width; j++) {
			// Draw.
			if (blocks[i][j] == 1)
				context.fillRect(blockSize * j, blockSize * i, blockSize, blockSize);
		}
	}
	generationsSpan.innerHTML = generations;
}

/**
 * Clears the grid canvas and draws the grid.
 */
function drawGrid() {
	gridCanvas.width = gridCanvas.width;
	gridContext.strokeStyle = colorGrid;

	for (var i = 1; i < width; i++) {
		var x = i * blockSize;
		gridContext.beginPath();
		gridContext.moveTo(x, 0);
		gridContext.lineTo(x, canvasHeight);
		gridContext.stroke();
	}
	for (var i = 1; i < height; i++) {
		var y = i * blockSize;
		gridContext.beginPath();
		gridContext.moveTo(0, y);
		gridContext.lineTo(canvasWidth, y);
		gridContext.stroke();
	}
}

/**
 * Returns the x and y values for the clicked block, based on a canvas.onclick
 * event.
 */
function getBlockFromEvent(event) {
	// Find click position.
	var x, y;
	if (event.pageX || event.pageY) {
		x = event.pageX;
		y = event.pageY;
	} else {
		x = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		y = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
	}
	x -= canvas.offsetLeft;
	y -= canvas.offsetTop;

	// Find block number.
	x = Math.floor(x / blockSize);
	y = Math.floor(y / blockSize);

	return [x, y];
}

/**
 * Returns the number of neighbours for the block at position (i, j).
 */
function getNumNeighbours(i, j) {
	var numNeighbours = 0;
	if (j > 0 && blocks[i][j - 1] == 1) numNeighbours++;
	if (j < width-1 && blocks[i][j + 1] == 1) numNeighbours++;
	if (i > 0 && blocks[i - 1][j] == 1) numNeighbours++;
	if (i > 0 && j > 0 && blocks[i - 1][j - 1] == 1) numNeighbours++;
	if (i > 0 && j < width-1 && blocks[i - 1][j + 1] == 1) numNeighbours++;
	if (i < height-1 && blocks[i + 1][j] == 1) numNeighbours++;
	if (i < height-1 && j > 0 && blocks[i + 1][j - 1] == 1) numNeighbours++;
	if (i < height-1 && j < width-1 && blocks[i + 1][j + 1] == 1) numNeighbours++;
	return numNeighbours;
}

/**
 * Moves all the blocks in the specified direction, where 0, 1, 2 and 3
 * corresponds to left, up, right and down respectively.
 */
function moveAllBlocks(direction) {
	var h = blocks.length;
	if (h == 0) return;
	var w = blocks[0].length;

	for (var i = 0; i < h; i++) {
		for (var j = 0; j < w; j++) {
			// Move left.
			if (direction == 0 && j < w - 1)
				blocks[i][j] = blocks[i][j + 1];
			// Move up.
			else if (direction == 1 && i < h - 1)
				blocks[i][j] = blocks[i + 1][j];
			// Move right.
			else if (direction == 2 && j < w - 1)
				blocks[i][w - j - 1] = blocks[i][w - j - 2];
			// Move down.
			else if (direction == 3 && i < h - 1)
				blocks[h - i - 1][j] = blocks[h - i - 2][j];
		}
	}
}

/**
 * Sets the game dimensions based on the current canvas dimensions and block
 * size.
 */
function resetDimensions() {
	width = Math.floor(canvasWidth / blockSize);
	height = Math.floor(canvasHeight / blockSize);
}

/**
 * Resizes the array to fit the current game dimensions. If 'reset' is true, it
 * will also set all values to zero.
 */
function resizeBlockArray(reset) {
	if (!reset && blocks.length >= height && blocks[0].length >= height)
		return;

	for (var i = 0; i < height; i++) {
		if (blocks.length <= i)
			blocks.push([]);
		for (var j = 0; j < width; j++) {
			if (blocks[i].length <= j)
				blocks[i].push(0);
			else if (reset)
				blocks[i][j] = 0;
		}
	}
}

/**
 * Sets the current update interval from the specified HTML select element.
 */
function setSpeedFromSelect(select) {
	var interval = intervals[select.value];
	if (!interval)
		return;

	currentInterval = select.value;
	if (running) {
		clearInterval(loop);
		loop = setInterval(updateAndDraw, interval);
	}
}

/**
 * Starts or stops the game, and updates the start and clear buttons.
 */
function toggleStart() {
	running = !running;
	if (running) {
		updateAndDraw();
		loop = setInterval(updateAndDraw, intervals[currentInterval]);
	} else {
		clearInterval(loop);
	}
	startStopButton.innerHTML = (running) ? 'Pause' : 'Run';
	clearButton.disabled = running;
}

/**
 * Handles the game logic and draws the blocks by calling drawBlocks().
 */
function updateAndDraw() {
	var blocksCopy = [];

	for (var i = 0; i < height; i++) {
		blocksCopy.push([]);
		for (var j = 0; j < width; j++) {
			blocksCopy[i].push(blocks[i][j]);
			var numNeighbours = getNumNeighbours(i, j);
			// Bring back block to life.
			if (blocks[i][j] == 0 && numNeighbours == 3)
				blocksCopy[i][j] = 1;
			// Kill block.
			else if (blocks[i][j] == 1 && (numNeighbours < 2 || numNeighbours > 3))
				blocksCopy[i][j] = 0;
		}
	}

	blocks = blocksCopy;
	generations++;
	drawBlocks();
}

/**
 * Zooms the game in or out by adding 'amount' to the block size. A positive
 * value zooms in, while a negative value zooms out. It will only zoom out if
 * (block size + amount) > 0.
 */
function zoom(amount) {
	if (blockSize + amount <= 0)
		return;

	blockSize += amount;
	resetDimensions();
	resizeBlockArray(false);
	drawBlocks();
	drawGrid();
}