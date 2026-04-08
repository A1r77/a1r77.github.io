(() => {
  "use strict";

  const canvas = document.getElementById("edgebug-canvas");
  const anchor = document.getElementById("edgebug-anchor");

  if (!canvas || !anchor) {
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    return;
  }

  const TAU = Math.PI * 2;
  const compact = window.matchMedia("(max-width: 900px)").matches;
  const maxDpr = compact ? 1.2 : 1.4;

  let width = 1;
  let height = 1;
  let dpr = 1;
  let elapsedMs = 0;
  let previousTime = performance.now();

  function drawPoly(points, fill, stroke, lineWidth) {
    if (!points || points.length < 3) {
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }

    ctx.closePath();

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (stroke) {
      ctx.lineWidth = lineWidth || 1;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function anchorBox() {
    const rect = anchor.getBoundingClientRect();
    return {
      cx: rect.left + rect.width * 0.5,
      cy: rect.top + rect.height * 0.5,
      w: rect.width,
      h: rect.height
    };
  }

  function drawIsometricLogo(box, timeMs) {
    const size = Math.min(box.w, box.h) * 0.9;
    const halfW = size * 0.29;
    const halfH = size * 0.18;
    const depth = size * 0.25;

    const floatY = Math.sin(timeMs * 0.0013) * 1.6;
    const tilt = Math.sin(timeMs * 0.0009) * 0.05;
    const glow = 0.35 + (Math.sin(timeMs * 0.0018) + 1) * 0.2;

    ctx.save();
    ctx.translate(box.cx, box.cy + floatY);
    ctx.rotate(tilt);

    const topA = { x: 0, y: -halfH - depth * 0.35 };
    const topB = { x: halfW, y: -depth * 0.1 };
    const topC = { x: 0, y: halfH };
    const topD = { x: -halfW, y: -depth * 0.1 };

    const leftD = { x: topD.x, y: topD.y };
    const leftC = { x: topC.x, y: topC.y };
    const leftC2 = { x: topC.x, y: topC.y + depth };
    const leftD2 = { x: topD.x, y: topD.y + depth };

    const rightB = { x: topB.x, y: topB.y };
    const rightC = { x: topC.x, y: topC.y };
    const rightC2 = { x: topC.x, y: topC.y + depth };
    const rightB2 = { x: topB.x, y: topB.y + depth };

    ctx.shadowBlur = 16 + glow * 16;
    ctx.shadowColor = "rgba(230,236,245,0.45)";

    drawPoly([topA, topB, topC, topD], "rgba(224,228,234,0.96)", "rgba(245,248,252,0.38)", 1.1);
    drawPoly([leftD, leftC, leftC2, leftD2], "rgba(198,204,212,0.96)", "rgba(232,236,244,0.2)", 1);
    drawPoly([rightB, rightC, rightC2, rightB2], "rgba(10,12,16,0.95)", "rgba(230,236,244,0.15)", 1);

    const holeA = { x: 0, y: -halfH * 0.3 - depth * 0.22 };
    const holeB = { x: halfW * 0.52, y: -depth * 0.08 };
    const holeC = { x: 0, y: halfH * 0.46 };
    const holeD = { x: -halfW * 0.52, y: -depth * 0.08 };
    drawPoly([holeA, holeB, holeC, holeD], "rgba(8,10,13,0.98)");

    ctx.shadowBlur = 0;

    const slotW = halfW * 0.18;
    const slotH = depth * 0.72;

    drawPoly(
      [
        { x: -halfW * 0.68, y: depth * 0.02 },
        { x: -halfW * 0.68 + slotW, y: depth * 0.11 },
        { x: -halfW * 0.68 + slotW, y: depth * 0.11 + slotH },
        { x: -halfW * 0.68, y: depth * 0.02 + slotH }
      ],
      "rgba(12,14,18,0.96)"
    );

    drawPoly(
      [
        { x: -halfW * 0.34, y: depth * 0.2 },
        { x: -halfW * 0.34 + slotW, y: depth * 0.29 },
        { x: -halfW * 0.34 + slotW, y: depth * 0.29 + slotH * 0.82 },
        { x: -halfW * 0.34, y: depth * 0.2 + slotH * 0.82 }
      ],
      "rgba(12,14,18,0.96)"
    );

    drawPoly(
      [
        { x: halfW * 0.16, y: depth * 0.18 },
        { x: halfW * 0.78, y: depth * 0.4 },
        { x: halfW * 0.5, y: depth * 0.66 },
        { x: halfW * -0.08, y: depth * 0.46 }
      ],
      "rgba(214,220,228,0.95)"
    );

    drawPoly(
      [
        { x: halfW * 0.22, y: depth * 0.34 },
        { x: halfW * 0.58, y: depth * 0.47 },
        { x: halfW * 0.36, y: depth * 0.58 },
        { x: halfW * 0.03, y: depth * 0.46 }
      ],
      "rgba(12,14,18,0.95)"
    );

    ctx.restore();
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function animate(now) {
    const dt = Math.min(now - previousTime, 50);
    previousTime = now;
    elapsedMs += dt;

    ctx.clearRect(0, 0, width, height);
    drawIsometricLogo(anchorBox(), elapsedMs);

    window.requestAnimationFrame(animate);
  }

  resize();

  window.addEventListener("resize", resize, { passive: true });

  window.requestAnimationFrame(animate);
})();
