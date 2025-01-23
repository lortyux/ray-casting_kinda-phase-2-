
let walls = [];
let mazeGridSize = 10;
let mazeSizeFactor = 0.8;

let start, end;
let gameStarted = false;
let winMessageShown = false;
let particles = [];

let perimeterPoints = [];

let particleSpeed = 2;
let rayCount = 36;
let rayLength = 200; // First level ray length
let rayEndpointSize = 15; // Increased ray endpoint size

let blueSquare = {
  x: 0,
  y: 0,
  width: 45,
  height: 45,
  dragging: false,
  offsetX: 0,
  offsetY: 0,
};

let gameOver = false;

let currentLevel = 1; // Variable to track the current level

let restartButtonWidth = 150;
let restartButtonHeight = 50;
let restartButtonTextSize = 24;

let restartButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  createMaze(mazeGridSize, mazeSizeFactor);

  calculatePerimeterPoints();

  // Store initial blue square position
  resetBlueSquarePosition();

  restartButton = createButton('Restart');
  restartButton.position(width / 2 - restartButtonWidth / 2, height / 2 + 50);
  restartButton.size(restartButtonWidth, restartButtonHeight);
  restartButton.mousePressed(restartGame);
  restartButton.style('font-size', restartButtonTextSize + 'px');
  restartButton.hide();

  // Initialize the particles and rays for the first time
  particles.push(new Particle(perimeterPoints, particleSpeed));
}

function draw() {
  background(0);

  if (gameOver) {
    fill(255, 0, 0);
    textSize(48);
    textAlign(CENTER, CENTER);
    text("GAME OVER!", width / 2, height / 2);
    restartButton.show();
    return;
  }

  for (let wall of walls) {
    wall.show();
  }

  fill(0, 255, 0);
  noStroke();
  ellipse(start.x, start.y, 20, 20);
  fill(255, 0, 0);
  ellipse(end.x, end.y, 20, 20);

  fill(0, 0, 255);
  noStroke();
  rect(blueSquare.x, blueSquare.y, blueSquare.width, blueSquare.height);

  for (let particle of particles) {
    particle.move();
    particle.show();

    if (particle.checkCollisionWithBlueSquare()) {
      gameOver = true;
      restartButton.show(); // Show the restart button when game is over
      return;
    }
  }

  if (gameStarted && !winMessageShown) {
    let distToEnd = dist(
      blueSquare.x + blueSquare.width / 2,
      blueSquare.y + blueSquare.height / 2,
      end.x,
      end.y
    );
    if (distToEnd < blueSquare.width / 2 + 10) { // Collision detection with red ellipse
      winMessageShown = true;
      noLoop();
      alert("You Win! The blue square touched the red ellipse.");
      nextLevel(); // Transition to next level when win condition is met
    }
  }
}

function nextLevel() {
  if (currentLevel === 1) {  // Proceed to level 2 after completing level 1
    currentLevel++;
    updateLevelSettings();
    resetBlueSquarePosition();  // Reset blue square position to start for new level
    particles = [];  // Clear the previous level particles to respawn new ones
    particles.push(new Particle(perimeterPoints, particleSpeed));  // Respawn particles
    restartButton.hide(); // Hide restart button after winning
    gameOver = false; // Reset game over state
    gameStarted = false; // Reset game start state
    loop();  // Resume the loop after winning
  } else {
    alert("You've completed Level 2!");
    noLoop(); // Stop the game when Level 2 is completed
  }
}

function updateLevelSettings() {
  if (currentLevel === 1) {
    mazeGridSize = 10;
    rayLength = 300;
    particleSpeed = 2;

  } else if (currentLevel === 2) {
    mazeGridSize = 7; // Level 2 uses a smaller grid size
    rayLength = 300;  // Longer ray length for level 2
    particleSpeed = 5;

  }
  createMaze(mazeGridSize, mazeSizeFactor); // Recreate maze with updated grid size
}

function resetBlueSquarePosition() {
  // Set the initial position of the blue square to the start point
  blueSquare.x = start.x - blueSquare.width / 2;
  blueSquare.y = start.y - blueSquare.height / 2;
}

function mousePressed() {
  // The game only starts when the user clicks on the blue square
  if (!gameStarted && mouseX > blueSquare.x && mouseX < blueSquare.x + blueSquare.width && mouseY > blueSquare.y && mouseY < blueSquare.y + blueSquare.height) {
    gameStarted = true;
  }

  if (
    mouseX > blueSquare.x &&
    mouseX < blueSquare.x + blueSquare.width &&
    mouseY > blueSquare.y &&
    mouseY < blueSquare.y + blueSquare.height
  ) {
    blueSquare.dragging = true;
    blueSquare.offsetX = mouseX - blueSquare.x;
    blueSquare.offsetY = mouseY - blueSquare.y;
  }
}

function mouseReleased() {
  blueSquare.dragging = false;
}

function mouseDragged() {
  if (blueSquare.dragging) {
    let newX = mouseX - blueSquare.offsetX;
    let newY = mouseY - blueSquare.offsetY;

    if (!isCollidingWithWall(newX, newY)) {
      blueSquare.x = newX;
      blueSquare.y = newY;
    }
  }
}

function isCollidingWithWall(x, y) {
  for (let wall of walls) {
    if (
      x + blueSquare.width > wall.x1 &&
      x < wall.x2 &&
      y + blueSquare.height > wall.y1 &&
      y < wall.y2
    ) {
      return true;
    }
  }
  return false;
}

class Boundary {
  constructor(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }

  show() {
    stroke(255);
    line(this.x1, this.y1, this.x2, this.y2);
  }
}

class Particle {
  constructor(perimeterPoints, speed) {
    this.pos = createVector(perimeterPoints[0].x, perimeterPoints[0].y);
    this.perimeterPoints = perimeterPoints;
    this.speed = speed;
    this.currentIndex = 0;
    this.color = color(255, 255, 0); // Set particle color
    this.size = 10; // Set particle size
  }

  move() {
    let targetPoint = this.perimeterPoints[this.currentIndex];
    let dir = createVector(targetPoint.x - this.pos.x, targetPoint.y - this.pos.y);
    dir.normalize().mult(this.speed);
    this.pos.add(dir);

    // Ensure the particle doesn't move past the perimeter (maze boundary)
    if (this.pos.x < perimeterPoints[0].x) this.pos.x = perimeterPoints[0].x;
    if (this.pos.x > perimeterPoints[1].x) this.pos.x = perimeterPoints[1].x;
    if (this.pos.y < perimeterPoints[0].y) this.pos.y = perimeterPoints[0].y;
    if (this.pos.y > perimeterPoints[2].y) this.pos.y = perimeterPoints[2].y;

    if (dist(this.pos.x, this.pos.y, targetPoint.x, targetPoint.y) < this.speed) {
      this.currentIndex = (this.currentIndex + 1) % this.perimeterPoints.length;
    }
  }

  show() {
    fill(this.color);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.size, this.size);

    for (let angle = 0; angle < TWO_PI; angle += TWO_PI / rayCount) {
      let dir = createVector(cos(angle), sin(angle));
      let ray = new Ray(this.pos, dir, this.color, this.size); // Pass particle's color and size
      ray.cast();
    }
  }

  checkCollisionWithBlueSquare() {
    if (
      this.pos.x > blueSquare.x &&
      this.pos.x < blueSquare.x + blueSquare.width &&
      this.pos.y > blueSquare.y &&
      this.pos.y < blueSquare.y + blueSquare.height
    ) {
      return true;
    }

    for (let angle = 0; angle < TWO_PI; angle += TWO_PI / rayCount) {
      let dir = createVector(cos(angle), sin(angle));
      let ray = new Ray(this.pos, dir, this.color, this.size);
      if (ray.hitsBlueSquare()) {
        return true;
      }
    }

    return false;
  }
}

class Ray {
  constructor(pos, dir, color, size) {
    this.pos = pos;
    this.dir = dir;
    this.color = color;
    this.size = size;
  }

  cast() {
    let closest = null;
    let record = rayLength;

    // Cast ray along the maze perimeter, ensuring the ray can't pass through it
    const perimeterLimit = perimeterPoints[1];
    const bounds = { xMin: perimeterPoints[0].x, xMax: perimeterPoints[1].x, yMin: perimeterPoints[0].y, yMax: perimeterPoints[2].y };
    let boundaryX = constrain(this.pos.x + this.dir.x * rayLength, bounds.xMin, bounds.xMax);
    let boundaryY = constrain(this.pos.y + this.dir.y * rayLength, bounds.yMin, bounds.yMax);

    // Find the closest point along the boundary
    closest = createVector(boundaryX, boundaryY);

    // Draw the ray and endpoint
    stroke(255, 100);
    line(this.pos.x, this.pos.y, closest.x, closest.y);

    fill(this.color);
    noStroke();
    ellipse(closest.x, closest.y, this.size, this.size);

    if (
      closest.x > blueSquare.x &&
      closest.x < blueSquare.x + blueSquare.width &&
      closest.y > blueSquare.y &&
      closest.y < blueSquare.y + blueSquare.height
    ) {
      gameOver = true;
      restartButton.show(); // Show the restart button when game is over
      return;
    }
  }

  hitsBlueSquare() {
    const { x, y, width, height } = blueSquare;
    const distance = dist(this.pos.x, this.pos.y, x + width / 2, y + height / 2);
    return distance < (rayEndpointSize / 2 + width / 2);
  }
}

function calculatePerimeterPoints() {
  let mazeWidth = width * mazeSizeFactor;
  let mazeHeight = height * mazeSizeFactor;
  let xOffset = (width - mazeWidth) / 2;
  let yOffset = (height - mazeHeight) / 2;

  perimeterPoints = [
    createVector(xOffset, yOffset),
    createVector(xOffset + mazeWidth, yOffset),
    createVector(xOffset + mazeWidth, yOffset + mazeHeight),
    createVector(xOffset, yOffset + mazeHeight),
  ];
}

function createMaze(gridSize, sizeFactor) {
  let mazeWidth = width * sizeFactor;
  let mazeHeight = height * sizeFactor;
  let cellWidth = mazeWidth / gridSize;
  let cellHeight = mazeHeight / gridSize;

  let grid = [];
  let stack = [];

  let xOffset = (width - mazeWidth) / 2;
  let yOffset = (height - mazeHeight) / 2;

  for (let i = 0; i < gridSize; i++) {
    grid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      grid[i][j] = {
        x: i,
        y: j,
        walls: [true, true, true, true],
        visited: false,
      };
    }
  }

  let current = grid[gridSize - 1][0];
  current.visited = true;
  stack.push(current);

  while (stack.length > 0) {
    let next = getUnvisitedNeighbor(current, grid, gridSize);

    if (next) {
      next.visited = true;
      removeWalls(current, next);
      stack.push(current);
      current = next;
    } else {
      current = stack.pop();
    }
  }

  walls = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      let cell = grid[i][j];
      let x = xOffset + cell.x * cellWidth;
      let y = yOffset + cell.y * cellHeight;

      if (cell.walls[0]) walls.push(new Boundary(x, y, x + cellWidth, y));
      if (cell.walls[1]) walls.push(new Boundary(x + cellWidth, y, x + cellWidth, y + cellHeight));
      if (cell.walls[2]) walls.push(new Boundary(x, y + cellHeight, x + cellWidth, y + cellHeight));
      if (cell.walls[3]) walls.push(new Boundary(x, y, x, y + cellHeight));
    }
  }

  start = createVector(xOffset + cellWidth / 2, yOffset + (gridSize - 1) * cellHeight + cellHeight / 2);
  end = createVector(xOffset + (gridSize - 1) * cellWidth + cellWidth / 2, yOffset + cellHeight / 2);
}

function getUnvisitedNeighbor(current, grid, gridSize) {
  let x = current.x;
  let y = current.y;
  let neighbors = [];

  if (x > 0 && !grid[x - 1][y].visited) neighbors.push(grid[x - 1][y]);
  if (x < gridSize - 1 && !grid[x + 1][y].visited) neighbors.push(grid[x + 1][y]);
  if (y > 0 && !grid[x][y - 1].visited) neighbors.push(grid[x][y - 1]);
  if (y < gridSize - 1 && !grid[x][y + 1].visited) neighbors.push(grid[x][y + 1]);

  if (neighbors.length > 0) {
    return random(neighbors);
  } else {
    return undefined;
  }
}

function removeWalls(current, next) {
  let x = current.x - next.x;
  if (x === 1) {
    current.walls[3] = false;
    next.walls[1] = false;
  } else if (x === -1) {
    current.walls[1] = false;
    next.walls[3] = false;
  }

  let y = current.y - next.y;
  if (y === 1) {
    current.walls[0] = false;
    next.walls[2] = false;
  } else if (y === -1) {
    current.walls[2] = false;
    next.walls[0] = false;
  }
}

function restartGame() {
  // Restart the game logic
  currentLevel = 1;
  resetBlueSquarePosition();
  walls = [];
  createMaze(mazeGridSize, mazeSizeFactor);
  gameOver = false;
  winMessageShown = false;
  gameStarted = false;
  particles = [];
  particles.push(new Particle(perimeterPoints, particleSpeed));  // Respawn particles
  restartButton.hide();
  loop();  // Start the game loop again
}