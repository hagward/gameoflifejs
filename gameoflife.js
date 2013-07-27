/**
 * gameoflife.js v0.1, by Anders Hagward.
 * Date: 2013-07-27
 */

var canvasWidth = 800;
var canvasHeight = 600;
var blockSize = 10;
var colorBg = 'gray';
var colorFg = 'yellow';

var running = false;
var generations = 0;
var intervals = {'normal': 200, 'fast': 50, 'hyper': 10};
var currentInterval = 'normal';
var width = Math.floor(canvasWidth / blockSize);
var height = Math.floor(canvasHeight / blockSize);

var loop;

// Initialize block array.
// 0 = empty, 1 = filled
var blocks = [];
resetBlocks();

var startStopButton = document.getElementById('startStopButton');
var stepButton = document.getElementById('stepButton');
var clearButton = document.getElementById('clearButton');
var speedSelect = document.getElementById('speedSelect');
var generationsSpan = document.getElementById('generations');

var canvas = document.getElementById('canvasOfLife');
canvas.width = canvasWidth;
canvas.height = canvasHeight;
canvas.style.background = colorBg;

var context = canvas.getContext('2d');

startStopButton.onclick = function() {
	toggleStart();
}

stepButton.onclick = function() {
	updateAndDraw();
}

clearButton.onclick = function() {
	resetBlocks();
	generations = 0;
	draw();
}

var mouseDown = 0;
var fill = true;
canvas.onmousedown = function(event) {
	mouseDown++;

	var block = getBlockFromEvent(event);
	var x = block[0];
	var y = block[1];
	fill = blocks[y][x] == 0;

	blocks[y][x] = (blocks[y][x] + 1) % 2;
	context.fillStyle = (blocks[y][x] == 1) ? colorFg : colorBg;
	context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
}
canvas.onmouseup = function() {
	mouseDown--;
}

var lastX, lastY;
canvas.onmousemove = function(event) {
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

speedSelect.onchange = function() {
	var interval = intervals[speedSelect.value];
	if (!interval)
		return;

	currentInterval = speedSelect.value;
	if (running) {
		clearInterval(loop);
		loop = setInterval(updateAndDraw, interval);
	}
}

window.onkeydown = function(event) {
	var keyCode = event.keyCode || event.which;
	switch (keyCode) {
		case 32: // Space.
			event.preventDefault();
			toggleStart();
			break;
		case 46: // Del.
			event.preventDefault();
			if (!running) {
				resetBlocks();
				generations = 0;
				draw();
			}
			break;
		case 78: // N.
			event.preventDefault();
			updateAndDraw();
			break;
	}
}

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
 * Resets the blocks array, making it larger if needed.
 */
function resetBlocks() {
	for (var i = 0; i < height; i++) {
		if (blocks.length <= i)
			blocks.push([]);
		for (var j = 0; j < width; j++) {
			if (blocks[i].length <= j)
				blocks[i].push(0);
			else
				blocks[i][j] = 0;
		}
	}
}

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
	draw();
}

function draw() {
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
