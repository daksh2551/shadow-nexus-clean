"use strict";

const State = {
  MENU: "MENU",
  PLAYING: "PLAYING",
  DEAD: "DEAD",
  COMPLETE: "COMPLETE"
};

let state = State.MENU;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;

const hero = {
  x: 100,
  y: 100,
  r: 22,
  hp: 100,
  speed: 260
};

const portal = {
  x: 500,
  y: 200,
  r: 55,
  active: false
};

let inputX = 0;
let inputY = 0;
let lastTime = performance.now();

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;

  canvas.width = W;
  canvas.height = H;

  resetPositions();
}

function resetPositions() {
  hero.x = W * 0.20;
  hero.y = H * 0.50;

  portal.x = W * 0.82;
  portal.y = H * 0.50;
}

window.addEventListener("resize", resize);
resize();

function setState(next) {
  if (state === next) return;

  console.log("STATE", state, "->", next);

  state = next;

  inputX = 0;
  inputY = 0;

  if (state === State.DEAD) {
    showOverlay("GAME OVER");
  }

  if (state === State.COMPLETE) {
    showOverlay("LEVEL COMPLETE");
  }
}

function startLevel() {
  hero.hp = 100;

  portal.active = false;

  resetPositions();

  hideOverlay();

  setState(State.PLAYING);
}

function update(dt) {
  if (state !== State.PLAYING) return;

  const length = Math.hypot(inputX, inputY);

  if (length > 0) {
    hero.x +=
      (inputX / length) *
      hero.speed *
      dt;

    hero.y +=
      (inputY / length) *
      hero.speed *
      dt;
  }

  hero.x = Math.max(
    hero.r,
    Math.min(W - hero.r, hero.x)
  );

  hero.y = Math.max(
    hero.r,
    Math.min(H - hero.r, hero.y)
  );

  if (hero.hp <= 0) {
    hero.hp = 0;

    setState(State.DEAD);

    return;
  }

  if (portal.active) {
    const distance = Math.hypot(
      hero.x - portal.x,
      hero.y - portal.y
    );

    if (distance <= portal.r) {
      setState(State.COMPLETE);
    }
  }
}

function render() {
  ctx.fillStyle = "#080510";
  ctx.fillRect(0, 0, W, H);

  if (state === State.MENU) {
    drawMenu();
    return;
  }

  drawHUD();
  drawPortal();
  drawHero();
  drawInstructions();
}

function drawMenu() {
  ctx.textAlign = "center";

  ctx.fillStyle = "#ff315e";
  ctx.font = "bold 42px Arial";

  ctx.fillText(
    "SHADOW NEXUS 2",
    W / 2,
    H * 0.32
  );

  ctx.fillStyle = "#cfc3dd";
  ctx.font = "15px Arial";

  ctx.fillText(
    "CLEAN PERFORMANCE BUILD",
    W / 2,
    H * 0.42
  );

  ctx.fillStyle = "#251634";

  ctx.fillRect(
    W * 0.32,
    H * 0.53,
    W * 0.36,
    58
  );

  ctx.strokeStyle = "#ffd43b";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    W * 0.32,
    H * 0.53,
    W * 0.36,
    58
  );

  ctx.fillStyle = "white";
  ctx.font = "bold 18px Arial";

  ctx.fillText(
    "START",
    W / 2,
    H * 0.53 + 36
  );
}

function drawHero() {
  ctx.fillStyle = "#19dbea";

  ctx.beginPath();

  ctx.arc(
    hero.x,
    hero.y,
    hero.r,
    0,
    Math.PI * 2
  );

  ctx.fill();
}

function drawPortal() {
  ctx.strokeStyle =
    portal.active
      ? "#ffd52f"
      : "#51485d";

  ctx.lineWidth = 7;

  ctx.beginPath();

  ctx.arc(
    portal.x,
    portal.y,
    portal.r,
    0,
    Math.PI * 2
  );

  ctx.stroke();

  ctx.fillStyle =
    portal.active
      ? "#ffd52f"
      : "#777080";

  ctx.textAlign = "center";
  ctx.font = "bold 12px Arial";

  ctx.fillText(
    portal.active
      ? "EXIT"
      : "LOCKED",
    portal.x,
    portal.y + 4
  );
}

function drawHUD() {
  ctx.textAlign = "left";
  ctx.fillStyle = "white";
  ctx.font = "bold 15px Arial";

  ctx.fillText(
    "HP " + hero.hp + "/100",
    20,
    30
  );
}

function drawInstructions() {
  ctx.textAlign = "right";
  ctx.font = "12px Arial";
  ctx.fillStyle = "#bfb5ca";

  ctx.fillText(
    "Upper-right: unlock portal",
    W - 20,
    28
  );

  ctx.fillText(
    "Lower-right: kill hero",
    W - 20,
    48
  );
}

function showOverlay(title) {
  hideOverlay();

  const overlay =
    document.createElement("div");

  overlay.id = "state-overlay";

  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "9000";
  overlay.style.background =
    "rgba(5,3,12,.94)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.color = "white";

  const heading =
    document.createElement("h1");

  heading.textContent = title;
  heading.style.color = "#ff315e";

  const retry =
    document.createElement("button");

  retry.textContent = "RETRY";

  retry.style.width = "240px";
  retry.style.height = "54px";
  retry.style.margin = "8px";
  retry.style.background = "#241532";
  retry.style.color = "white";
  retry.style.border =
    "1px solid #ffd43b";

  retry.onclick = startLevel;

  const menu =
    document.createElement("button");

  menu.textContent = "MAIN MENU";

  menu.style.width = "240px";
  menu.style.height = "54px";
  menu.style.margin = "8px";
  menu.style.background = "#241532";
  menu.style.color = "white";
  menu.style.border =
    "1px solid #ffd43b";

  menu.onclick = function () {
    hideOverlay();
    setState(State.MENU);
  };

  overlay.appendChild(heading);
  overlay.appendChild(retry);
  overlay.appendChild(menu);

  document.body.appendChild(overlay);
}

function hideOverlay() {
  const old =
    document.getElementById(
      "state-overlay"
    );

  if (old) old.remove();
}

canvas.addEventListener(
  "pointerdown",
  function (event) {
    const x = event.clientX;
    const y = event.clientY;

    if (state === State.MENU) {
      if (
        x > W * 0.32 &&
        x < W * 0.68 &&
        y > H * 0.50 &&
        y < H * 0.75
      ) {
        startLevel();
      }

      return;
    }

    if (state !== State.PLAYING) {
      return;
    }

    if (x > W * 0.65) {
      if (y < H * 0.5) {
        portal.active = true;
      } else {
        hero.hp = 0;
      }

      return;
    }

    const centerX = W * 0.25;
    const centerY = H * 0.60;

    inputX = x - centerX;
    inputY = y - centerY;
  }
);

window.addEventListener(
  "pointerup",
  function () {
    inputX = 0;
    inputY = 0;
  }
);

window.addEventListener(
  "pointercancel",
  function () {
    inputX = 0;
    inputY = 0;
  }
);

function loop(now) {
  const dt = Math.min(
    (now - lastTime) / 1000,
    0.05
  );

  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

console.log("SN2 v0.0.2 boot");

requestAnimationFrame(loop);
