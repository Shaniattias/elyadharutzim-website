/* =========================================================
   דף הבית: מסך טעינה, משאית והופעה בגלילה
   מסך הפתיחה עם המונה (פעם אחת בכל ביקור), סצנת המשאית שנוסעת ומקבלת את המכולה,
   כניסת הכותרת, והופעת אלמנטים בגלילה. משתמש בספריית GSAP.
   ========================================================= */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tr(t) {
    return (window.EY_DICT || {})[t] || t;
  }
  var hasG = typeof gsap !== 'undefined';

  /* ---------- truck scene ---------- */
  var flow = document.getElementById('top'),
    pin = document.getElementById('pin'),
    cam = document.getElementById('cam'),
    cont = document.getElementById('cont'),
    B = document.getElementById('boxes'),
    prog = document.getElementById('prog'),
    cue = document.getElementById('cue'),
    fadeb = document.getElementById('fadeb'),
    hero = document.getElementById('hero'),
    caps = [].slice.call(document.querySelectorAll('.cap')),
    tcov = document.getElementById('tcov'),
    tspd = document.getElementById('tspd'),
    baseImg = document.querySelector('#top .base');
  var HANDOFF = 140; // px of the 360px overlap (CSS #top) where the truck section stays hidden
  var Z = 1.9,
    W = 6.5,
    H = (W * (1600 / 767)) / (320 / 228),
    G = 0.25,
    BED = 71.4,
    FLOOR = 86.9;
  var rows = [
    { n: 9, x: 31.0 },
    { n: 9, x: 31.0 },
    { n: 8, x: 31.0 + (W + G) * 0.5 },
    { n: 6, x: 31.0 + (W + G) * 1.5 }
  ];
  var faller = null,
    fx = 0,
    fy = 0,
    k = 0;
  rows.forEach(function (r, ri) {
    var top = BED - (ri + 1) * H - ri * 0.15;
    for (var i = 0; i < r.n; i++) {
      k++;
      var d = document.createElement('div');
      d.className = 'box' + (k % 3 === 0 ? ' flip' : '');
      var left = r.x + i * (W + G);
      d.style.left = left + '%';
      d.style.top = top + '%';
      d.style.zIndex = String(10 + ri);
      d.style.filter = 'brightness(' + [1, 0.95, 1.04, 0.92, 0.99, 1.06, 0.96][k % 7] + ')';
      B.appendChild(d);
      if (ri === 2 && i === r.n - 1) {
        faller = d;
        fx = left;
        fy = top;
        d.className = 'box faller';
      }
    }
  });
  var FT = FLOOR - H;
  var path = [
    [0, fx, fy, 0],
    [0.18, fx + 2.5, fy - 6, 9],
    [0.5, 91.2, 55, 24],
    [0.8, 92, FT, 4],
    [0.9, 92, FT - 2.4, -3],
    [1, 92, FT, 0]
  ];
  function cl(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  function ease(v) {
    return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
  }
  function seg(p, a, b) {
    return ease(cl((p - a) / (b - a)));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  var VW = 0,
    VH = 0;
  function size() {
    var vw = innerWidth,
      vh = pin.clientHeight;
    VW = Math.min(vw * (vw < 700 ? 0.96 : 0.86), vh * 1.35);
    VH = (VW * 767) / 1600;
    cam.style.width = VW * Z + 'px';
  }
  function frame() {
    var r = flow.getBoundingClientRect(),
      span = flow.offsetHeight - innerHeight - HANDOFF;
    // eased exactly like the opening story, so the motion feels the same on both sides of the hand-off
    var pT = cl((-r.top - HANDOFF) / span),
      now = performance.now(),
      dtp = __pL ? Math.min(0.05, (now - __pL) / 1000) : 1 / 60;
    __pL = now;
    if (__pS === null || reduce) __pS = pT;
    else {
      __pS += (pT - __pS) * (1 - Math.pow(0.0005, dtp));
      if (Math.abs(pT - __pS) < 1e-4) __pS = pT;
    }
    if (__pS !== pT) __more = true;
    var p = __pS,
      vh = pin.clientHeight;
    // kept rendered (opacity, not visibility) so its images are already decoded when it takes over: no blink
    // shown only once both scenes stand still (pinned), HANDOFF px into the overlap
    var hid = r.top > -HANDOFF;
    pin.style.opacity = hid ? '0' : '1';
    pin.style.pointerEvents = hid ? 'none' : ''; // takes over exactly where the opening story ends
    var h0 = seg(p, 0, 0.07),
      a = seg(p, 0.07, 0.19),
      b = seg(p, 0.19, 0.34),
      c = seg(p, 0.34, 0.44);
    // hero state: truck sits low, below the headline
    // same width the opening story uses (page width without the scrollbar), so the truck lines up exactly
    var pw = pin.clientWidth || innerWidth,
      bd = window.__EY ? __EY.band(pw, vh) : null;
    // start at the size the opening story left the truck at (measured below), so the close-up continues from it
    var heroS = window.__hoW ? window.__hoW / VW : bd ? bd.w / VW : vw() < 700 ? 1 : 0.92;
    var lowY = bd ? bd.cy - vh / 2 : vh * 0.03;
    var s = lerp(heroS, Math.max(1, heroS), h0); // never shrink before zooming in
    s = lerp(s, 1.9, a);
    s = lerp(s, 1.75, b);
    s = lerp(s, 1, c);
    var fxp = lerp(0.5, 0.2, a);
    fxp = lerp(fxp, 0.78, b);
    fxp = lerp(fxp, 0.5, c);
    var fyp = lerp(0.5, 0.58, a);
    fyp = lerp(fyp, 0.5, c);
    var baseY = lerp(lowY, -vh * 0.02, h0);
    var bx = bd ? (bd.cx - pw / 2) * (1 - h0) : 0;
    var TX = bx - (fxp - 0.5) * VW * s,
      TY = baseY - (fyp - 0.5) * VH * s;
    cam.style.transform = 'translate(-50%,-50%) translate(' + TX + 'px,' + TY + 'px) scale(' + s / Z + ')';
    // pixel-exact hand-off: line our truck up with the one the opening story left on screen (scrollbars, rounding…)
    var hT = document.getElementById('handT');
    // measured while the opening story is still pinned, then kept (the opening scrolls away after the hand-off)
    if (hT && r.top >= -HANDOFF) {
      var hr = hT.getBoundingClientRect(),
        br = baseImg.getBoundingClientRect();
      var pr = pin.getBoundingClientRect();
      if (hr.width > 0) {
        window.__hoD = [hr.left - (br.left - pr.left), hr.top - (br.top - pr.top)];
        window.__hoW = hr.width;
      }
    } // relative to the pin (stuck at the top once it takes over)
    var D = window.__hoD;
    if (D && h0 < 1)
      cam.style.transform =
        'translate(-50%,-50%) translate(' +
        (TX + D[0] * (1 - h0)) +
        'px,' +
        (TY + D[1] * (1 - h0)) +
        'px) scale(' +
        s / Z +
        ')';
    // hero text leaves
    if (hero && heroReady) {
      hero.style.opacity = 1 - h0;
      hero.style.transform = 'translateY(' + -40 * h0 + 'px)';
      hero.style.filter = 'blur(' + 8 * h0 + 'px)';
      hero.style.pointerEvents = h0 > 0.5 ? 'none' : 'auto';
    }
    fadeb.style.opacity = h0;
    // the old "drive" cover and speedometer are no longer used: the truck stays visible through the hand-off
    if (tcov) {
      tcov.style.transform = 'translateY(101%)';
      tspd.style.opacity = '0';
    }
    var lift = seg(p, 0.47, 0.66);
    cont.style.transform = 'translateY(' + -lift * 74 + '%)';
    window.__lift = lift;
    var q = cl((p - 0.7) / 0.13),
      L = fx,
      T = fy,
      R = 0;
    for (var i = 1; i < path.length; i++) {
      if (q <= path[i][0]) {
        var A = path[i - 1],
          Bp = path[i],
          t = (q - A[0]) / (Bp[0] - A[0]);
        L = lerp(A[1], Bp[1], t);
        T = lerp(A[2], Bp[2], t);
        R = lerp(A[3], Bp[3], t);
        break;
      }
    }
    if (q >= 1) {
      L = 92;
      T = FT;
      R = 0;
    }
    faller.style.left = L + '%';
    faller.style.top = T + '%';
    faller.style.transform = 'rotate(' + R + 'deg)';
    caps.forEach(function (el) {
      el.classList.toggle('on', p >= +el.dataset.from && p < +el.dataset.to);
    });
    prog.style.setProperty('--p', p);
    cue.style.opacity = 0;
  }
  function vw() {
    return innerWidth;
  }

  /* drive-in */
  var rig = document.getElementById('rig'),
    wheels = [].slice.call(document.querySelectorAll('.wheel')),
    lines = document.getElementById('lines'),
    dust = [1, 2, 3].map(function (i) {
      return document.getElementById('d' + i);
    });
  for (var i = 0; i < 7; i++) {
    var l = document.createElement('i');
    l.style.top = 36 + i * 7 + (i % 2) * 2 + '%';
    l.style.left = 99 + (i % 3) * 5 + '%';
    l.style.width = 20 + ((i * 37) % 25) + '%';
    lines.appendChild(l);
  }
  var WR = 41 / 1600,
    introDone = false,
    heroReady = false;
  function setDrive(x, pitch) {
    rig.style.transform = 'translateX(' + x * cam.offsetWidth + 'px) rotate(' + pitch + 'deg)';
    wheels.forEach(function (el) {
      el.style.transform = 'rotate(' + (x / WR) * 57.3 + 'deg)';
    });
  }
  var driveStarted = false;
  function drive() {
    if (driveStarted) return;
    var r0 = flow.getBoundingClientRect();
    if (reduce || r0.top < -20) {
      driveStarted = true;
      setDrive(0, 0);
      introDone = true;
      frame();
      return;
    }
    if (r0.top > innerHeight * 0.55) {
      // wait until the truck section is on screen
      var io = new IntersectionObserver(
        function (es) {
          if (es[0].intersectionRatio > 0 && flow.getBoundingClientRect().top < innerHeight * 0.55) {
            io.disconnect();
            drive();
          }
        },
        { threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] }
      );
      io.observe(flow);
      addEventListener(
        'scroll',
        function chk() {
          if (!driveStarted && flow.getBoundingClientRect().top < innerHeight * 0.55) {
            removeEventListener('scroll', chk);
            drive();
          }
        },
        { passive: true }
      );
      return;
    }
    driveStarted = true;
    var T0 = null,
      DRIVE = 2300,
      SETTLE = 900,
      START = 1.3,
      stopped = false;
    setDrive(START, 0);
    requestAnimationFrame(function step(ts) {
      if (T0 === null) T0 = ts;
      var t = ts - T0;
      if (t < DRIVE) {
        var u = t / DRIVE,
          e = 1 - Math.pow(1 - u, 3),
          speed = 3 * Math.pow(1 - u, 2);
        setDrive(START * (1 - e), Math.sin(t / 55) * 0.07 * speed);
        lines.style.opacity = Math.min(1, speed * 0.9);
        requestAnimationFrame(step);
      } else if (t < DRIVE + SETTLE) {
        var v = (t - DRIVE) / SETTLE;
        if (!stopped) {
          stopped = true;
          lines.style.opacity = 0;
          dust.forEach(function (d, i) {
            d.style.left = 62 + i * 9 + '%';
            d.style.top = 74 + i * 1.5 + '%';
            d.animate(
              [
                { opacity: 0.9, transform: 'scale(.4)' },
                { opacity: 0, transform: 'scale(1.8) translateX(' + (30 + i * 15) + '%)' }
              ],
              { duration: 1100 + i * 200, easing: 'ease-out' }
            );
          });
        }
        setDrive(0, -0.9 * Math.exp(-v * 5) * Math.cos(v * 12));
        requestAnimationFrame(step);
      } else {
        setDrive(0, 0);
        introDone = true;
        frame();
      }
    });
  }
  setDrive(0, 0);
  driveStarted = true;
  introDone = true; // the truck arrives from the opening story

  /* hero entrance */
  function heroIn() {
    heroReady = true;
  }

  /* loader */
  var loader = document.getElementById('loader'),
    lw = document.getElementById('lw'),
    lc = document.getElementById('lc'),
    lb = document.getElementById('lb');
  var words = [
      // the words are translated on the English/French/German/Spanish pages (assets/js/i18n)
      '<b>18</b><small>' + tr('מדינות · פרויקטים ומסחר') + '</small>',
      '<b>4</b><small>' + tr('יבשות') + '</small>',
      '<b>$300M+</b><small>' + tr('מסחר פיזי במתכות מאז 2022') + '</small>'
    ],
    wi = 0;
  function finishLoad() {
    loader.classList.add('done');
    document.body.classList.remove('locked');
    heroIn();
    drive();
  }

  var seen = false,
    still = false;
  try {
    seen = !!sessionStorage.getItem('ey-seen');
    sessionStorage.setItem('ey-seen', '1');
    still = !!JSON.parse(localStorage.getItem('ey-a11y') || '{}').still;
  } catch (e) {}
  if (reduce || seen || still) {
    finishLoad();
  } // the intro plays once per visit
  else {
    requestAnimationFrame(function () {
      loader.classList.add('in');
    });
    var wt = setInterval(function () {
      lw.classList.add('out');
      setTimeout(function () {
        wi = (wi + 1) % words.length;
        lw.innerHTML = words[wi];
        lw.classList.remove('out');
        lw.classList.add('pre');
        void lw.offsetWidth;
        lw.classList.remove('pre');
      }, 350);
    }, 900);
    var L0 = null;
    requestAnimationFrame(function tick(ts) {
      if (L0 === null) L0 = ts;
      var u = Math.min(1, (ts - L0) / 2700),
        n = Math.round(u * 100);
      lc.textContent = String(n).padStart(3, '0');
      lb.style.transform = 'scaleX(' + n / 100 + ')';
      if (u < 1) requestAnimationFrame(tick);
      else {
        clearInterval(wt);
        setTimeout(finishLoad, 400);
      }
    });
  }

  /* nav */

  function navState() {}

  /* reveals + counters */
  var io = new IntersectionObserver(
    function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('vis');
          io.unobserve(e.target);
          var b = e.target.querySelector('b[data-n]');
          if (b) count(b);
        }
      });
    },
    { rootMargin: '0px 0px -100px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(function (el, i) {
    if (el.classList.contains('card') || el.classList.contains('entry'))
      el.style.transitionDelay = (i % 4) * 0.08 + 's';
    io.observe(el);
  });
  function count(b) {
    var n = +b.dataset.n,
      s = b.dataset.s !== undefined ? b.dataset.s : '+',
      pf = b.dataset.p || '',
      t0 = null;
    if (reduce) {
      b.textContent = pf + n.toLocaleString('en-US') + s;
      return;
    }
    requestAnimationFrame(function st(ts) {
      if (t0 === null) t0 = ts;
      var u = Math.min(1, (ts - t0) / 1600),
        e = 1 - Math.pow(1 - u, 3);
      b.textContent = pf + Math.round(n * e).toLocaleString('en-US') + s;
      if (u < 1) requestAnimationFrame(st);
    });
  }

  var tick = false;
  var __pS = null,
    __pL = 0,
    __more = false;
  function req() {
    if (!tick) {
      tick = true;
      requestAnimationFrame(function () {
        tick = false;
        __more = false;
        frame();
        navState();
        if (__more) req();
        else __pL = 0;
      });
    }
  }
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', function () {
    size();
    req();
  });
  size();
  frame();
  navState();
})();
