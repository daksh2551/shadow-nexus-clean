"use strict";

(() => {
  const BUILD = "0.0.2";

  const GameState = Object.freeze({
    MENU: "MENU",
    PLAYING: "PLAYING",
    PLAYER_DEAD: "PLAYER_DEAD",
    LEVEL_COMPLETE: "LEVEL_COMPLETE"
  });

  let gameState = GameState.MENU;

  const canvas = document.getElementById("game");

  const ctx = canvas.getContext("2d", {
    alpha: false
  });

  if (!ctx) {
    throw new Error("Unable to create 2D canvas.");
  }

  let W = 1;
  let H = 1;

  const player = {
    x: 100,
    y: 100,
    radius: 22,
    speed: 260,
    hp: 100,
    maxHp: 100
  };

  const portal = {
    x: 500,
    y: 200,
    radius: 55,
    active: false
  };

  const input = {
    x: 0,
    y: 0
  };

  let enemiesRemaining = 1;
  let menuButton = null;

  let lastTime = performance.now();

  function resize() {
    W = Math.max(1, window.innerWidth);
    H = Math.max(1, window.innerHeight);

    // Deliberately render at CSS resolution.
    // No high-DPI multiplier for this performance baseline.
    canvas.width = W;
    canvas.height = H;

    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;

    if (gameState !== GameState.PLAYING) {
      resetPositions();
    }
  }

  function resetPositions() {
    player.x = W * 0.20;
    player.y = H * 0.50;

    portal.x = W * 0.82;
    portal.y = H * 0.50;
  }

  window.addEventListener("resize", resize);
  resize();

  function setGameState(next) {
    if (next === gameState) return;

    console.log(
      `[SN2] ${gameState} -> ${next}`
    );

    gameState = next;
    clearInput();

    if (next === GameState.PLAYING) {
      hideOverlay();
    }

    if (next === GameState.PLAYER_DEAD) {
      showOverlay(
        "GAME OVER",
        "Death state works.",
        [
          ["RETRY", resetLevel],
          ["MAIN MENU", () =>
            setGameState(GameState.MENU)]
        ]
      );
    }

    if (next === GameState.LEVEL_COMPLETE) {
      showOverlay(
        "LEVEL COMPLETE",
        "Portal state works.",
        [
          ["RETRY TEST", resetLevel],
          ["MAIN MENU", () =>
            setGameState(GameState.MENU)]
        ]
      );
    }
  }

  function resetLevel() {
    resetPositions();

    player.hp = player.maxHp;

    portal.active = false;
    enemiesRemaining = 1;

    setGameState(GameState.PLAYING);
  }

  function clearInput() {
    input.x = 0;
    input.y = 0;
  }

  function update(dt) {
    if (gameState !== GameState.PLAYING) {
      return;
    }

    if (input.x || input.y) {
      const len =
        Math.hypot(input.x, input.y) || 1;

      player.x +=
        (input.x / len) *
        player.speed *
        dt;

      player.y +=
        (input.y / len) *
        player.speed *
        dt;
    }

    player.x = clamp(
      player.x,
      player.radius,
      W - player.radius
    );

    player.y = clamp(
      player.y,
      player.radius,
      H - player.radius
    );

    if (player.hp <= 0) {
      player.hp = 0;
      setGameState(GameState.PLAYER_DEAD);
      return;
    }

    if (enemiesRemaining <= 0) {
      portal.active = true;
    }

    if (portal.active) {
      const distance = Math.hypot(
        player.x - portal.x,
        player.y - portal.y
      );

      if (distance <= portal.radius) {
        setGameState(
          GameState.LEVEL_COMPLETE
        );
      }
    }
  }

  function render() {
    ctx.fillStyle = "#090611";
    ctx.fillRect(0, 0, W, H);

    // Simple static-looking arena.
    ctx.fillStyle = "#110b20";
    ctx.fillRect(
      0,
      H * 0.18,
      W,
      H * 0.64
    );

    if (gameState === GameState.MENU) {
      renderMenu();
      return;
    }

    renderPortal();
    renderPlayer();
    renderHUD();
    renderTestLabels();
  }

  function renderPlayer() {
    ctx.fillStyle = "#18dcea";

    ctx.beginPath();

    ctx.arc(
      player.x,
      player.y,
      player.radius,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#071015";
    ctx.font = "bold 11px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "HERO",
      player.x,
      player.y + 4
    );
  }

  function renderPortal() {
    ctx.strokeStyle =
      portal.active
        ? "#ffd52f"
        : "#4b4358";

    ctx.lineWidth = 7;

    ctx.beginPath();

    ctx.arc(
      portal.x,
      portal.y,
      portal.radius,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.fillStyle =
      portal.active
        ? "#ffe875"
        : "#746b80";

    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
      portal.active
        ? "EXIT"
        : "LOCKED",
      portal.x,
      portal.y + 4
    );
  }

  function renderHUD() {
    const barW = Math.min(250, W * 0.28);

    ctx.fillStyle = "#1d1726";
    ctx.fillRect(
      20,
      20,
      barW,
      16
    );

    ctx.fillStyle = "#ff426d";

    ctx.fillRect(
      20,
      20,
      barW *
        (player.hp / player.maxHp),
      16
    );

    ctx.fillStyle = "white";

    ctx.font = "bold 13px Arial";
    ctx.textAlign = "left";

    ctx.fillText(
      `HP ${player.hp}/${player.maxHp}`,
      20,
      55
    );
  }

  function renderTestLabels() {
    ctx.fillStyle = "#b9aec5";
    ctx.font = "12px Arial";

    ctx.textAlign = "right";

    ctx.fillText(
      "UPPER RIGHT: unlock portal",
      W - 20,
      30
    );

    ctx.fillText(
      "LOWER RIGHT: take lethal damage",
      W - 20,
      50
    );
  }

  function renderMenu() {
    const short = H < 500;

    ctx.textAlign = "center";

    ctx.fillStyle = "#ff315e";

    ctx.font =
      `900 ${short ? 38 : 58}px Arial`;

    ctx.fillText(
      "SHADOW NEXUS 2",
      W / 2,
      H * 0.30
    );

    ctx.fillStyle = "#c7b9d7";

    ctx.font =
      `${short ? 13 : 18}px Arial`;

    ctx.fillText(
      "PERFORMANCE BASELINE",
      W / 2,
      H * 0.40
    );

    const bw = Math.min(
      380,
      W * 0.52
    );

    const bh = short ? 54 : 66;

    const bx = (W - bw) / 2;
    const by = H * 0.52;

    ctx.fillStyle = "#241532";

    ctx.fillRect(
      bx,
      by,
      bw,
      bh
    );

    ctx.strokeStyle = "#ffd43b";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      bx,
      by,
      bw,
      bh
    );

    ctx.fillStyle = "white";

    ctx.font =
      `bold ${short ? 18 : 22}px Arial`;

    ctx.fillText(
      "START SYSTEM TEST",
      W / 2,
      by + bh / 2 + 7
    );

    menuButton = {
      x: bx,
      y: by,
      w: bw,
      h: bh
    };
  }

  function showOverlay(
    title,
    message,
    buttons
  ) {
    hideOverlay();

    const overlay =
      document.createElement("div");

    overlay.id = "state-overlay";

    Object.assign(
      overlay.style,
      {
        position: "fixed",
        inset: "0",
        zIndex: "9000",
        background:
          "rgba(5,3,12,.94)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        padding: "16px"
      }
    );

    const h =
      document.createElement("h1");

    h.textContent = title;

    h.style.margin = "0 0 8px";
    h.style.color = "#ff315e";

    h.style.fontSize =
      "clamp(30px,7vw,54px)";

    overlay.appendChild(h);

    const p =
      document.createElement("p");

    p.textContent = message;
    p.style.color = "#cbbddd";

    overlay.appendChild(p);

    buttons.forEach(
      ([label, action]) => {
        const button =
          document.createElement(
            "button"
          );

        button.textContent = label;

        Object.assign(
          button.style,
          {
            width:
              "min(340px,70vw)",
            minHeight: "50px",
            margin: "6px",
            border:
              "1px solid #ffd43b",
            background: "#221330",
            color: "white",
            borderRadius: "12px",
            fontWeight: "bold"
          }
        );

        button.onclick = action;

        overlay.appendChild(
          button
        );
      }
    );

    document.body.appendChild(
      overlay
    );
  }

  function hideOverlay() {
    document
      .getElementById(
        "state-overlay"
      )
      ?.remove();
  }

  function clamp(
    value,
    min,
    max
  ) {
    return Math.max(
      min,
      Math.min(max, value)
    );
  }

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      const x = event.clientX;
      const y = event.clientY;

      if (
        gameState ===
        GameState.MENU
      ) {
        if (
          menuButton &&
          x >= menuButton.x &&
          x <=
            menuButton.x +
            menuButton.w &&
          y >= menuButton.y &&
          y <=
            menuButton.y +
            menuButton.h
        ) {
          resetLevel();
        }

        return;
      }

      if (
        gameState !==
        GameState.PLAYING
      ) {
        return;
      }

      if (x < W * 0.62) {
        const cx = W * 0.24;
        const cy = H * 0.62;

        input.x = x - cx;
        input.y = y - cy;
      } else {
        if (y < H * 0.5) {
          enemiesRemaining = 0;
          portal.active = true;
        } else {
          player.hp = 0;
        }
      }
    }
  );

  window.addEventListener(
    "pointerup",
    clearInput
  );

  window.addEventListener(
    "pointercancel",
    clearInput
  );

  function frame(now) {
    const dt = Math.min(
      (now - lastTime) / 1000,
      0.05
    );

    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(frame);
  }

  console.log(
    `[SN2] Build ${BUILD}`
  );

  requestAnimationFrame(frame);
})();    return Math.min(window.devicePixelRatio || 1, 1.5);
  }

  function resize() {
    const pixelRatio = dpr();

    const cssWidth = Math.max(1, window.innerWidth);
    const cssHeight = Math.max(1, window.innerHeight);

    canvas.width = Math.round(cssWidth * pixelRatio);
    canvas.height = Math.round(cssHeight * pixelRatio);

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    ctx.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0
    );

    if (gameState !== GameState.PLAYING) {
      player.x = cssWidth * 0.22;
      player.y = cssHeight * 0.5;

      portal.x = cssWidth * 0.82;
      portal.y = cssHeight * 0.5;
    }
  }

  window.addEventListener("resize", resize);
  resize();

  function update(dt) {
    if (gameState !== GameState.PLAYING) return;

    let dx = 0;
    let dy = 0;

    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      player.x += dx * player.speed * dt;
      player.y += dy * player.speed * dt;
    }

    player.x = clamp(
      player.x,
      player.radius,
      window.innerWidth - player.radius
    );

    player.y = clamp(
      player.y,
      player.radius,
      window.innerHeight - player.radius
    );

    if (player.hp <= 0) {
      player.hp = 0;
      setGameState(GameState.PLAYER_DEAD);
      return;
    }

    if (enemiesRemaining <= 0) {
      portal.active = true;
    }

    if (portal.active) {
      const distance = Math.hypot(
        player.x - portal.x,
        player.y - portal.y
      );

      if (distance <= portal.radius) {
        setGameState(GameState.LEVEL_COMPLETE);
      }
    }
  }

  function render() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "#17102b");
    gradient.addColorStop(1, "#080612");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    drawGrid(w, h);

    if (
      gameState === GameState.PLAYING ||
      gameState === GameState.PLAYER_DEAD ||
      gameState === GameState.LEVEL_COMPLETE
    ) {
      drawPortal();
      drawPlayer();
      drawHUD();
      drawControls();
    }

    if (gameState === GameState.MENU) {
      drawMenu(w, h);
    }
  }

  function drawGrid(w, h) {
    ctx.strokeStyle = "rgba(100, 75, 160, 0.15)";
    ctx.lineWidth = 1;

    const gap = 48;

    for (let x = 0; x <= w; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += gap) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function drawPlayer() {
    ctx.save();

    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = 18;

    ctx.fillStyle = "#12dff3";
    ctx.beginPath();
    ctx.arc(
      player.x,
      player.y,
      player.radius,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = "#09151c";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("HERO", player.x, player.y);
  }

  function drawPortal() {
    ctx.save();

    ctx.globalAlpha = portal.active ? 1 : 0.25;

    ctx.strokeStyle = portal.active
      ? "#ffd92f"
      : "#625676";

    ctx.lineWidth = 9;

    ctx.shadowColor = portal.active
      ? "#ffd92f"
      : "transparent";

    ctx.shadowBlur = portal.active ? 20 : 0;

    ctx.beginPath();
    ctx.arc(
      portal.x,
      portal.y,
      portal.radius,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    ctx.restore();

    ctx.fillStyle = portal.active
      ? "#fff2a0"
      : "#8b8294";

    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      portal.active ? "EXIT" : "LOCKED",
      portal.x,
      portal.y + 4
    );
  }

  function drawHUD() {
    const hpWidth = Math.min(260, window.innerWidth * 0.26);
    const hpPercent = player.hp / player.maxHp;

    ctx.fillStyle = "rgba(8,6,18,0.86)";
    roundedRect(ctx, 18, 18, hpWidth + 32, 70, 14);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.textAlign = "left";
    ctx.fillText(
      "ASHEN ROAD — SYSTEM TEST",
      34,
      42
    );

    ctx.fillStyle = "#33253c";
    roundedRect(ctx, 34, 54, hpWidth, 14, 7);
    ctx.fill();

    ctx.fillStyle = hpPercent > 0.3
      ? "#ff426d"
      : "#ff2424";

    roundedRect(
      ctx,
      34,
      54,
      hpWidth * hpPercent,
      14,
      7
    );
    ctx.fill();
  }

  function drawControls() {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    ctx.fillText(
      "Touch left half to move • TEST buttons on right",
      window.innerWidth / 2,
      window.innerHeight - 16
    );
  }

  function drawMenu(w, h) {
    const short = h < 500;

    ctx.textAlign = "center";

    ctx.fillStyle = "#ff315e";
    ctx.font = `900 ${short ? 42 : 64}px Arial`;
    ctx.fillText(
      "SHADOW NEXUS 2",
      w / 2,
      h * 0.30
    );

    ctx.fillStyle = "#c6b7dc";
    ctx.font = `${short ? 15 : 20}px Arial`;
    ctx.fillText(
      "CLEAN FOUNDATION BUILD",
      w / 2,
      h * 0.39
    );

    const buttonW = Math.min(420, w * 0.55);
    const buttonH = short ? 58 : 70;

    const x = (w - buttonW) / 2;
    const y = h * 0.50;

    ctx.fillStyle = "#231433";
    roundedRect(
      ctx,
      x,
      y,
      buttonW,
      buttonH,
      18
    );
    ctx.fill();

    ctx.strokeStyle = "#ffd43b";
    ctx.lineWidth = 2;
    roundedRect(
      ctx,
      x,
      y,
      buttonW,
      buttonH,
      18
    );
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${short ? 20 : 24}px Arial`;
    ctx.fillText(
      "START SYSTEM TEST",
      w / 2,
      y + buttonH / 2 + 8
    );

    menuButton = {
      x,
      y,
      w: buttonW,
      h: buttonH
    };
  }

  let menuButton = null;

  function showGameOver() {
    showOverlay(
      "GAME OVER",
      "Death transition works.",
      [
        {
          text: "RETRY",
          action: resetLevel
        },
        {
          text: "MAIN MENU",
          action: () =>
            setGameState(GameState.MENU)
        }
      ]
    );
  }

  function showLevelComplete() {
    showOverlay(
      "LEVEL COMPLETE",
      "Portal transition works.",
      [
        {
          text: "RETRY TEST",
          action: resetLevel
        },
        {
          text: "MAIN MENU",
          action: () =>
            setGameState(GameState.MENU)
        }
      ]
    );
  }

  function showOverlay(title, message, buttons) {
    hideOverlay();

    const overlay = document.createElement("div");
    overlay.id = "state-overlay";

    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "9000",
      background: "rgba(5,3,12,0.90)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      color: "white"
    });

    const heading = document.createElement("h1");
    heading.textContent = title;

    Object.assign(heading.style, {
      margin: "0 0 8px",
      color: "#ff315e",
      fontSize: "clamp(30px,7vw,58px)"
    });

    const body = document.createElement("p");
    body.textContent = message;

    Object.assign(body.style, {
      margin: "0 0 20px",
      color: "#cbbddd"
    });

    overlay.appendChild(heading);
    overlay.appendChild(body);

    buttons.forEach((entry) => {
      const button = document.createElement("button");
      button.textContent = entry.text;

      Object.assign(button.style, {
        width: "min(360px,70vw)",
        minHeight: "52px",
        margin: "6px",
        border: "1px solid #ffd43b",
        borderRadius: "14px",
        background: "#221330",
        color: "white",
        fontWeight: "bold",
        fontSize: "18px"
      });

      button.addEventListener(
        "click",
        entry.action,
        { once: true }
      );

      overlay.appendChild(button);
    });

    document.body.appendChild(overlay);
  }

  function hideOverlay() {
    document
      .getElementById("state-overlay")
      ?.remove();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function roundedRect(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(
      x + w,
      y + h,
      x,
      y + h,
      r
    );
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  canvas.addEventListener("pointerdown", (event) => {
    const p = pointerPosition(event);

    if (gameState === GameState.MENU) {
      if (
        menuButton &&
        p.x >= menuButton.x &&
        p.x <= menuButton.x + menuButton.w &&
        p.y >= menuButton.y &&
        p.y <= menuButton.y + menuButton.h
      ) {
        resetLevel();
      }

      return;
    }

    if (gameState !== GameState.PLAYING) {
      return;
    }

    /*
      LEFT SIDE:
      Touch direction relative to screen center.
    */
    if (p.x < window.innerWidth * 0.55) {
      const centerX = window.innerWidth * 0.25;
      const centerY = window.innerHeight * 0.68;

      const dx = p.x - centerX;
      const dy = p.y - centerY;

      input.left = dx < -25;
      input.right = dx > 25;
      input.up = dy < -25;
      input.down = dy > 25;
    }

    /*
      RIGHT SIDE TEST BUTTONS.

      Upper-right:
      instantly "defeat enemy", unlock portal.

      Lower-right:
      instantly damage hero by 100.
    */
    if (p.x > window.innerWidth * 0.70) {
      if (p.y < window.innerHeight * 0.52) {
        enemiesRemaining = 0;
        portal.active = true;

        console.log(
          "[SN2] TEST enemy defeated; portal active"
        );
      } else {
        player.hp -= 100;

        console.log(
          `[SN2] TEST damage. HP=${player.hp}`
        );
      }
    }
  });

  window.addEventListener("pointerup", clearMovement);
  window.addEventListener("pointercancel", clearMovement);

  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") input.left = true;
    if (event.key === "ArrowRight") input.right = true;
    if (event.key === "ArrowUp") input.up = true;
    if (event.key === "ArrowDown") input.down = true;

    if (event.key.toLowerCase() === "k") {
      enemiesRemaining = 0;
      portal.active = true;
    }

    if (event.key.toLowerCase() === "h") {
      player.hp -= 100;
    }
  });

  window.addEventListener("keyup", (event) => {
    if (event.key.startsWith("Arrow")) {
      clearMovement();
    }
  });

  function frame(now) {
    const dt = Math.min(
      (now - lastTime) / 1000,
      0.05
    );

    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(frame);
  }

  console.log(
    `[SN2] Boot build ${BUILD}`
  );

  setGameState(GameState.MENU);
  requestAnimationFrame(frame);
})();
