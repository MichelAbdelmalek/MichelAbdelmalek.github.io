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

    /* ---------- Particle canvas ---------- */
    var canvas = document.getElementById("particle-canvas");
    if (canvas && canvas.getContext && !reduceMotion.matches) {
      var ctx = canvas.getContext("2d");
      var w = 0, h = 0, particles = [], raf = 0, running = false, mouse = { x: -999, y: -999 };

      var resize = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var count = Math.min(90, Math.floor((w * h) / 14000));
        particles = [];
        for (var i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 1.6 + 0.8
          });
        }
      };
      var frame = function () {
        ctx.clearRect(0, 0, w, h);
        var rgb = getComputedStyle(root).getPropertyValue("--canvas-dot").trim() || "130,150,255";
        for (var i = 0; i < particles.length; i++) {
          var p = particles[i];
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(" + rgb + ",0.8)";
          ctx.fill();
          for (var j = i + 1; j < particles.length; j++) {
            var q = particles[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
            if (d < 12000) {
              ctx.strokeStyle = "rgba(" + rgb + "," + (0.22 * (1 - d / 12000)) + ")";
              ctx.lineWidth = 1;
              ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
            }
          }
          var mx = p.x - mouse.x, my = p.y - mouse.y, md = mx * mx + my * my;
          if (md < 14000) {
            ctx.strokeStyle = "rgba(" + rgb + "," + (0.4 * (1 - md / 14000)) + ")";
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          }
        }
        raf = requestAnimationFrame(frame);
      };
      var start = function () { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
      var stop = function () { running = false; cancelAnimationFrame(raf); };

      resize();
      window.addEventListener("resize", resize);
      canvas.parentElement.addEventListener("mousemove", function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
      });
      canvas.parentElement.addEventListener("mouseleave", function () { mouse.x = mouse.y = -999; });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries[0].isIntersecting ? start() : stop();
        }).observe(canvas);
      } else {
        start();
      }
    }

    /* ---------- 3D morphing particle scene ---------- */
    var c3 = document.getElementById("hero-3d");
    if (c3 && c3.getContext && !reduceMotion.matches) {
      var g = c3.getContext("2d");
      var S = 0, N = 1500, ay = 0, ax = 0.35, tx = 0, ty = 0, run3 = false, raf3 = 0, last3 = 0;
      var TAU = Math.PI * 2, PHI = (1 + Math.sqrt(5)) / 2;
      var frac = function (v) { return v - Math.floor(v); };

      var shapes = [
        function sphere(n) {
          var out = [];
          for (var i = 0; i < n; i++) {
            var y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = TAU * i / PHI;
            out.push([Math.cos(th) * r * 0.95, y * 0.95, Math.sin(th) * r * 0.95]);
          }
          return out;
        },
        function knot(n) {
          var out = [], k = function (t) {
            var m = 2 + Math.cos(3 * t);
            return [m * Math.cos(2 * t) / 3.1, m * Math.sin(2 * t) / 3.1, Math.sin(3 * t) / 3.1];
          };
          for (var i = 0; i < n; i++) {
            var t = TAU * i / n, p = k(t), q = k(t + 0.01);
            var T = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], l = Math.hypot(T[0], T[1], T[2]);
            T = [T[0] / l, T[1] / l, T[2] / l];
            var h = [0.3, 0.2, 1];
            var Nn = [T[1] * h[2] - T[2] * h[1], T[2] * h[0] - T[0] * h[2], T[0] * h[1] - T[1] * h[0]];
            l = Math.hypot(Nn[0], Nn[1], Nn[2]); Nn = [Nn[0] / l, Nn[1] / l, Nn[2] / l];
            var B = [T[1] * Nn[2] - T[2] * Nn[1], T[2] * Nn[0] - T[0] * Nn[2], T[0] * Nn[1] - T[1] * Nn[0]];
            var a = i * 2.399963, rr = 0.1 + 0.03 * Math.sin(i);
            out.push([p[0] + rr * (Math.cos(a) * Nn[0] + Math.sin(a) * B[0]) * 3.1 * 0.33 * 3,
                      p[1] + rr * (Math.cos(a) * Nn[1] + Math.sin(a) * B[1]) * 3.1 * 0.33 * 3,
                      p[2] + rr * (Math.cos(a) * Nn[2] + Math.sin(a) * B[2]) * 3.1 * 0.33 * 3]);
          }
          return out;
        },
        function helix(n) {
          var out = [], strands = Math.floor(n * 0.8);
          for (var i = 0; i < n; i++) {
            if (i < strands) {
              var s = i % 2, t = Math.floor(i / 2) / (strands / 2), ang = t * TAU * 2.2 + s * Math.PI;
              out.push([0.5 * Math.cos(ang), (t - 0.5) * 2, 0.5 * Math.sin(ang)]);
            } else {
              var j = i - strands, u = (Math.floor(j / 6) + 0.5) / ((n - strands) / 6), f = (j % 6) / 5;
              var a2 = u * TAU * 2.2, x0 = 0.5 * Math.cos(a2), z0 = 0.5 * Math.sin(a2);
              out.push([x0 * (1 - 2 * f), (u - 0.5) * 2, z0 * (1 - 2 * f)]);
            }
          }
          return out;
        },
        function torus(n) {
          var out = [], R = 0.7, r = 0.28;
          for (var i = 0; i < n; i++) {
            var a = frac(i * 0.7548776662) * TAU, b = frac(i * 0.5698402910) * TAU;
            out.push([(R + r * Math.cos(b)) * Math.cos(a), r * Math.sin(b), (R + r * Math.cos(b)) * Math.sin(a)]);
          }
          return out;
        }
      ].map(function (f) { return f(N); });

      var cur = 0, nxt = 1, morph = 0, hold = 0, HOLD_FRAMES = 150, MORPH_FRAMES = 120;
      var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

      var rings = [
        { r: 1.18, tilt: 1.15, tz: 0, sp: 0.004, sat: 0, ph: 0 },
        { r: 1.38, tilt: 0.45, tz: 1.2, sp: -0.003, sat: 0, ph: 2 },
        { r: 1.0, tilt: 1.5, tz: 2.4, sp: 0.005, sat: 0, ph: 4 }
      ];
      var trails = rings.map(function () { return []; });
      var size3 = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        S = c3.clientWidth;
        c3.width = S * dpr; c3.height = S * dpr;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        N = Math.min(shapes[0].length, S < 420 ? 900 : 1500);
      };
      var mix = function (a, b, t) {
        return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," + Math.round(a[1] + (b[1] - a[1]) * t) + "," + Math.round(a[2] + (b[2] - a[2]) * t) + ")";
      };
      var draw3 = function (ts) {
        if (ts - last3 < 14) { raf3 = requestAnimationFrame(draw3); return; }
        last3 = ts;

        if (morph === 0 && hold < HOLD_FRAMES) hold++;
        else { morph++; if (morph > MORPH_FRAMES) { cur = nxt; nxt = (nxt + 1) % shapes.length; morph = 0; hold = 0; } }
        var m = ease(Math.min(morph / MORPH_FRAMES, 1));

        ay += 0.006 + tx * 0.025; ax += (0.35 + ty * 0.9 - ax) * 0.04;
        var light = currentTheme() === "light";
        var c1 = light ? [29, 78, 216] : [59, 130, 246], c2 = light ? [109, 40, 217] : [155, 109, 255];
        var cy_ = Math.cos(ay), sy_ = Math.sin(ay), cx_ = Math.cos(ax), sx_ = Math.sin(ax);
        var CAM = 4, K = S * 0.25;

        g.clearRect(0, 0, S, S);
        var glow = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.5);
        glow.addColorStop(0, light ? "rgba(109,40,217,0.10)" : "rgba(139,92,246,0.18)");
        glow.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = glow; g.fillRect(0, 0, S, S);

        var A = shapes[cur], B = shapes[nxt], pulse = 1 + 0.03 * Math.sin(ts / 600);
        for (var i = 0; i < N; i++) {
          var a = A[i], b = B[i];
          var x = (a[0] + (b[0] - a[0]) * m) * pulse, y = (a[1] + (b[1] - a[1]) * m) * pulse, z = (a[2] + (b[2] - a[2]) * m) * pulse;
          var x1 = x * cy_ + z * sy_, z1 = -x * sy_ + z * cy_;
          var y2 = y * cx_ - z1 * sx_, z2 = y * sx_ + z1 * cx_;
          var f = CAM / (CAM - z2), d = (z2 + 1.2) / 2.4;
          g.globalAlpha = Math.max(0.12, Math.min(1, 0.2 + 0.85 * d));
          g.fillStyle = mix(c1, c2, i / N);
          g.beginPath();
          g.arc(S / 2 + x1 * K * f, S / 2 + y2 * K * f, (0.7 + 1.5 * d) * f * (S / 520 + 0.5), 0, TAU);
          g.fill();
        }

        for (var j = 0; j < rings.length; j++) {
          var R = rings[j], ct = Math.cos(R.tilt), st = Math.sin(R.tilt), cz = Math.cos(R.tz), sz = Math.sin(R.tz);
          R.tz += R.sp; R.ph += 0.018 + j * 0.006;
          var ringPt = function (th) {
            var px = R.r * Math.cos(th), pz = R.r * Math.sin(th), py = 0;
            var qy = py * ct - pz * st, qz = py * st + pz * ct;
            var rx = px * cz - qy * sz, ry = px * sz + qy * cz;
            var x1 = rx * cy_ + qz * sy_, z1 = -rx * sy_ + qz * cy_;
            var y2 = ry * cx_ - z1 * sx_, z2 = ry * sx_ + z1 * cx_, f = CAM / (CAM - z2);
            return [S / 2 + x1 * K * f, S / 2 + y2 * K * f, z2];
          };
          g.lineWidth = 1;
          g.strokeStyle = mix(c1, c2, j / rings.length);
          var prev = ringPt(0);
          for (var s = 1; s <= 72; s++) {
            var pt = ringPt(s / 72 * TAU);
            g.globalAlpha = 0.1 + 0.25 * ((pt[2] + 1.5) / 3);
            g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(pt[0], pt[1]); g.stroke();
            prev = pt;
          }
          var sp = ringPt(R.ph), tr = trails[j];
          tr.push(sp); if (tr.length > 16) tr.shift();
          for (var k = 0; k < tr.length; k++) {
            g.globalAlpha = (k / tr.length) * 0.5;
            g.fillStyle = "rgb(" + (light ? "109,40,217" : "190,170,255") + ")";
            g.beginPath(); g.arc(tr[k][0], tr[k][1], 1 + 2.5 * (k / tr.length), 0, TAU); g.fill();
          }
          g.globalAlpha = 1;
          g.fillStyle = light ? "#4c1d95" : "#ffffff";
          g.shadowColor = light ? "rgba(109,40,217,0.6)" : "rgba(160,140,255,0.9)"; g.shadowBlur = 12;
          g.beginPath(); g.arc(sp[0], sp[1], 4, 0, TAU); g.fill();
          g.shadowBlur = 0;
        }
        g.globalAlpha = 1;
        tx *= 0.95; ty *= 0.95;
        raf3 = requestAnimationFrame(draw3);
      };
      size3();
      window.addEventListener("resize", size3);
      var hero = document.getElementById("hero");
      hero.addEventListener("pointermove", function (e) {
        var r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width - 0.5;
        ty = (e.clientY - r.top) / r.height - 0.5;
      });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          if (en[0].isIntersecting) { if (!run3) { run3 = true; raf3 = requestAnimationFrame(draw3); } }
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

    /* ---------- Active nav link ---------- */
    var links = document.querySelectorAll(".nav-link");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    if ("IntersectionObserver" in window) {
      var navObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) { a.classList.remove("active"); a.removeAttribute("aria-current"); });
          var a = map[entry.target.id];
          if (a) { a.classList.add("active"); a.setAttribute("aria-current", "true"); }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      document.querySelectorAll("main section[id]").forEach(function (s) { navObs.observe(s); });
    }
  });
})();
