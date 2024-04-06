import p5 from "p5";
import { cloneDeep } from "lodash";

async function countdownTimer(duration) {
  for (let seconds = duration; seconds > 0; seconds--) {
    console.log("game starts in:", seconds);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function fetchWeapons() {
  const response = await fetch("http://localhost:8080/weapons");
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}

async function selectRandomWeapon(weapons) {
  const randomIndex = Math.floor(Math.random() * weapons.length);
  return weapons[randomIndex].id;
}

async function getInitialGameState(weaponId, windowWidth, windowHeight) {
  const response = await fetch("http://localhost:8080/games", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ weaponId, windowWidth, windowHeight }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  console.log("Weapon selected successfully");

  return response.json();
}

function connectToGameSession(sessionId) {
  const ws = new WebSocket(`ws://localhost:8080/games/${sessionId}`);

  ws.onopen = () => {
    console.log("WebSocket connection established");
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
  };

  return ws;
}

function updatePlayerStats(gameState) {
  if (!gameState) return;
  const {
    player: {
      points: playerPoints,
      hitPoints: playerHp,
      damage: playerDmg,
      ammo: playerAmmo,
      speed: playerSpd,
      reach: playerReach,
    },
  } = gameState;

  document.querySelector(".player-score").innerText = `Player: ${playerPoints}`;
  document.querySelector("#player-hp-real").innerText = playerHp;
  document.querySelector("#player-dmg-real").innerText = playerDmg;
  document.querySelector("#player-ammo-real").innerText = playerAmmo;
  document.querySelector("#player-spd-real").innerText = playerSpd.toFixed(2);
  document.querySelector("#player-reach-real").innerText = playerReach;
  gameState.player.reach;
}

function updateAgentPoints(gameState) {
  if (!gameState) return;

  document.querySelector(".ai-score").innerText =
    `${gameState.agent.points}: AI`;
}

const sketch = (p) => {
  const isMoving = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  let lastSentMousePosition = { x: -1, y: -1 };
  const mousePositionSendThreshold = 10; // px
  const mousePositionSendInterval = 100; // ms
  let mousePositionSendTimer;
  let predictions = [];
  let unappliedStateChanges = [];

  const sendPlayerActionToServer = (type, details) => {
    if (!p.ws) return;

    const clientTimestamp = Date.now();

    predictions.push({ type, details, clientTimestamp });
    p.ws.send(JSON.stringify({ type, ...details, clientTimestamp }));
  };

  const addToUnappliedStateChanges = (gameState, gameStateUpdate) => {
    const diff = gameState.resources.filter(
      ({ id }) => !gameStateUpdate.resources.some((item) => item.id === id),
    );

    unappliedStateChanges.push({
      agent: gameStateUpdate.agent,
      resources: diff,
    });
  };

  const onServerUpdate = (message) => {
    var updatedGameState = JSON.parse(message.data);

    addToUnappliedStateChanges(cloneDeep(p.gameState), updatedGameState);
    reconcileWithServerState(updatedGameState);
    updatePlayerStats(p.gameState);
  };

  const reconcileWithServerState = (gameState) => {
    predictions = predictions.filter(
      (action) => action.timeStamp >= gameState.lastAppliedClientTimestamp,
    );

    const tempGameState = cloneDeep(gameState);
    predictions.forEach((action) => {
      applyPrediction(tempGameState, action);
    });

    const agent = p.gameState.agent;
    p.gameState = tempGameState;
    p.gameState.agent = agent;
  };

  const applyPrediction = (gameState, action) => {
    switch (action.type) {
      case "move":
        gameState.player.x += action.details.dx;
        gameState.player.y += action.details.dy;
        break;
      case "aim":
        gameState.player.mouseX = action.details.mouseX;
        gameState.player.mouseY = action.details.mouseY;
        break;
      case "collect":
        gameState.player.resources = gameState.player.resources.filter(
          (r) => r.id !== action.details.id,
        );
        break;
      case "shoot":
        break;
      default:
        console.error("Unknown action type:", action.type);
    }
  };

  p.preload = async () => {
    p.gameStateLoaded = false;

    await countdownTimer(0);
    const weapons = await fetchWeapons();
    const selectedWeaponId = await selectRandomWeapon(weapons);

    const { offsetWidth: width, offsetHeight: height } =
      document.getElementById("game-canvas");

    let { sessionId, gameState } = await getInitialGameState(
      selectedWeaponId,
      width,
      height,
    );

    updatePlayerStats(gameState);

    p.ws = connectToGameSession(sessionId);
    p.ws.onmessage = (message) => onServerUpdate(message);

    p.gameState = gameState;
    p.gameStateLoaded = true;
  };

  p.setup = () => {
    const { offsetWidth: width, offsetHeight: height } =
      document.getElementById("game-canvas");

    let canvas = p.createCanvas(width, height);
    canvas.parent("game-canvas");
    p.fill(255, 0, 0);

    mousePositionSendTimer = setInterval(
      sendMousePositionUpdate,
      mousePositionSendInterval,
    );
  };

  const sendMousePositionUpdate = () => {
    if (
      p.mouseX !== lastSentMousePosition.x ||
      p.mouseY !== lastSentMousePosition.y
    ) {
      const mousePosition = { x: p.mouseX, y: p.mouseY };

      lastSentMousePosition = mousePosition;
      sendPlayerActionToServer("aim", { mouseX: p.mouseX, mouseY: p.mouseY });
    }
  };

  p.mouseMoved = () => {
    if (
      p.dist(
        p.mouseX,
        p.mouseY,
        lastSentMousePosition.x,
        lastSentMousePosition.y,
      ) > mousePositionSendThreshold
    ) {
      sendMousePositionUpdate();
    }
  };

  function getMovementVector(isMoving, entity) {
    const movementVector = { x: 0, y: 0 };

    if (isMoving.up) movementVector.y -= entity.speed;
    if (isMoving.down) movementVector.y += entity.speed;
    if (isMoving.left) movementVector.x -= entity.speed;
    if (isMoving.right) movementVector.x += entity.speed;

    return movementVector;
  }

  function predictMovementAndSendUpdate(deltaTime) {
    deltaTime = Math.floor(deltaTime);

    const { player } = p.gameState;
    let { x: dx, y: dy } = getMovementVector(isMoving, player);

    if (dx !== 0 && dy !== 0) {
      dx /= Math.sqrt(2);
      dy /= Math.sqrt(2);
    }

    dx *= deltaTime;
    dy *= deltaTime;

    player.x = p.constrain(
      player.x + dx,
      0 + player.hitBox.width / 2,
      p.gameState.zone.width - player.hitBox.width / 2,
    );
    player.y = p.constrain(
      player.y + dy,
      0 + player.hitBox.height / 2,
      p.gameState.zone.height - player.hitBox.height / 2,
    );

    if (dx !== 0 || dy !== 0) {
      sendPlayerActionToServer("move", { dx, dy });
    }
  }

  function updateMovement(keyCode, isPressed) {
    switch (keyCode) {
      case 87: // W
        isMoving.up = isPressed;
        break;
      case 83: // S
        isMoving.down = isPressed;
        break;
      case 65: // A
        isMoving.left = isPressed;
        break;
      case 68: // D
        isMoving.right = isPressed;
        break;
      default: // Do nothing
        break;
    }
  }

  p.keyPressed = () => updateMovement(p.keyCode, true);

  p.keyReleased = () => updateMovement(p.keyCode, false);

  // Rendering logic
  function render() {
    const { player, agent, resources } = p.gameState;

    p.clear();

    if (player) {
      p.ellipse(player.x, player.y, player.hitBox.width, player.hitBox.height);
      drawPlayerAim(player);
    }

    if (agent) {
      p.ellipse(agent.x, agent.y, agent.hitBox.width, agent.hitBox.height);
      drawAgentAim(agent);
    }

    if (resources) {
      const unappliedResources = unappliedStateChanges.flatMap(
        (state) => state.resources,
      );
      console.log(unappliedResources);
      resources.concat(unappliedResources).forEach((resourse) => {
        p.stroke("purple");
        p.strokeWeight(resourse.hitBox.width);
        p.point(resourse.x, resourse.y);
        p.stroke("black");
        p.strokeWeight(1);
      });
    }
  }

  function interpolateAgentPosition(deltaTime) {
    // Convert deltaTime to seconds if needed
    const dtSeconds = Math.floor(deltaTime);
    // Check if there are any updates to interpolate towards
    if (unappliedStateChanges.length > 0) {
      // Get the next update
      const update = unappliedStateChanges[0];
      const agent = p.gameState.agent;
      const targetPos = { x: update.agent.x, y: update.agent.y };
      // Calculate the step based on agent's speed and deltaTime
      const directionX = targetPos.x - agent.x;
      const directionY = targetPos.y - agent.y;

      // Calculate the distance to the target position
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY,
      );

      // Normalize the direction vector
      const dirX = directionX / distance || 0;
      const dirY = directionY / distance || 0;

      // Calculate the step size based on the agent's speed and deltaTime
      const stepSize = agent.speed * dtSeconds;

      // Update the agent's position towards the target
      let newAgentX = agent.x + dirX * stepSize;
      let newAgentY = agent.y + dirY * stepSize;

      p.gameState.agent.x = newAgentX;
      p.gameState.agent.y = newAgentY;

      // Check if the agent has reached the target position
      if (distance <= stepSize) {
        console.log("Agent reached target position");
        p.gameState.agent.x = targetPos.x;
        p.gameState.agent.y = targetPos.y;

        unappliedStateChanges.shift();
        updateAgentPoints(p.gameState);
      }
    }
  }

  // TODO: fix this
  function checkCollisionWithResources(player, resources) {
    for (let resource of resources) {
      if (
        player.x - player.hitBox.width / 2 <=
          resource.x + resource.hitBox.width / 2 &&
        player.x + player.hitBox.width / 2 >=
          resource.x - resource.hitBox.width / 2 &&
        player.y - player.hitBox.height / 2 <=
          resource.y + resource.hitBox.height / 2 &&
        player.y + player.hitBox.height / 2 >=
          resource.y - resource.hitBox.height / 2
      ) {
        sendPlayerActionToServer("collect", resource);
        p.gameState.resources = p.gameState.resources.filter(
          (r) => r.id !== resource.id,
        );
      }
    }
  }

  function drawPlayerAim(entity) {
    // Calculate angle between player position and mouse position
    let angle = p.atan2(p.mouseY - entity.y, p.mouseX - entity.x);

    let radius = entity.hitBox.width / 2; // Assuming hitBox.width is the diameter

    // Calculate the start point of the line at the edge of the player's hitbox
    let startX = entity.x + p.cos(angle) * radius;
    let startY = entity.y + p.sin(angle) * radius;

    // Calculate the end point of the line based on the player's reach
    let endX = startX + p.cos(angle) * entity.reach + radius;
    let endY = startY + p.sin(angle) * entity.reach + radius;
    console.log(endX - startX, endY - startY);

    // Draw the line
    p.stroke("red");
    p.strokeWeight(4);
    p.line(startX, startY, endX, endY);
    p.strokeWeight(1);
    p.stroke("black");
  }

  function drawAgentAim(entity, deltaTime) {
    if (unappliedStateChanges.length > 0) {
      const nextUpdate = unappliedStateChanges[0];
      const targetPos = { x: nextUpdate.agent.x, y: nextUpdate.agent.y };

      // Calculate angle between agent position and interpolated mouse (target) position
      let angle = p.atan2(targetPos.y - entity.y, targetPos.x - entity.x);

      // Calculate the start point of the line based on the agent's edge
      let startX = entity.x + p.cos(angle) * entity.hitBox.width;
      let startY = entity.y + p.sin(angle) * entity.hitBox.height;

      // Future position interpolation for a smoother aim line
      const dtSeconds = Math.floor(deltaTime);
      const directionX = targetPos.x - entity.x;
      const directionY = targetPos.y - entity.y;
      const distance = Math.sqrt(
        directionX * directionX + directionY * directionY,
      );
      const dirX = directionX / distance || 0;
      const dirY = directionY / distance || 0;
      const stepSize = entity.speed * dtSeconds;

      // Calculate a future position based on the current interpolation
      // This is useful if you want the aim line to predict where the agent is aiming, not just point to its current target.
      let futureX = entity.x + dirX * stepSize * 5; // Multiplying stepSize to extend the aim further than just the next step
      let futureY = entity.y + dirY * stepSize * 5;

      // Calculate the end point of the line
      let endX =
        startX + p.cos(angle) * (Math.min(stepSize, distance) + entity.reach);
      let endY =
        startY + p.sin(angle) * (Math.min(stepSize, distance) + entity.reach);

      // Draw the aim line
      p.stroke("blue"); // Different color to distinguish agent's aim
      p.strokeWeight(4);
      p.line(startX, startY, futureX, futureY); // Drawing the line to the future position for visualizing aim direction
      p.strokeWeight(1);
      p.stroke("black");
    }
  }

  // Draw loop
  p.draw = async () => {
    if (!p.gameStateLoaded) {
      return;
    }
    interpolateAgentPosition(p.deltaTime);
    predictMovementAndSendUpdate(p.deltaTime);
    checkCollisionWithResources(p.gameState.player, p.gameState.resources);
    render();
  };

  // Resize canvas
  p.windowResized = () => {
    const { offsetWidth: width, offsetHeight: height } =
      document.getElementById("game-canvas");
    p.resizeCanvas(width, height);
  };

  p.sketchEnded = () => {
    clearInterval(mousePositionSendTimer);
  };
};

new p5(sketch);
