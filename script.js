// Game settings
const GOAL_DROPS = 20;
const GAME_SECONDS = 30;
const SPAWN_DELAY = 1000;

// Game state
let score = 0;
let gameActive = false;
let activeCell = -1;
let obstacleCell = -1;
let spawnInterval;
let timerInterval;
let endTime;
let confettiTimeout;

// Page elements
const grid = document.querySelector(".game-grid");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const messageDisplay = document.getElementById("message");
const startButton = document.getElementById("start-game");
const resetButton = document.getElementById("reset-game");

// Possible end-of-game messages
const winningMessages = [
  "You did it! Great water-collecting skills!",
  "Amazing work! You reached the collection goal!",
  "Goal reached! Thanks for playing Whack-A-Water!"
];

const losingMessages = [
  "Almost there! Try again and aim for 20 drops.",
  "Keep practicing! Another round awaits.",
  "Time's up! Give it another try."
];

// Build the 3x3 board
function createGrid() {
  grid.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("button");

    cell.type = "button";
    cell.className = "grid-cell";
    cell.setAttribute("aria-label", `Empty square ${i + 1}`);
    cell.disabled = true;

    cell.addEventListener("click", () => handleCellClick(i));

    grid.appendChild(cell);
  }
}

// Clear all drops and obstacles
function clearBoard() {
  activeCell = -1;
  obstacleCell = -1;

  Array.from(grid.children).forEach((cell, index) => {
    cell.innerHTML = "";
    cell.classList.remove("has-drop", "has-obstacle");
    cell.setAttribute("aria-label", `Empty square ${index + 1}`);
  });
}

// Spawn one water drop and one obstacle in different squares
function spawnItems() {
  if (!gameActive) return;

  clearBoard();

  activeCell = Math.floor(Math.random() * 9);

  do {
    obstacleCell = Math.floor(Math.random() * 9);
  } while (obstacleCell === activeCell);

  const drop = grid.children[activeCell];
  drop.classList.add("has-drop");
  drop.setAttribute("aria-label", "Collect water drop: gain one point");

  drop.innerHTML = `
    <svg class="water-drop" viewBox="0 0 64 80"
         aria-hidden="true" focusable="false">
      <path d="M32 4 C26 19 7 35 7 51
               A25 25 0 0 0 57 51
               C57 35 38 19 32 4Z"
            fill="currentColor"/>
      <path d="M18 49 Q15 59 25 64"
            fill="none" stroke="white"
            stroke-width="5" stroke-linecap="round"/>
    </svg>
  `;

  const obstacle = grid.children[obstacleCell];
  obstacle.classList.add("has-obstacle");
  obstacle.setAttribute(
    "aria-label",
    "Warning obstacle: lose one point"
  );

  obstacle.innerHTML = `
    <span class="obstacle-icon" aria-hidden="true">⚠</span>
  `;
}

// Handle clicks on drops, obstacles, and empty squares
function handleCellClick(index) {
  if (!gameActive) return;

  if (Date.now() >= endTime) {
    endGame();
    return;
  }

  if (index === activeCell) {
    score++;
    messageDisplay.textContent = "Nice catch! +1 point";
    messageDisplay.className = "";
  } else if (index === obstacleCell) {
    const penalty = score > 0 ? 1 : 0;
    score = Math.max(0, score - 1);

    messageDisplay.textContent = penalty
      ? "Obstacle hit! −1 point. Aim for the blue drops."
      : "Obstacle hit! Your score stays at 0.";

    messageDisplay.className = "try-again";
  } else {
    return;
  }

  scoreDisplay.textContent = score;

  // Stop immediately at 20 points and trigger the win celebration.
  if (score >= GOAL_DROPS) {
    endGame();
    return;
  }

  clearInterval(spawnInterval);
  spawnItems();
  spawnInterval = setInterval(spawnItems, SPAWN_DELAY);
}

// Start a new round
function startGame() {
  if (gameActive) return;

  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  removeConfetti();

  score = 0;
  gameActive = true;
  endTime = Date.now() + GAME_SECONDS * 1000;

  scoreDisplay.textContent = "0";
  timerDisplay.textContent = GAME_SECONDS;
  messageDisplay.textContent = "Collect blue drops. Avoid red warnings!";
  messageDisplay.className = "";

  startButton.disabled = true;
  startButton.textContent = "Game in progress";

  Array.from(grid.children).forEach(cell => {
    cell.disabled = false;
  });

  spawnItems();
  spawnInterval = setInterval(spawnItems, SPAWN_DELAY);

  timerInterval = setInterval(() => {
    const secondsLeft = Math.max(
      0,
      Math.ceil((endTime - Date.now()) / 1000)
    );

    timerDisplay.textContent = secondsLeft;

    if (secondsLeft === 0) {
      endGame();
    }
  }, 100);
}

// End the round and check the final score
function endGame() {
  if (!gameActive) return;

  gameActive = false;

  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearBoard();

  timerDisplay.textContent = Math.max(
    0,
    Math.ceil((endTime - Date.now()) / 1000)
  );

  Array.from(grid.children).forEach(cell => {
    cell.disabled = true;
  });

  const won = score >= GOAL_DROPS;
  const messages = won ? winningMessages : losingMessages;
  const randomMessage =
    messages[Math.floor(Math.random() * messages.length)];

  messageDisplay.textContent =
    `${randomMessage} Final score: ${score}.`;

  messageDisplay.className = won ? "win" : "try-again";

  startButton.disabled = false;
  startButton.textContent = "Play Again";

  if (won) {
    celebrateWin();
  }
}

// Restart immediately, including during an active round
function resetGame() {
  gameActive = false;

  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  clearBoard();
  removeConfetti();

  startGame();
}

// Show a short confetti celebration
function celebrateWin() {
  removeConfetti();

  const layer = document.createElement("div");
  layer.id = "confetti-layer";
  layer.setAttribute("aria-hidden", "true");

  const colors = ["#FFC907", "#2E9DF7", "#4FCB53", "#FF902A"];
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  for (let i = 0; i < 70; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];

    if (reduceMotion) {
      // Display stationary confetti for reduced-motion users
      piece.style.top = `${Math.random() * 100}%`;
    } else {
      piece.style.animationDelay = `${Math.random() * 0.6}s`;
      piece.style.animationDuration = `${2 + Math.random()}s`;
    }

    layer.appendChild(piece);
  }

  document.body.appendChild(layer);
  confettiTimeout = setTimeout(removeConfetti, 4000);
}

// Remove any previous celebration
function removeConfetti() {
  clearTimeout(confettiTimeout);
  document.getElementById("confetti-layer")?.remove();
}

// Initialize the page
createGrid();
startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);