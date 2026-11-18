(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Theme ---------- */
  function storedTheme() {
    try { return localStorage.getItem("theme"); } catch (e) { return null; }
  }
  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  function currentTheme() {
    return root.getAttribute("data-theme") || systemTheme();
  }
  var saved = storedTheme();
  root.setAttribute("data-theme", saved === "light" || saved === "dark" ? saved : systemTheme());

  function syncToggleLabel() {
    var btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("aria-label", currentTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* Theme toggle */
    var toggle = document.getElementById("theme-toggle");
    syncToggleLabel();
    if (toggle) {
      toggle.addEventListener("click", function () {
        var next = currentTheme() === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) { /* storage unavailable */ }
        syncToggleLabel();
      });
    }

    /* Mobile menu */
    var burger = document.getElementById("hamburger");
    var menu = document.getElementById("nav-menu");
    function setMenu(open) {
      menu.classList.toggle("is-open", open);
      burger.classList.toggle("is-active", open);
      burger.setAttribute("aria-expanded", String(open));
    }
    if (burger && menu) {
      burger.addEventListener("click", function () {
        setMenu(!menu.classList.contains("is-open"));
      });
      menu.addEventListener("click", function (e) {
        if (e.target.closest("a")) setMenu(false);
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu.classList.contains("is-open")) {
          setMenu(false);
          burger.focus();
        }
      });
    }

    /* Optional CV download */
    var cv = document.getElementById("cv-download");
    if (cv && window.fetch) {
      fetch(cv.getAttribute("href"), { method: "HEAD" })
        .then(function (r) {
          var type = r.headers.get("content-type") || "";
          if (r.ok && type.indexOf("html") === -1) cv.hidden = false;
        })
        .catch(function () { /* keep hidden */ });
    }

    /* Footer year */
    var yr = document.getElementById("year");
    if (yr) yr.textContent = new Date().getFullYear();

    /* ---------- Typing effect ---------- */
    var typed = document.getElementById("typing-text");
    var phrases = ["Senior Full Stack Engineer", "Full Stack .NET & Angular", "Distributed Systems on AWS"];
    if (typed) {
      if (reduceMotion.matches) {
        typed.textContent = phrases[0];
      } else {
        var pi = 0, ci = 0, deleting = false;
        (function tick() {
          var word = phrases[pi];
          ci += deleting ? -1 : 1;
          typed.textContent = word.slice(0, ci);
          var delay = deleting ? 35 : 75;
          if (!deleting && ci === word.length) { deleting = true; delay = 1600; }
          else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
          setTimeout(tick, delay);
        })();
      }
    }

    /* ---------- 3D pool: refracted tile floor, lane markings, ropes, camera drift ---------- */
    (function () {
      var cv = document.getElementById("hero-3d");
      if (!cv || !cv.getContext) return;
      var g = cv.getContext("2d");
      var lo = document.createElement("canvas"), lg = lo.getContext("2d");
      var W = 0, H = 0, LW = 0, LH = 0, img = null, t = 0, running = false, raf = 0, last = 0, frame = 0;
      var ptr = { x: 0, y: 0, on: 0, lastRip: 0, u: 0, su: 0, v: 0, sv: 0 }, ripples = [];
      var K = 5.5, LANE = 2.2, TILE = 1.1, SPEED = 0.7;
      var hexRgb = function (hex) {
        hex = hex.trim();
        if (hex.charAt(0) !== "#") return null;
        if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
      };
      var Q = 0, big = false, hyF = 0.26, cxF = 0.5;
      var size = function () {
        W = cv.clientWidth; H = cv.clientHeight;
        big = W >= 900;
        hyF = big ? 0.26 : 0.2; cxF = big ? 0.5 : 0.55;
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (big) {
          if (W * H * dpr * dpr > 5200000) dpr = Math.sqrt(5200000 / (W * H));
          if (Q === 1) dpr = Math.min(dpr, 1);
          if (Q >= 2) dpr = Math.min(dpr, 0.75);
        }
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        var dv = big ? Math.max(4, Math.ceil(W / 440)) + (Q === 1 ? 2 : (Q >= 2 ? 4 : 0)) : 4;
        LW = Math.max(60, Math.ceil(W / dv)); LH = Math.max(40, Math.ceil(H / dv));
        lo.width = LW; lo.height = LH;
        img = lg.createImageData(LW, LH);
      };
      var floor = function (rgb, cxL, hyL, camZ) {
        var d = img.data, rl = ripples.length, py, px, i, r;
        for (py = 0; py < LH; py++) {
          var yn = (py - hyL) / (LH - hyL);
          if (yn <= 0.03) { for (px = 0; px < LW; px++) d[(py * LW + px) * 4 + 3] = 0; continue; }
          var z = 1 / yn, fade = Math.min(1, (yn - 0.03) * 4.5), cl = Math.max(0.15, Math.min(1, 1.5 - z * 0.14)), tl = Math.max(0.12, 1 - z * 0.085);
          var wTile = 0.035 + 0.012 * z, wMark = 0.1 + 0.014 * z;
          for (px = 0; px < LW; px++) {
            i = (py * LW + px) * 4;
            var fx = (px - cxL) / LW * z * K, fz = z * 2 + camZ;
            var ox = 0.16 * Math.sin(fz * 1.3 + t + fx * 0.7) + 0.08 * Math.sin(fx * 2.1 - t * 0.7 + fz * 0.4);
            var oz = 0.16 * Math.cos(fx * 1.1 + t * 0.8 + fz * 0.9);
            for (r = 0; r < rl; r++) {
              var rp = ripples[r], dx = px - rp.x, dy = (py - rp.y) * 2.6, dd = Math.sqrt(dx * dx + dy * dy);
              var wv = Math.exp(-Math.pow((dd - rp.r) / 5, 2)) * rp.a;
              ox += wv * 0.35 * Math.sin(dd * 0.9); oz += wv * 0.35 * Math.cos(dd * 0.9);
            }
            var X = fx + ox, Z = fz + oz;
            var ft = X / TILE, ft2 = Z / TILE;
            var dX = Math.abs(ft - Math.round(ft)) * TILE, dZ = Math.abs(ft2 - Math.round(ft2)) * TILE;
            var tile = Math.max(0, 1 - Math.min(dX, dZ) / wTile);
            var fl = X / LANE, lr = Math.round(fl);
            var mark = Math.abs(lr) <= 2 ? Math.max(0, 1 - Math.abs(fl - lr) * LANE / wMark) : 0;
            var s1 = Math.sin(X * 2.6 + 1.7 * Math.sin(Z * 2.1 + t * 0.7));
            var s2 = Math.sin(Z * 3.1 + 1.5 * Math.sin(X * 1.7 - t * 0.6));
            var c = 1 - Math.abs(Math.sin(s1 * 2.1 + s2 * 2.1)); c = c * c * c * c * c * c * cl;
            var a = fade * (0.05 + tile * 0.42 * tl + mark * 0.5 + c * 0.55);
            d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
            d[i + 3] = a > 1 ? 255 : a * 255;
          }
        }
        lg.putImageData(img, 0, 0);
      };
      var slowSum = 0, slowN = 0, lastTs = 0;
      var draw = function (ts) {
        if (Q >= 2 && last && ts - last < 30) { raf = requestAnimationFrame(draw); return; }
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
        t += dt; frame++;
        // adaptive quality: step down once if this device draws slowly
        if (big && Q < 2 && frame > 20) {
          slowSum += ts - lastTs; slowN++;
          if (slowN >= 60) { if (slowSum / slowN > 26) { Q++; size(); } slowSum = 0; slowN = 0; }
        }
        lastTs = ts;
        var cs = getComputedStyle(root);
        var dot = (cs.getPropertyValue("--canvas-dot").trim() || "125,211,252").split(",").map(Number);
        var strong = hexRgb(cs.getPropertyValue("--text-strong")) || [255, 255, 255];
        var light = strong[0] < 128;
        ptr.su += (ptr.u - ptr.su) * 0.04; ptr.sv += (ptr.v - ptr.sv) * 0.04;
        var cx = W * cxF + ptr.su * W * 0.05 + Math.sin(t * 0.3) * W * 0.015;
        var hy = H * hyF + ptr.sv * H * 0.025 + Math.sin(t * 0.45) * H * 0.008;
        var camZ = t * SPEED, k, i;
        if (frame % (Q >= 1 ? 3 : 2) === 0 || frame === 1) {
          for (i = ripples.length - 1; i >= 0; i--) { ripples[i].r += 0.9; ripples[i].a *= 0.965; if (ripples[i].a < 0.04) ripples.splice(i, 1); }
          floor(light ? [255, 255, 255] : dot, cx * LW / W, hy * LH / H, camZ);
        }
        g.clearRect(0, 0, W, H);
        var gr = g.createLinearGradient(0, hy, 0, H);
        gr.addColorStop(0, "rgba(" + dot + ",0.0)"); gr.addColorStop(0.35, "rgba(" + dot + "," + (light ? 0.3 : 0.06) + ")"); gr.addColorStop(1, "rgba(" + dot + "," + (light ? 0.55 : 0.16) + ")");
        g.fillStyle = gr; g.fillRect(0, hy, W, H - hy);
        // far wall glow
        var wl = g.createLinearGradient(0, hy - H * 0.05, 0, hy + H * 0.06);
        wl.addColorStop(0, "rgba(" + dot + ",0)"); wl.addColorStop(0.5, "rgba(" + (light ? "255,255,255" : dot) + "," + (light ? 0.55 : 0.22) + ")"); wl.addColorStop(1, "rgba(" + dot + ",0)");
        g.fillStyle = wl; g.fillRect(0, hy - H * 0.05, W, H * 0.11);
        g.imageSmoothingEnabled = true;
        g.drawImage(lo, 0, 0, W, H);

        // lane ropes with buoys that stream toward the viewer (buoys batched into few fills)
        var ropes = big ? [-4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, 4.5] : [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5], rs = big ? 0.22 : 0.4, zMax = 16, PER = 1.2, NB = 26;
        var bands = [[[], []], [[], []], [[], []]];
        g.beginPath();
        for (k = 0; k < ropes.length; k++) {
          var u = ropes[k], zz;
          for (zz = zMax; zz >= 1; zz -= 0.25) {
            var s = 1 / zz;
            var rx = cx + u * W * rs * s + Math.sin(zz * 1.7 + t * 1.2 + k) * 2.5 * s, ry = hy + (H - hy) * s;
            if (zz === zMax) g.moveTo(rx, ry); else g.lineTo(rx, ry);
          }
          for (i = 0; i < NB; i++) {
            var dz = (((i * PER - camZ * 1) % (NB * PER)) + NB * PER) % (NB * PER);
            var z2 = 1 + dz / 2;
            if (z2 > zMax) continue;
            var s2 = 1 / z2;
            var al = Math.min(1, 1.25 - z2 / zMax) * Math.min(1, (z2 - 1) * 3 + 0.2);
            var band = al > 0.66 ? 2 : (al > 0.33 ? 1 : 0);
            bands[band][i % 2].push(
              cx + u * W * rs * s2 + Math.sin(z2 * 1.7 + t * 1.2 + k) * 2.5 * s2,
              hy + (H - hy) * s2 + Math.sin(t * 2 + i + k) * 1.2 * s2,
              Math.max(1.2, 6.5 * s2));
          }
        }
        g.strokeStyle = light ? "rgba(255,255,255,0.7)" : "rgba(" + dot + ",0.4)"; g.lineWidth = light ? 1.6 : 1.3; g.stroke();
        var bandA = [0.3, 0.6, 0.9], q, arr, m2, pass;
        for (q = 0; q < 3; q++) {
          for (m2 = 0; m2 < 2; m2++) {
            arr = bands[q][m2];
            if (!arr.length) continue;
            for (pass = 0; pass < 3; pass++) {
              g.beginPath();
              for (i = 0; i < arr.length; i += 3) {
                var bx = arr[i], by = arr[i + 1], br = arr[i + 2];
                if (pass === 0) { g.moveTo(bx + br, by); g.ellipse(bx, by, br, br * 0.72, 0, 0, Math.PI * 2); }
                else if (pass === 1) { g.moveTo(bx - br * 0.3 + br * 0.3, by - br * 0.3); g.ellipse(bx - br * 0.3, by - br * 0.3, br * 0.3, br * 0.2, 0, 0, Math.PI * 2); }
                else { g.moveTo(bx + br * 0.9, by + br * 1.1); g.ellipse(bx, by + br * 1.1, br * 0.9, br * 0.25, 0, 0, Math.PI * 2); }
              }
              if (pass === 0) g.fillStyle = m2 === 0 ? "rgba(" + (light ? "249,115,22" : strong) + "," + bandA[q] + ")" : "rgba(" + (light ? "255,255,255" : dot) + "," + bandA[q] + ")";
              else if (pass === 1) g.fillStyle = "rgba(255,255,255," + (bandA[q] * 0.55).toFixed(2) + ")";
              else g.fillStyle = "rgba(" + dot + "," + (bandA[q] * 0.28).toFixed(2) + ")";
              g.fill();
            }
          }
        }
        // soft fades drawn on the canvas instead of a CSS mask
        if (big) {
        g.globalCompositeOperation = "destination-out";
        var fl = g.createLinearGradient(0, 0, W * 0.6, 0);
        fl.addColorStop(0, "rgba(0,0,0,0.8)"); fl.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = fl; g.fillRect(0, 0, W * 0.6, H);
        var ft = g.createLinearGradient(0, 0, 0, H * 0.12);
        ft.addColorStop(0, "rgba(0,0,0,1)"); ft.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = ft; g.fillRect(0, 0, W, H * 0.12);
        var fb = g.createLinearGradient(0, H * 0.86, 0, H);
        fb.addColorStop(0, "rgba(0,0,0,0)"); fb.addColorStop(1, "rgba(0,0,0,1)");
        g.fillStyle = fb; g.fillRect(0, H * 0.86, W, H * 0.14);
        g.globalCompositeOperation = "source-over";
        }
        raf = requestAnimationFrame(draw);
      };
      size();
      window.addEventListener("resize", size);
      cv.parentElement.addEventListener("pointermove", function (e) {
        var r = cv.getBoundingClientRect();
        ptr.u = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
        ptr.v = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
        var now = performance.now();
        if (now - ptr.lastRip > 220 && ripples.length < 5) {
          ripples.push({ x: (e.clientX - r.left) / r.width * LW, y: (e.clientY - r.top) / r.height * LH, r: 0, a: 1 });
          ptr.lastRip = now;
        }
      });
      if (reduceMotion.matches) {
        t = 3; draw(performance.now()); cancelAnimationFrame(raf);
      } else if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { if (!running) { running = true; last = 0; raf = requestAnimationFrame(draw); } }
          else { running = false; cancelAnimationFrame(raf); }
        }).observe(cv);
      } else { running = true; raf = requestAnimationFrame(draw); }
    })();

    /* ---------- Water-surface section edges ---------- */
    (function () {
      var edges = [].slice.call(document.querySelectorAll(".wave-edge"));
      if (!edges.length) return;
      var parseTint = function (v) {
        var m = (v || "").match(/[\d.]+/g);
        return m && m.length >= 3 ? [+m[0], +m[1], +m[2], m.length > 3 ? +m[3] : 1] : [150, 210, 240, 0.05];
      };
      var hexRgb = function (hex) {
        hex = hex.trim();
        if (hex.charAt(0) !== "#") return [8, 32, 48];
        if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
      };
      var st = edges.map(function (cv, n) {
        var lo = document.createElement("canvas");
        return { cv: cv, g: cv.getContext("2d"), lo: lo, lg: lo.getContext("2d"), n: n, vis: false, W: 0, H: 0, img: null };
      });
      var size = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        st.forEach(function (e) {
          e.W = e.cv.clientWidth; e.H = e.cv.clientHeight;
          e.cv.width = e.W * dpr; e.cv.height = e.H * dpr;
          e.g.setTransform(dpr, 0, 0, dpr, 0, 0);
          e.lw = Math.max(40, Math.ceil(e.W / 4)); e.lh = Math.max(12, Math.ceil(e.H / 4));
          e.lo.width = e.lw; e.lo.height = e.lh;
          e.img = e.lg.createImageData(e.lw, e.lh);
        });
      };
      var surf = function (x, t, n) {
        var q = x + n * 317;
        return 9 * Math.sin(q * 0.008 + t * 0.7) + 5 * Math.sin(q * 0.021 - t * 1.1) + 2.5 * Math.sin(q * 0.05 + t * 1.9) + 1.2 * Math.sin(q * 0.11 - t * 2.6);
      };
      var drawEdge = function (e, t, alt, altA, lightMode, dot) {
        var g = e.g, W = e.W, H = e.H, base = H * 0.55, x, y;
        g.clearRect(0, 0, W, H);
        var d = e.img.data, sx = W / e.lw, sy = H / e.lh;
        for (var ly = 0; ly < e.lh; ly++) {
          for (var lx = 0; lx < e.lw; lx++) {
            var i = (ly * e.lw + lx) * 4, px = lx * sx, py = ly * sy;
            var dep = (py - (base + surf(px, t, e.n))) / H;
            if (dep < 0) { d[i + 3] = 0; continue; }
            var fade = Math.exp(-dep * 6.5);
            var s1 = Math.sin(px * 0.045 + 1.5 * Math.sin(py * 0.11 + t * 0.8 + e.n));
            var s2 = Math.sin(py * 0.14 + 1.3 * Math.sin(px * 0.037 - t * 0.7));
            var c = 1 - Math.abs(Math.sin(s1 * 2 + s2 * 2)); c = c * c * c * c * c;
            var col = lightMode ? [255, 255, 255] : dot;
            d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2];
            d[i + 3] = Math.min(255, c * fade * (lightMode ? 255 : 200));
          }
        }
        e.lg.putImageData(e.img, 0, 0);
        // water body below the surface, with a feathered edge instead of a hard line
        var body = function (dy) {
          g.beginPath();
          g.moveTo(0, H + 10);
          for (x = 0; x <= W; x += 6) g.lineTo(x, base + surf(x, t, e.n) + dy);
          g.lineTo(W, H + 10); g.closePath();
        };
        g.fillStyle = "rgb(" + alt + ")";
        g.strokeStyle = "rgb(" + alt + ")"; g.lineJoin = "round";
        var widths = [20, 13, 7];
        for (var fi = 0; fi < widths.length; fi++) {
          g.beginPath();
          for (x = 0; x <= W; x += 6) { y = base + surf(x, t, e.n) - widths[fi] * 0.25; if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
          g.lineWidth = widths[fi]; g.globalAlpha = 0.12 * altA; g.stroke();
        }
        g.globalAlpha = altA;
        g.save();
        body(0); g.fill(); g.globalAlpha = 1; g.clip();
        g.imageSmoothingEnabled = true;
        g.drawImage(e.lo, 0, 0, W, H);
        g.restore();
        // a soft sheen along the wave, no crisp line
        var sheen = lightMode ? [255, 255, 255] : [190, 235, 255];
        g.beginPath();
        for (x = 0; x <= W; x += 6) { y = base + surf(x, t, e.n); if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
        g.lineWidth = 14; g.lineJoin = "round"; g.strokeStyle = "rgba(" + sheen + "," + (lightMode ? 0.28 : 0.07) + ")"; g.stroke();
        g.lineWidth = 6; g.strokeStyle = "rgba(" + sheen + "," + (lightMode ? 0.4 : 0.09) + ")"; g.stroke();
      };
      var alt = "8,32,48", running = false, raf = 0, t0 = 0;
      var frame = function (ts) {
        var t = ts / 1000;
        var cs = getComputedStyle(root);
        var a = parseTint(cs.getPropertyValue("--alt-tint"));
        alt = a.slice(0, 3).join(",");
        var sg = hexRgb(cs.getPropertyValue("--text-strong"));
        var lightMode = (sg[0] + sg[1] + sg[2]) / 3 < 128;
        var dot = (cs.getPropertyValue("--canvas-dot").trim() || "125,211,252").split(",").map(Number);
        var any = false;
        st.forEach(function (e) { if (e.vis) { any = true; drawEdge(e, t, alt, a[3], lightMode, dot); } });
        if (any) raf = requestAnimationFrame(frame); else running = false;
      };
      var kick = function () { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
      size();
      window.addEventListener("resize", size);
      if (reduceMotion.matches || !("IntersectionObserver" in window)) {
        var cs0 = getComputedStyle(root);
        var a0 = parseTint(cs0.getPropertyValue("--alt-tint")), sg0 = hexRgb(cs0.getPropertyValue("--text-strong"));
        st.forEach(function (e) { drawEdge(e, 2, a0.slice(0, 3).join(","), a0[3], (sg0[0] + sg0[1] + sg0[2]) / 3 < 128, (cs0.getPropertyValue("--canvas-dot").trim() || "125,211,252").split(",").map(Number)); });
      } else {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            st.forEach(function (e) { if (e.cv === en.target) e.vis = en.isIntersecting; });
          });
          kick();
        }, { rootMargin: "100px" });
        st.forEach(function (e) { io.observe(e.cv); });
      }
    })();

    /* ---------- Breathing bubbles ---------- */
    (function () {
      var cv = document.getElementById("bubbles");
      if (!cv || !cv.getContext || reduceMotion.matches) return;
      var g = cv.getContext("2d"), W = 0, H = 0, bubbles = [], raf = 0, last = 0, t = 0;
      var mk = function (initial) {
        var r = 3 + Math.pow(Math.random(), 2.2) * 16;
        return {
          x: Math.random() * W, y: initial ? Math.random() * H : H + r + Math.random() * 120, r: r,
          vy: 14 + r * 2.6 + Math.random() * 8, ph: Math.random() * 6.28, br: 0.5 + Math.random() * 0.7, wob: 6 + Math.random() * 14,
          a: 0.35 + Math.random() * 0.4
        };
      };
      var resize = function () {
        var dpr = 1;
        W = window.innerWidth; H = window.innerHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        var n = W < 700 ? 14 : 26;
        while (bubbles.length < n) bubbles.push(mk(true));
        bubbles.length = n;
      };
      var frame = function (ts) {
        if (last && ts - last < 30) { raf = requestAnimationFrame(frame); return; }
        var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts; t += dt;
        var cs = getComputedStyle(document.documentElement);
        var dot = (cs.getPropertyValue("--canvas-dot").trim() || "125,211,252").split(",").map(Number);
        var lightMode = dot[0] < 100;
        g.clearRect(0, 0, W, H);
        for (var i = 0; i < bubbles.length; i++) {
          var b = bubbles[i];
          b.y -= b.vy * dt;
          if (b.y < -b.r * 2) { bubbles[i] = mk(false); continue; }
          var x = b.x + Math.sin(t * 0.8 + b.ph) * b.wob;
          var breathe = 1 + 0.1 * Math.sin(t * b.br * 2 + b.ph);
          var r = b.r * breathe;
          var fadeTop = Math.min(1, b.y / (H * 0.25) + 0.2);
          var al = b.a * fadeTop;
          var grd = g.createRadialGradient(x, b.y, r * 0.55, x, b.y, r);
          grd.addColorStop(0, "rgba(" + dot + ",0)");
          grd.addColorStop(1, "rgba(" + dot + "," + (0.22 * al).toFixed(3) + ")");
          g.beginPath(); g.arc(x, b.y, r, 0, Math.PI * 2); g.fillStyle = grd; g.fill();
          g.lineWidth = 1; g.strokeStyle = "rgba(" + dot + "," + (0.55 * al).toFixed(3) + ")"; g.stroke();
          g.beginPath(); g.arc(x - r * 0.38, b.y - r * 0.38, r * 0.34, Math.PI * 1.05, Math.PI * 1.75);
          g.lineWidth = Math.max(1, r * 0.1); g.lineCap = "round";
          g.strokeStyle = lightMode ? "rgba(255,255,255," + (0.9 * al).toFixed(3) + ")" : "rgba(255,255,255," + (0.8 * al).toFixed(3) + ")"; g.stroke();
          g.beginPath(); g.arc(x + r * 0.42, b.y + r * 0.42, r * 0.16, Math.PI * 0.05, Math.PI * 0.6);
          g.lineWidth = 1; g.strokeStyle = "rgba(" + dot + "," + (0.35 * al).toFixed(3) + ")"; g.stroke();
        }
        raf = requestAnimationFrame(frame);
      };
      resize();
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) cancelAnimationFrame(raf); else { last = 0; raf = requestAnimationFrame(frame); }
      });
      raf = requestAnimationFrame(frame);
    })();

    /* ---------- Medal: lean toward the cursor ---------- */
    (function () {
      var stage = document.querySelector(".medal-stage"), tilt = document.querySelector(".coin-tilt");
      if (!stage || !tilt || reduceMotion.matches || !window.matchMedia("(hover: hover)").matches) return;
      var area = stage.parentElement;
      area.addEventListener("pointermove", function (e) {
        var r = stage.getBoundingClientRect();
        var x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.9)));
        var y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 0.9)));
        tilt.style.setProperty("--ry", (x * 18).toFixed(1) + "deg");
        tilt.style.setProperty("--rx", (-y * 14).toFixed(1) + "deg");
      });
      area.addEventListener("pointerleave", function () {
        tilt.style.setProperty("--ry", "0deg"); tilt.style.setProperty("--rx", "0deg");
      });
    })();

    /* ---------- 3D card tilt ---------- */
    if (!reduceMotion.matches && window.matchMedia("(hover: hover)").matches) {
      document.querySelectorAll(".tilt").forEach(function (el) {
        el.addEventListener("pointermove", function (e) {
          var r = el.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          el.classList.add("is-tilting");
          el.style.setProperty("--ry", (px * 12).toFixed(2) + "deg");
          el.style.setProperty("--rx", (-py * 12).toFixed(2) + "deg");
        });
        el.addEventListener("pointerleave", function () {
          el.classList.remove("is-tilting");
          el.style.setProperty("--ry", "0deg");
          el.style.setProperty("--rx", "0deg");
        });
      });
    }

    /* ---------- Experience timeline ---------- */
    var tl = document.querySelector(".timeline");
    if (tl) {
      var tItems = tl.querySelectorAll(".timeline-item");
      tItems.forEach(function (item) {
        item.querySelectorAll(".timeline-stats li, .timeline-bullets li, .timeline-stack .chip").forEach(function (el, i) {
          el.style.setProperty("--i", i);
        });
      });
      if (!window.matchMedia("(hover: hover)").matches) {
        tItems.forEach(function (item) {
          if (!item.querySelector(".timeline-popup")) return;
          item.addEventListener("click", function () { item.classList.toggle("is-open"); });
        });
      }
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          tItems.forEach(function (it) { it.classList.remove("is-open"); });
          if (document.activeElement && document.activeElement.closest(".timeline-item")) document.activeElement.blur();
        }
      });
      var setProgress = function () {
        var r = tl.getBoundingClientRect(), mid = window.innerHeight * 0.55;
        var px = Math.max(0, Math.min(r.height, mid - r.top));
        tl.style.setProperty("--progress", px + "px");
      };
      if (!("IntersectionObserver" in window) || reduceMotion.matches) {
        tItems.forEach(function (it) { it.classList.add("in-view"); });
        tl.style.setProperty("--progress", tl.offsetHeight + "px");
      } else {
        var inObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.classList.add("in-view"); inObs.unobserve(en.target); }
          });
        }, { threshold: 0, rootMargin: "0px 0px 25% 0px" });
        var actObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.target.classList.toggle("is-active", en.isIntersecting); });
        }, { rootMargin: "-40% 0px -40% 0px" });
        tItems.forEach(function (it) { inObs.observe(it); actObs.observe(it); });
        var ticking = false;
        window.addEventListener("scroll", function () {
          if (!ticking) { ticking = true; requestAnimationFrame(function () { setProgress(); ticking = false; }); }
        }, { passive: true });
        window.addEventListener("resize", setProgress);
        setProgress();
      }
      if (window.matchMedia("(hover: hover)").matches && !reduceMotion.matches) {
        tl.querySelectorAll(".timeline-content").forEach(function (card) {
          card.addEventListener("pointermove", function (e) {
            var r = card.getBoundingClientRect();
            card.style.setProperty("--mx", (e.clientX - r.left) + "px");
            card.style.setProperty("--my", (e.clientY - r.top) + "px");
          });
        });
      }
    }

    /* ---------- Flip cards ---------- */
    var canHover = window.matchMedia("(hover: hover)").matches;
    document.querySelectorAll(".flip-card").forEach(function (card) {
      var flip = function () { card.classList.toggle("is-flipped"); };
      if (!canHover) card.addEventListener("click", flip);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
      });
    });

    /* ---------- Scroll reveal (staggered) ---------- */
    var revealEls = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      revealEls.forEach(function (el) { el.classList.add("revealed"); });
    } else {
      var revealObs = new IntersectionObserver(function (entries) {
        var batch = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var target = entry.target, delay = Math.min(batch, 3) * 50;
          target.style.transitionDelay = delay + "ms";
          batch++;
          target.classList.add("revealed");
          setTimeout(function () { target.style.transitionDelay = ""; }, delay + 800);
          revealObs.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: "0px 0px 20% 0px" });
      revealEls.forEach(function (el) { revealObs.observe(el); });
    }

    /* ---------- Cards floating on water ---------- */
    (function () {
      if (reduceMotion.matches || !("IntersectionObserver" in window)) return;
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return;
      var els = document.querySelectorAll(".impact-card, .flip-card, .repo-card, .project-row, .about-facts, .arch-card, .language-badge, .education-card, .timeline-content, .contact-link, .swim-facts li");
      if (!els.length) return;
      els.forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        var cx = r.left + window.scrollX + r.width / 2, cy = r.top + window.scrollY + r.height / 2;
        var dur = 8.5 + ((i * 37) % 30) / 10;
        var phase = (cx * 0.0035 + cy * 0.0021) % 1;
        el.classList.add("float");
        el.style.setProperty("--fd", dur.toFixed(1) + "s");
        el.style.setProperty("--fl", (-phase * dur).toFixed(2) + "s");
        el.style.setProperty("--fy", (4 + (i % 4)) + "px");
        el.style.setProperty("--fr", (0.7 + ((i * 13) % 7) / 10).toFixed(1) + "deg");
        var sh = document.createElement("span");
        sh.className = "float-shadow";
        sh.setAttribute("aria-hidden", "true");
        el.appendChild(sh);
        sh.addEventListener("animationend", function (e) { if (e.animationName === "ripple-ring") sh.classList.remove("is-rippling"); });
        el.addEventListener("pointerenter", function () { sh.classList.remove("is-rippling"); void sh.offsetWidth; sh.classList.add("is-rippling"); });
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.target.classList.toggle("float-on", en.isIntersecting); });
      }, { rootMargin: "80px" });
      els.forEach(function (el) { io.observe(el); });
      // Safety net: if the page runs slowly, turn the floating off for good.
      setTimeout(function () {
        var n = 0, t0 = performance.now();
        (function tick() {
          n++;
          if (performance.now() - t0 < 2500) { requestAnimationFrame(tick); return; }
          if (n / 2.5 < 30) {
            io.disconnect();
            els.forEach(function (el) { el.classList.remove("float-on"); el.classList.remove("float"); });
            document.documentElement.classList.add("no-float");
          }
        })();
      }, 1500);
    })();

    /* ---------- Count-up ---------- */
    var counters = document.querySelectorAll(".impact-number");
    function setFinal(el) { el.textContent = el.dataset.target + (el.dataset.suffix || ""); }
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      counters.forEach(setFinal);
    } else {
      var countObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          countObs.unobserve(entry.target);
          var el = entry.target, target = +el.dataset.target, suffix = el.dataset.suffix || "", t0 = null, dur = 1600;
          requestAnimationFrame(function step(ts) {
            if (t0 === null) t0 = ts;
            var p = Math.min((ts - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
          });
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { countObs.observe(el); });
    }

    /* ---------- Language bars ---------- */
    var langs = document.querySelector(".languages-grid");
    if (langs) {
      if (!("IntersectionObserver" in window)) {
        langs.classList.add("is-visible");
      } else {
        var langObs = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) { langs.classList.add("is-visible"); langObs.disconnect(); }
        }, { threshold: 0.3 });
        langObs.observe(langs);
      }
    }

    /* ---------- Depth gauge ---------- */
    var depthVal = document.getElementById("depth-val");
    if (depthVal) {
      var depthTick = false;
      var updateDepth = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var f = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        root.style.setProperty("--d", f.toFixed(3));
        depthTick = false;
      };
      window.addEventListener("scroll", function () {
        if (!depthTick) { depthTick = true; requestAnimationFrame(updateDepth); }
      }, { passive: true });
      window.addEventListener("resize", updateDepth);
      updateDepth();
    }

    /* ---------- Active nav link ---------- */
    var links = document.querySelectorAll(".nav-link");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    if ("IntersectionObserver" in window) {
      var navObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) { a.classList.remove("active"); a.removeAttribute("aria-current"); });
          if (depthVal) { var kick = entry.target.querySelector(".section-kicker"); depthVal.textContent = kick ? kick.textContent : "0 m"; }
          var a = map[entry.target.id];
          if (a) { a.classList.add("active"); a.setAttribute("aria-current", "true"); }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      document.querySelectorAll("main section[id]").forEach(function (s) { navObs.observe(s); });
    }
  });
})();
