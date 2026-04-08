(() => {
  "use strict";

  const quantumCanvas = document.getElementById("quantum-canvas");
  const projectionCanvas = document.getElementById("projection-canvas");

  function setupCopyButtons() {
    const buttons = document.querySelectorAll(".copy-btn[data-command]");

    async function copyCommandText(command) {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(command);
          return true;
        } catch (error) {
          console.error("clipboard API failed:", error);
        }
      }

      const textarea = document.createElement("textarea");
      textarea.value = command;
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);

      let copied = false;
      try {
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        copied = document.execCommand("copy");
      } catch (error) {
        console.error("execCommand copy failed:", error);
      }

      document.body.removeChild(textarea);

      if (!copied) {
        window.prompt("Copy failed, please copy manually:", command);
        return false;
      }

      return true;
    }

    buttons.forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const command = button.getAttribute("data-command") || "";
        const originalLabel = button.textContent || "Copy";

        const ok = await copyCommandText(command);

        if (ok) {
          button.textContent = "Copied";
          button.classList.add("copied");
        } else {
          button.textContent = "Failed";
          button.classList.remove("copied");
        }

        window.setTimeout(() => {
          button.textContent = originalLabel;
          button.classList.remove("copied");
        }, 1600);
      });
    });
  }

  if (!quantumCanvas || !projectionCanvas) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupCopyButtons);
    } else {
      setupCopyButtons();
    }
    return;
  }

  const qctx = quantumCanvas.getContext("2d", { alpha: true });
  const pctx = projectionCanvas.getContext("2d", { alpha: true });

  if (!qctx || !pctx) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupCopyButtons);
    } else {
      setupCopyButtons();
    }
    return;
  }

  const docRoot = document.documentElement;
  const TAU = Math.PI * 2;
  const compact = window.matchMedia("(max-width: 900px)").matches;
  const cpuCores = navigator.hardwareConcurrency || 4;

  const qualityTier = compact || cpuCores <= 4 ? "low" : cpuCores <= 8 ? "mid" : "high";
  const streakCount = qualityTier === "high" ? 9 : qualityTier === "mid" ? 7 : 5;
  const particleCount = qualityTier === "high" ? 84 : qualityTier === "mid" ? 64 : 42;
  const maxDpr = qualityTier === "high" ? 1.5 : 1.25;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let centerX = 0;
  let centerY = 0;
  let previousTime = performance.now();

  const seeds = new Array(particleCount);
  for (let i = 0; i < particleCount; i += 1) {
    seeds[i] = Math.random() * TAU;
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    quantumCanvas.width = Math.floor(width * dpr);
    quantumCanvas.height = Math.floor(height * dpr);
    quantumCanvas.style.width = `${width}px`;
    quantumCanvas.style.height = `${height}px`;

    projectionCanvas.width = Math.floor(width * dpr);
    projectionCanvas.height = Math.floor(height * dpr);
    projectionCanvas.style.width = `${width}px`;
    projectionCanvas.style.height = `${height}px`;

    qctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    qctx.lineJoin = "round";
    qctx.lineCap = "round";
    pctx.lineJoin = "round";
    pctx.lineCap = "round";

    centerX = width * 0.5;
    centerY = height * 0.5;
  }

  function drawBackgroundHalo(energy) {
    const radius = Math.max(width, height) * 0.5;
    const gradient = qctx.createRadialGradient(centerX, centerY * 0.9, 20, centerX, centerY * 0.9, radius);

    gradient.addColorStop(0, `rgba(228,236,248,${(0.1 + energy * 0.08).toFixed(3)})`);
    gradient.addColorStop(0.5, "rgba(178,190,208,0.05)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    qctx.fillStyle = gradient;
    qctx.fillRect(0, 0, width, height);
  }

  function drawMainRing(time, energy) {
    const ring = {
      cx: centerX + Math.sin(time * 0.23) * 18,
      cy: centerY - height * 0.11 + Math.sin(time * 0.31) * 10,
      major: Math.min(width, height) * (compact ? 0.33 : 0.37),
      minor: Math.min(width, height) * (compact ? 0.18 : 0.2),
      tilt: -0.56 + Math.sin(time * 0.18) * 0.06
    };

    qctx.save();
    qctx.translate(ring.cx, ring.cy);
    qctx.rotate(ring.tilt);
    qctx.scale(1, 0.9 + Math.sin(time * 0.24) * 0.03);
    qctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < streakCount; i += 1) {
      const t = i - (streakCount - 1) * 0.5;
      const spreadX = t * 6.6;
      const spreadY = t * 2.2;
      const bandAlpha = 0.11 + (1 - Math.abs(t) / streakCount) * 0.3 + energy * 0.12;

      qctx.beginPath();
      qctx.lineWidth = Math.max(1.2, 7.2 - Math.abs(t) * 0.82 + energy * 1.4);
      qctx.shadowBlur = 18 + (1 - Math.abs(t) / streakCount) * 16 + energy * 24;
      qctx.shadowColor = "rgba(240,246,255,0.7)";
      qctx.strokeStyle = `rgba(235,242,252,${bandAlpha.toFixed(3)})`;
      qctx.ellipse(
        spreadX,
        spreadY,
        ring.major + spreadX * 0.35,
        ring.minor + spreadY * 0.4,
        Math.sin(time * 0.11 + i * 0.36) * 0.09,
        0,
        TAU
      );
      qctx.stroke();
    }

    qctx.setLineDash([]);
    qctx.lineWidth = 2.8 + energy * 1.2;
    qctx.shadowBlur = 24 + energy * 14;
    qctx.shadowColor = "rgba(255,255,255,0.65)";
    qctx.strokeStyle = `rgba(255,255,255,${(0.34 + energy * 0.2).toFixed(3)})`;
    qctx.beginPath();
    qctx.ellipse(0, 0, ring.major * 1.03, ring.minor * 1.03, 0.05, 0, TAU);
    qctx.stroke();

    qctx.restore();

    return ring;
  }

  function drawRingProjection(ring, time, energy) {
    pctx.save();
    pctx.translate(ring.cx + ring.major * 0.11, ring.cy + ring.minor * 1.08);
    pctx.rotate(ring.tilt * 0.94);
    pctx.scale(1, 0.43);

    for (let i = 0; i < 3; i += 1) {
      const alpha = 0.1 + i * 0.05 + energy * 0.1;
      pctx.lineWidth = 2.8 - i * 0.6 + energy * 0.8;
      pctx.strokeStyle = `rgba(255,255,255,${Math.min(alpha, 0.56).toFixed(3)})`;
      pctx.beginPath();
      pctx.ellipse(0, 0, ring.major * (0.9 + i * 0.06), ring.minor * (0.44 + i * 0.06), 0, 0, TAU);
      pctx.stroke();
    }

    pctx.restore();
  }

  function drawRingParticles(ring, time, energy) {
    qctx.save();
    qctx.globalCompositeOperation = "lighter";

    const cosT = Math.cos(ring.tilt);
    const sinT = Math.sin(ring.tilt);

    for (let i = 0; i < particleCount; i += 1) {
      const a = seeds[i] + time * (0.2 + (i % 6) * 0.015);
      const localX = Math.cos(a) * ring.major;
      const localY = Math.sin(a) * ring.minor;

      const x = ring.cx + localX * cosT - localY * sinT;
      const y = ring.cy + localX * sinT + localY * cosT;

      const jitter = 0.6 + energy * 1.6;
      const px = x + Math.sin(time * 3 + i * 0.7) * jitter;
      const py = y + Math.cos(time * 2.7 + i * 0.6) * jitter;

      const alpha = 0.18 + Math.max(0, Math.sin(time * 4.2 + i * 0.19)) * 0.44 + energy * 0.16;
      const size = 0.55 + Math.max(0.4, 1 - Math.abs(Math.sin(a))) * 1.2;

      qctx.beginPath();
      qctx.fillStyle = `rgba(239,247,255,${Math.min(alpha, 0.88).toFixed(3)})`;
      qctx.arc(px, py, size, 0, TAU);
      qctx.fill();
    }

    qctx.restore();
  }

  function animate(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    const time = now / 1000;

    qctx.clearRect(0, 0, width, height);
    pctx.clearRect(0, 0, width, height);

    const energy =
      0.18 +
      ((Math.sin(time * 0.82) + 1) * 0.5) * 0.26 +
      ((Math.sin(time * 1.34 + 1.1) + 1) * 0.5) * 0.16;

    drawBackgroundHalo(energy);

    const ring = drawMainRing(time, energy);
    drawRingProjection(ring, time, energy);
    drawRingParticles(ring, time, energy);

    const flash = Math.min(0.9, 0.12 + energy * 0.52 + Math.max(0, Math.sin(time * 7.1)) * 0.08);
    docRoot.style.setProperty("--quantum-flash", flash.toFixed(3));

    window.requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.requestAnimationFrame(animate);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCopyButtons);
  } else {
    setupCopyButtons();
  }
})();


