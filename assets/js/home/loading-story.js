/* =========================================================
   דף הבית: סיפור הטעינה
   מונע בגלילה בלבד: המנוף מרים את המכולה מהערימה, מסתובב, מניח אותה על המשאית,
   והמשאית יוצאת לדרך. כולל את מכונת הקידוח והאפקטים שלה.
   ========================================================= */
/* Loading story, driven only by scroll: the reach stacker takes our container off a stack, turns to face us,
   sets it on the truck, and the camera goes straight to the truck close-up in the next section. */
(function () {
  var sec = document.getElementById('works'),
    G = window.__EY;
  if (!sec || !G) return;
  var IW = G.IW,
    IH = G.IH;
  var contSrc = (document.getElementById('cont') || {}).src || '',
    tb = document.querySelector('#top .base'),
    tw = [].slice.call(document.querySelectorAll('#top .wheel'));
  [].forEach.call(document.querySelectorAll('#cbox .ff,#cbox .fb'), function (e) {
    e.src = contSrc;
  });
  document.querySelector('#cbox .fr').src = document.querySelector('#cbox .fl').src;
  var trk = document.getElementById('trk'),
    twh = [].slice.call(trk.querySelectorAll('.twh'));
  var hT = document.getElementById('handT'),
    hC = document.getElementById('handC'),
    hW = [].slice.call(hT.querySelectorAll('.hw'));
  if (tb) {
    trk.querySelector('.tbase').src = tb.src;
    hT.querySelector('.hb').src = tb.src;
  }
  hC.src = contSrc;
  twh.forEach(function (e, i) {
    if (tw[i]) e.style.backgroundImage = tw[i].style.backgroundImage;
  });
  hW.forEach(function (e, i) {
    if (tw[i]) e.style.backgroundImage = tw[i].style.backgroundImage;
  });
  var scn = document.getElementById('stScene'),
    mStk = document.getElementById('mStk'),
    rStk = document.getElementById('rStk'),
    boom = document.getElementById('boomg'),
    cyl = document.getElementById('cylg'),
    spr = document.getElementById('sprg'),
    cw = document.getElementById('cw'),
    cbox = document.getElementById('cbox'),
    ff = cbox.querySelector('.ff'),
    locks = [].slice.call(cbox.querySelectorAll('.lock')),
    w0 = document.getElementById('whl0'),
    w1 = document.getElementById('whl1'),
    stack = document.getElementById('stack'),
    scB = document.getElementById('scB'),
    scO = document.getElementById('scO'),
    spd = document.getElementById('speedo'),
    spdB = spd.querySelector('b'),
    cov = document.getElementById('gcover'),
    fade = [].slice.call(rStk.querySelectorAll(':scope>img,:scope>i,#boomg>*')), // the machine itself (not the spreader)
    stg = document.getElementById('stg'),
    whead = document.getElementById('whead'),
    dwrap = document.getElementById('dwrap'),
    scap = document.getElementById('scap'),
    floor = sec.querySelector('.sfloor'),
    mDr = document.getElementById('mDrill'),
    rDr = document.getElementById('rDrill'),
    cv = document.getElementById('fxDrill'),
    cx = cv.getContext('2d'),
    reduce = matchMedia('(prefers-reduced-motion: reduce)').matches,
    arrived = { d: true },
    dtb = document.getElementById('dtb'),
    dtt = document.getElementById('dtt'),
    dspr = document.getElementById('dspr'),
    dcap = document.querySelector('#dwrap .wcap');
  function cl(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  function eio(u) {
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  } // hydraulic: slow start, slow stop
  function seg(u, a, b) {
    return eio(cl((u - a) / (b - a)));
  }
  function lin(u, a, b) {
    return cl((u - a) / (b - a));
  }
  var CB = [830, 662],
    CT = [617, 292],
    a0 = Math.atan2(CT[1] - CB[1], CT[0] - CB[0]),
    L0 = Math.hypot(CT[0] - CB[0], CT[1] - CB[1]);
  var hk = G.hang(G.PICK),
    hp = G.hang(G.PLACE),
    hu = G.hang(G.UP),
    EYE = 0.62;
  trk.style.left = (G.TL / IW) * 100 + '%';
  trk.style.top = (G.TT / IH) * 100 + '%';
  trk.style.width = (G.TW / IW) * 100 + '%';
  trk.style.height = (G.TH / IH) * 100 + '%';
  rStk.style.transformOrigin = (G.AX / IW) * 100 + '% ' + EYE * 100 + '% 0';
  function setBoom(th) {
    boom.style.transform = 'rotate(' + th + 'deg)';
    var h = G.hang(th);
    spr.style.transform = 'translate(' + (h[0] / IW) * 100 + '%,' + (h[1] / IH) * 100 + '%)';
    var t = G.R(CT, G.PIV, th),
      a = Math.atan2(t[1] - CB[1], t[0] - CB[0]),
      s = Math.hypot(t[0] - CB[0], t[1] - CB[1]) / L0,
      d0 = (a0 * 180) / Math.PI,
      da = ((a - a0) * 180) / Math.PI;
    cyl.style.transform =
      'rotate(' + da + 'deg) rotate(' + d0 + 'deg) scaleX(' + s + ') rotate(' + -d0 + 'deg)';
    return h;
  }
  /* ---- layout ---- */
  var L = {},
    R0 = null;
  function layout() {
    var W = sec.clientWidth,
      H = sec.clientHeight;
    if (!W) return;
    var st = G.stage(W, H),
      u = st.u0;
    L = { W: W, H: H, u: u, left: st.left, top: st.top, band: G.band(W, H) };
    scn.style.left = st.left + 'px';
    scn.style.top = st.top + 'px';
    scn.style.width = IW * u + 'px';
    scn.style.height = IH * u + 'px';
    sec.style.setProperty('--fy', st.fy + 'px');
    // the two containers left on the stack, end-on
    var sx = st.left + (G.XC - G.CD / 2) * u,
      sy = st.top + (G.GND - G.CH) * u;
    stack.style.left = sx + 'px';
    stack.style.top = sy + 'px';
    stack.style.width = (G.CD * 2 + 8) * u + 'px';
    stack.style.height = G.CH * u + 'px';
    scB.style.cssText = 'left:0;top:0;width:' + G.CD * u + 'px;height:' + G.CH * u + 'px';
    scO.style.cssText =
      'left:' + (G.CD + 8) * u + 'px;top:0;width:' + G.CD * u + 'px;height:' + G.CH * u + 'px';
    L.sx = sx;
    L.tx = W / 2 - (st.left + G.AX * u);
    L.off = -(st.left + L.tx + (G.TL + G.TW) * u + 20); // the truck waits past the left edge and backs in
    scn.style.perspective = IW * u * 2.4 + 'px';
    scn.style.perspectiveOrigin = (G.AX / IW) * 100 + '% ' + EYE * 100 + '%';
    spr.style.setProperty('--hz', (G.CD / 2) * u + 'px');
    spr.style.setProperty('--lz', (G.CL / 2) * u + 'px');
    spr.style.setProperty('--hh', (G.CH / 2) * u + 'px');
    var span = G.COMP[1] - G.COMP[0],
      mob = W < 768,
      u0,
      l0,
      t0,
      g0;
    // centre the opening block (heading + machines + captions) vertically, like the original layout
    whead.style.top = '';
    var hh = whead.offsetHeight,
      cwA = mob ? W * 0.88 : (W * 0.91) / 2,
      blk = mob
        ? hh + 10 + cwA / 2 + 64 + (G.GND - G.TOP) * (cwA / span) + 60
        : hh + 28 + cwA * 0.06 + cwA / 2 + 70;
    whead.style.top = Math.max(whead.offsetTop, (H - blk) / 2 + (mob ? 30 : 20)) + 'px';
    var hb = whead.offsetTop + whead.offsetHeight;
    if (!mob) {
      var cw = (W * 0.91) / 2,
        dx = W * 0.97 - cw,
        dt = hb + 28 + cw * 0.06,
        dh = cw / 2;
      dwrap.style.left = dx + 'px';
      dwrap.style.top = dt + 'px';
      dwrap.style.width = cw + 'px';
      g0 = dt + (dh * G.GND) / IH;
      u0 = Math.min((cw * 0.96) / span, (g0 - hb - 16) / (G.GND - G.TOP));
      l0 = W * 0.03 + (cw - span * u0) / 2 - G.COMP[0] * u0;
    } else {
      var cw2 = W * 0.88,
        dt2 = hb + 10,
        dh2 = cw2 / 2;
      dwrap.style.left = W * 0.06 + 'px';
      dwrap.style.top = dt2 + 'px';
      dwrap.style.width = cw2 + 'px';
      u0 = cw2 / span;
      g0 = dt2 + dh2 + 64 + (G.GND - G.TOP) * u0;
      l0 = W * 0.06 + (cw2 - span * u0) / 2 - G.COMP[0] * u0;
    }
    t0 = g0 - G.GND * u0;
    var k = u0 / u;
    L.k = k;
    L.ax = l0 - st.left * k;
    L.ay = t0 - st.top * k;
    scap.style.left = l0 + ((G.COMP[0] + G.COMP[1]) / 2) * u0 + 'px';
    scap.style.top = g0 + 14 + 'px';
    R0 = null;
  }
  addEventListener('resize', function () {
    layout();
    req();
  });
  layout();
  function rel(r, g) {
    return { x: r.left - g.left, y: r.top - g.top, w: r.width, h: r.height };
  }
  function put(el, r) {
    el.style.left = r.x + 'px';
    el.style.top = r.y + 'px';
    el.style.width = r.w + 'px';
    el.style.height = r.h + 'px';
  }
  function mix(a, b, e) {
    return {
      x: a.x + (b.x - a.x) * e,
      y: a.y + (b.y - a.y) * e,
      w: a.w + (b.w - a.w) * e,
      h: a.h + (b.h - a.h) * e
    };
  }
  var drP = 0,
    drT = 0;
  function story(U) {
    // U: whole sequence. First the text fades and the drill rig reverses out, then the stacker story (u) runs
    // the part after the container is set down (reframing for the close-up) gets only the last 12% of the scroll,
    // so the close-up follows right away
    U = U < 0.88 ? (U * 0.79) / 0.88 : 0.79 + ((U - 0.88) / 0.12) * 0.16;
    var u = cl(U + 0.05); // the stacker starts working while the drill rig is still backing out
    if (!L.W) layout();
    // opening shot: both machines under the heading; the drill rig leaves and the stacker takes the whole screen
    var z = seg(u, 0.22, 0.42),
      sc = L.k + (1 - L.k) * z;
    stg.style.transform = 'translate(' + L.ax * (1 - z) + 'px,' + L.ay * (1 - z) + 'px) scale(' + sc + ')';
    var hf = 1 - seg(U, 0.01, 0.06);
    whead.style.opacity = scap.style.opacity = dcap.style.opacity = String(hf);
    floor.style.opacity = String(z);
    // the drill rig reverses out (it faces left, so it backs away to the right)
    // slow, steady reverse over its own stretch of scroll; nothing else moves meanwhile
    drT = lin(U, 0.06, 0.2);
    drP = drT;
    var r1 = drP,
      e1 = r1 < 0.5 ? 2 * r1 * r1 : 1 - Math.pow(-2 * r1 + 2, 2) / 2,
      mv = r1 > 0 && r1 < 1;
    dwrap.style.opacity = String(1 - lin(r1, 0.85, 1));
    dwrap.style.transform =
      'translate(' + e1 * L.W * 0.62 + 'px,' + (mv ? Math.sin(performance.now() / 45) * 0.8 : 0) + 'px)';
    dwrap.style.visibility = r1 >= 1 ? 'hidden' : '';
    // tracks and drive sprocket turn with the distance travelled (backwards: sprocket clockwise, ground run of the track goes left)
    var unit = dwrap.offsetWidth / IW,
      dpx = e1 * L.W * 0.62,
      du = dpx / (unit || 1);
    dtb.style.setProperty('--tp', 22 * unit + 'px');
    dtt.style.setProperty('--tp', 22 * unit + 'px');
    dtb.style.backgroundPosition = -dpx + 'px 0';
    dtt.style.backgroundPosition = dpx + 'px 0';
    dtb.style.opacity = dtt.style.opacity = r1 > 0 ? '.92' : '0';
    dspr.style.transform = 'rotate(' + (du / 43) * 57.2958 + 'deg)';
    // boom: hover -> down onto the container -> lift half a container -> set down on the truck -> release
    var th;
    if (u < 0.25) th = G.HOVER + (G.PICK - G.HOVER) * seg(u, 0.1, 0.2);
    else if (u < 0.63) th = G.PICK + (G.UP - G.PICK) * seg(u, 0.25, 0.34);
    else if (u < 0.8) th = G.UP + (G.PLACE - G.UP) * seg(u, 0.65, 0.74);
    else th = G.PLACE + (G.REL - G.PLACE) * seg(u, 0.8, 0.85);
    var h = setBoom(th),
      held = u >= 0.2;
    var dx = held ? 0 : hk[0] - h[0],
      dy = held ? 0 : hk[1] - h[1];
    cw.style.transform = 'translate(' + (dx / IW) * 100 + '%,' + (dy / IH) * 100 + '%)'; // until locked, the container stays on the stack
    var lk = u >= 0.2 && u < 0.8;
    locks.forEach(function (l) {
      l.classList.toggle('on', lk);
    });
    // turn to face us and move to the centre while the stack slides away
    var e3 = seg(u, 0.25, 0.45),
      tn = 90 * seg(u, 0.27, 0.45),
      tx = L.tx * e3;
    scn.style.transform = 'translateX(' + tx + 'px)';
    var d = (tx / (110 * L.u)) * 57.2958;
    w0.style.transform = w1.style.transform = 'rotate(' + d + 'deg)';
    stack.style.transform = 'translateX(' + e3 * (L.W - L.sx + 40) + 'px)';
    // the spreader alone leaves up and to the left once the container is released
    var e7 = seg(u, 0.83, 0.95);
    rStk.style.transform =
      'translate(' + -e7 * L.W * 0.7 + 'px,' + -e7 * L.H * 0.8 + 'px) rotateY(' + -tn + 'deg)';
    // the machine disappears behind the truck
    var mo = String(1 - lin(u, 0.8, 0.84));
    fade.forEach(function (e) {
      e.style.opacity = mo;
    });
    // the truck comes in from the right, fading in, and stops under the container
    var e5 = seg(u, 0.46, 0.63),
      off = (1 - e5) * L.off;
    trk.style.opacity = String(lin(u, 0.46, 0.5));
    trk.style.transform = 'translate3d(' + off + 'px,0,' + (hp[0] - hu[0]) * L.u + 'px)';
    var wr = (off / (((G.TW * 0.05125) / 2) * L.u)) * 57.2958;
    twh.forEach(function (e) {
      e.style.transform = 'rotate(' + wr + 'deg)';
    });
    var rv = u > 0.46 && u < 0.63 && Math.floor(performance.now() / 300) % 2 === 0; // reversing light while backing in
    // from the release on, the loaded truck is drawn flat and reframed for the next section (no driving)
    var sw = u >= 0.8;
    if (!sw) {
      R0 = null;
      trk.style.visibility = u >= 0.46 ? 'visible' : 'hidden';
      cbox.style.visibility = '';
    } else if (!R0) {
      var rs = rStk.style.transform;
      rStk.style.transform = 'rotateY(-90deg)';
      setBoom(G.PLACE);
      trk.style.visibility = 'visible';
      cbox.style.visibility = '';
      var g = sec.getBoundingClientRect();
      R0 = { t: rel(trk.getBoundingClientRect(), g), c: rel(ff.getBoundingClientRect(), g) };
      rStk.style.transform = rs;
      setBoom(th);
    }
    if (sw) {
      trk.style.visibility = 'hidden';
      cbox.style.visibility = 'hidden';
    }
    hT.style.visibility = hC.style.visibility = 'visible';
    hT.style.opacity = hC.style.opacity = sw ? '1' : '0'; // always rendered so the swap never blinks
    if (!sw && L.band) {
      var B = L.band;
      put(hT, B);
      put(hC, { x: B.x + B.w * 0.3014, y: B.y + B.h * 0.3033, w: B.w * 0.6191, h: B.h * 0.4117 });
    }
    if (sw) {
      // the loaded truck stays exactly where it was set down; the next section zooms in from here
      put(hT, R0.t);
      // the flat container eases onto the exact spot it has on the close-up truck, so the hand-off has no jump
      var T0 = R0.t;
      put(
        hC,
        mix(R0.c, { x: T0.x + T0.w * 0.3014, y: T0.y + T0.h * 0.3033, w: T0.w * 0.6191, h: T0.h * 0.4117 }, seg(u, 0.81, 0.9))
      );
      hC.style.filter = 'brightness(' + (0.92 + 0.08 * seg(u, 0.82, 1)) + ')';
      // the truck does not drive: the camera simply reframes it for the close-up (wheels stay still)
      hW.forEach(function (e) {
        e.style.transform = 'rotate(0deg)';
      });
    }
    // no speedometer and no cover: once the container is down we go straight to the truck close-up
    spd.style.opacity = '0';
    cov.style.transform = 'translateY(101%)';
  }
  var visible = false,
    target = 0,
    cur = 0;
  window.__worksState = function (vis) {
    visible = vis;
    if (vis) req();
  };
  window.__worksProg = function (u) {
    target = u;
    req();
  };
  /* ---- drill effects ---- */
  var puffs = [],
    chips = [],
    pile = [],
    smoke = [];
  var BIT = [420, 850],
    GROUND = 857,
    EXH = [1335, 392],
    PIPE = [431, 205, 451, 665];
  function px() {
    var w = cv.clientWidth,
      h = cv.clientHeight,
      d = Math.min(devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * d)) {
      cv.width = Math.round(w * d);
      cv.height = Math.round(h * d);
    }
    // canvas spans -12%..112% horizontally and -30%..110% vertically of the drill image
    var sx = cv.width / (IW * 1.24),
      sy = cv.height / (IH * 1.4);
    cx.setTransform(sx, 0, 0, sy, IW * 0.12 * sx, IH * 0.3 * sy);
  }
  function puff(list, x, y, r, col, vx, vy, g, a) {
    list.push({ x: x, y: y, r: r, c: col, vx: vx, vy: vy, g: g, a: a });
  }
  function drawPuff(p) {
    var g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
    g.addColorStop(0, 'rgba(' + p.c + ',' + p.a + ')');
    g.addColorStop(1, 'rgba(' + p.c + ',0)');
    cx.fillStyle = g;
    cx.beginPath();
    cx.arc(p.x, p.y, p.r, 0, 6.283);
    cx.fill();
  }
  function drawChip(c) {
    cx.save();
    cx.translate(c.x, c.y);
    cx.rotate(c.r);
    var s = c.s;
    cx.fillStyle = c.c;
    cx.beginPath();
    cx.moveTo(-s, -s * 0.3);
    cx.lineTo(-s * 0.2, -s);
    cx.lineTo(s, -s * 0.4);
    cx.lineTo(s * 0.7, s * 0.6);
    cx.lineTo(-s * 0.6, s * 0.5);
    cx.closePath();
    cx.fill();
    cx.strokeStyle = 'rgba(255,225,195,.22)';
    cx.lineWidth = 1;
    cx.stroke();
    cx.restore();
  }
  var CHIP = ['#6e5a4a', '#57483c', '#7d6856', '#4a3e35', '#8a7461'];
  var last = null,
    dt = 1 / 60,
    T0 = null;
  function frame(ts) {
    raf = 0;
    if (!visible) return;
    if (T0 === null) T0 = ts;
    var t = (ts - T0) / 1000;
    dt = last === null ? 1 / 60 : Math.min(0.05, (ts - last) / 1000);
    last = ts;
    cur += (target - cur) * (1 - Math.pow(0.0005, dt));
    if (Math.abs(target - cur) < 1e-4) cur = target;
    // near the end the story may not lag far behind the scroll, so it is finished when the truck section takes over
    if (target > 0.7 && target - cur > 0.04) cur = target - 0.04;
    if (cur < target && target >= 1 && 1 - cur < 0.004) cur = 1;
    // the last stretch (truck driving off into the next section) follows the scroll exactly, so the hand-off can't jump
    story(cur);
    var drillOn = cur < 0.2;
    if (drillOn) {
      /* -- drill rig: drill (vibrate, dust, chips, spinning rod), pause, repeat -- */
      px();
      cx.clearRect(-IW * 0.12, -IH * 0.3, IW * 1.24, IH * 1.4);
      if (arrived.d) {
        var Q = 6.4,
          q = (t % Q) / Q,
          on = !reduce && q < 0.64 && cur < 0.06,
          ramp = on ? Math.min(1, q / 0.05, (0.64 - q) / 0.05) : 0;
        rDr.style.transform = on
          ? 'translate(' +
            (Math.random() - 0.5) * 1.1 * ramp +
            'px,' +
            (Math.random() - 0.5) * 0.9 * ramp +
            'px)'
          : 'none';
        if (on) {
          if (Math.random() < 0.55 * ramp)
            puff(
              puffs,
              BIT[0] + (Math.random() - 0.5) * 50,
              BIT[1] - 4,
              22 + Math.random() * 20,
              '168,146,122',
              (Math.random() - 0.4) * 70,
              -20 - Math.random() * 40,
              2.2,
              0.42
            );
          if (Math.random() < 0.5 * ramp)
            chips.push({
              x: BIT[0] + (Math.random() - 0.5) * 30,
              y: BIT[1] - 6,
              vx: (Math.random() - 0.5) * 260,
              vy: -120 - Math.random() * 220,
              s: 3 + Math.random() * 5,
              r: Math.random() * 6,
              vr: (Math.random() - 0.5) * 12,
              c: CHIP[(Math.random() * 5) | 0]
            });
        }
        if (Math.random() < (on ? 0.18 : 0.06))
          puff(
            smoke,
            EXH[0] + (Math.random() - 0.5) * 6,
            EXH[1] - 6,
            10,
            '150,150,150',
            (Math.random() - 0.3) * 20,
            -50 - Math.random() * 20,
            1.5,
            0.32
          );
        // rock cuttings pile at the bit
        chips.forEach(function (c) {
          c.vy += 1100 * dt;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          c.r += c.vr * dt;
          if (c.y > GROUND - Math.random() * 10) {
            c.y = GROUND - Math.random() * 8;
            c.dead = true;
            pile.push(c);
          }
        });
        chips = chips.filter(function (c) {
          return !c.dead;
        });
        if (pile.length > 170) pile.splice(0, pile.length - 170);
        [puffs, smoke].forEach(function (L) {
          L.forEach(function (p) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.985;
            p.r += p.g * 26 * dt;
            p.a -= 0.28 * dt;
          });
          for (var i = L.length - 1; i >= 0; i--) if (L[i].a <= 0) L.splice(i, 1);
        });
        // spinning drill rod: light bands sliding along the pipe
        if (on) {
          cx.save();
          cx.beginPath();
          cx.rect(PIPE[0], PIPE[1], PIPE[2] - PIPE[0], PIPE[3] - PIPE[1]);
          cx.clip();
          var off = (t * 900) % 60;
          for (var y = PIPE[1] - 60 + off; y < PIPE[3] + 60; y += 60) {
            var g = cx.createLinearGradient(0, y, 0, y + 26);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.5, 'rgba(255,255,255,' + 0.22 * ramp + ')');
            g.addColorStop(1, 'rgba(255,255,255,0)');
            cx.fillStyle = g;
            cx.beginPath();
            cx.moveTo(PIPE[0], y + 10);
            cx.lineTo(PIPE[2], y);
            cx.lineTo(PIPE[2], y + 26);
            cx.lineTo(PIPE[0], y + 36);
            cx.closePath();
            cx.fill();
          }
          cx.restore();
        }
        smoke.forEach(drawPuff);
        pile.forEach(drawChip);
        chips.forEach(drawChip);
        puffs.forEach(drawPuff);
      }
    }
    if (cur !== target || drillOn) req();
    else last = null;
  }
  var raf = 0;
  function req() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  story(0);
})();
