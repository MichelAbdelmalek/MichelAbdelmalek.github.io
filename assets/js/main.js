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

    /* ---------- 3D pool scene: caustics floor, lane ropes, ripples ---------- */
    var c3 = document.getElementById("hero-3d");
    if (c3 && c3.getContext) {
      var g = c3.getContext("2d");
      var lo = document.createElement("canvas"), lg = lo.getContext("2d");
      var W3 = 0, H3 = 0, LW = 0, LH = 0, img = null, t3 = 0, run3 = false, raf3 = 0, last3 = 0, frameN = 0;
      var ptr = { x: 0, y: 0, on: 0, lastRip: 0 }, ripples = [];
      var hexRgb = function (hex) {
        hex = hex.trim();
        if (hex.charAt(0) !== "#") return null;
        if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        return [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
      };
      var size3 = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        W3 = c3.clientWidth; H3 = c3.clientHeight;
        c3.width = W3 * dpr; c3.height = H3 * dpr;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        LW = Math.max(40, Math.ceil(W3 / 5)); LH = Math.max(30, Math.ceil(H3 / 5));
        lo.width = LW; lo.height = LH;
        img = lg.createImageData(LW, LH);
      };
      var caustics = function (rgb) {
        var d = img.data, hy = LH * 0.2, cx = LW * 0.55;
        for (var py = 0; py < LH; py++) {
          var yn = (py - hy) / (LH - hy);
          for (var px = 0; px < LW; px++) {
            var i = (py * LW + px) * 4;
            if (yn <= 0.02) { d[i + 3] = 0; continue; }
            var z = 1 / (yn + 0.12);
            var fx = (px - cx) / LW * z * 5.5, fz = z * 3.2;
            var s1 = Math.sin(fx * 1.1 + 1.7 * Math.sin(fz * 0.8 + t3 * 0.7));
            var s2 = Math.sin(fz * 1.3 + 1.5 * Math.sin(fx * 0.7 - t3 * 0.6));
            var v = 1 - Math.abs(Math.sin(s1 * 2.1 + s2 * 2.1));
            v = v * v * v * v;
            var fade = Math.min(1, yn * 2.2);
            d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
            d[i + 3] = Math.min(255, v * fade * 230);
          }
        }
        lg.putImageData(img, 0, 0);
      };
      var draw3 = function (ts) {
        var dt = last3 ? Math.min(0.05, (ts - last3) / 1000) : 0.016; last3 = ts;
        t3 += dt; frameN++;
        var cs = getComputedStyle(root);
        var dot = (cs.getPropertyValue("--canvas-dot").trim() || "125,211,252").split(",").map(Number);
        var strong = hexRgb(cs.getPropertyValue("--text-strong")) || [255, 255, 255];
        if (frameN % 2 === 0 || frameN === 1) caustics(dot);
        g.clearRect(0, 0, W3, H3);
        var hy = H3 * 0.2, cx = W3 * 0.55;
        // floor light
        var fl = g.createLinearGradient(0, hy, 0, H3);
        fl.addColorStop(0, "rgba(" + dot + ",0)"); fl.addColorStop(1, "rgba(" + dot + ",0.14)");
        g.fillStyle = fl; g.fillRect(0, hy, W3, H3 - hy);
        g.imageSmoothingEnabled = true;
        g.globalAlpha = 0.9; g.drawImage(lo, 0, 0, W3, H3); g.globalAlpha = 1;
        // lane ropes with buoys
        var lanes = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5], zMax = 16, i, k;
        for (k = 0; k < lanes.length; k++) {
          var u = lanes[k];
          g.beginPath();
          for (var zz = zMax; zz >= 1; zz -= 0.25) {
            var s = 1 / zz;
            var sway = Math.sin(zz * 1.7 + t3 * 1.2 + k) * 3 * s;
            var px2 = cx + u * W3 * 0.4 * s + sway, py2 = hy + (H3 * 1.02 - hy) * s;
            if (zz === zMax) g.moveTo(px2, py2); else g.lineTo(px2, py2);
          }
          g.strokeStyle = "rgba(" + dot + ",0.45)"; g.lineWidth = 1.4; g.stroke();
          for (i = 0; i < 26; i++) {
            var z2 = 1 + i * 0.6;
            if (z2 > zMax) break;
            var s2 = 1 / z2;
            var bx = cx + u * W3 * 0.4 * s2 + Math.sin(z2 * 1.7 + t3 * 1.2 + k) * 3 * s2;
            var by = hy + (H3 * 1.02 - hy) * s2 + Math.sin(t3 * 2 + i + k) * 1.5 * s2;
            var br = Math.max(1, 7 * s2);
            var a = Math.min(1, 1.2 - z2 / zMax);
            g.beginPath(); g.ellipse(bx, by, br, br * 0.7, 0, 0, Math.PI * 2);
            g.fillStyle = (i % 2 ? "rgba(" + dot + "," : "rgba(" + strong + ",") + (0.85 * a).toFixed(2) + ")";
            g.fill();
          }
        }
        // cursor ripples
        if (ptr.on && ts - ptr.lastRip > 140) { ripples.push({ x: ptr.x, y: ptr.y, r: 0 }); ptr.lastRip = ts; ptr.on = 0; }
        for (i = ripples.length - 1; i >= 0; i--) {
          var rp = ripples[i]; rp.r += dt * 70;
          var ra = 1 - rp.r / 120;
          if (ra <= 0) { ripples.splice(i, 1); continue; }
          g.beginPath(); g.ellipse(rp.x, rp.y, rp.r, rp.r * 0.35, 0, 0, Math.PI * 2);
          g.strokeStyle = "rgba(" + strong + "," + (0.5 * ra).toFixed(2) + ")"; g.lineWidth = 1.2; g.stroke();
        }
        raf3 = requestAnimationFrame(draw3);
      };
      size3();
      window.addEventListener("resize", size3);
      c3.parentElement.addEventListener("pointermove", function (e) {
        var r = c3.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
        ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = 1;
      });
      if (reduceMotion.matches) {
        t3 = 2; draw3(performance.now()); cancelAnimationFrame(raf3);
      } else if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { if (!run3) { run3 = true; last3 = 0; raf3 = requestAnimationFrame(draw3); } }
          else { run3 = false; cancelAnimationFrame(raf3); }
        }).observe(c3);
      } else { run3 = true; raf3 = requestAnimationFrame(draw3); }
    }

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
        }, { threshold: 0.08, rootMargin: "0px 0px -60px 0px" });
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
          var target = entry.target, delay = batch * 90;
          target.style.transitionDelay = delay + "ms";
          batch++;
          target.classList.add("revealed");
          setTimeout(function () { target.style.transitionDelay = ""; }, delay + 800);
          revealObs.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
      revealEls.forEach(function (el) { revealObs.observe(el); });
    }

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
