/* =========================================================
   דף הבית: קרטון תלת־ממדי
   הקרטון של אל יד חרוצים שנפתח בגלילה, בנוי ב-three.js עם טקסטורות מ-assets/img/box3d.
   ========================================================= */
(function () {
  // folder of the carton textures, worked out from this script's own address,
  // so it works on the Hebrew pages and inside en/, fr/, de/, es/ alike
  var BOX = new URL('../../img/box3d/', document.currentScript.src).href;
  if (typeof THREE === 'undefined') return;
  var canvas = document.getElementById('gl');
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.physicallyCorrectLights = true;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var scene = new THREE.Scene();
  var FOV = 26,
    CZ = 30,
    camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 200);
  camera.position.set(0, 0, CZ);

  /* studio environment for soft, realistic reflections */
  (function () {
    var env = new THREE.Scene(),
      room = new THREE.Mesh(
        new THREE.BoxGeometry(20, 12, 20),
        new THREE.MeshBasicMaterial({ color: 0x151412, side: THREE.BackSide })
      );
    env.add(room);
    function panel(w, h, c, i, x, y, z, lx, ly, lz) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.lookAt(lx, ly, lz);
      env.add(m);
    }
    panel(8, 5, 0xfff1e0, 5, -5, 5.5, 6, 0, 0, 0); // warm key softbox
    panel(5, 6, 0xdfe8ff, 1.6, 8, 1, 2, 0, 0, 0); // cool fill
    panel(10, 2, 0xffffff, 2.2, 0, -1, -9, 0, 0, 0); // rim strip
    panel(12, 12, 0xffffff, 0.9, 0, 5.9, 0, 0, 0, 0); // ceiling bounce
    var pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.02).texture;
    pm.dispose();
  })();
  var key = new THREE.DirectionalLight(0xfff1e2, 2.6),
    fill = new THREE.DirectionalLight(0xdde6ff, 0.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key);
  scene.add(key.target);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));

  /* textures */
  var loader = new THREE.TextureLoader(),
    maxAniso = renderer.capabilities.getMaxAnisotropy();
  function tex(u, srgb, rot) {
    var t = loader.load(u, function () {
      dirty = true;
    });
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = maxAniso;
    if (rot) {
      t.center.set(0.5, 0.5);
      t.rotation = rot;
    }
    return t;
  }
  var T = {
    front: tex(BOX + 'front.webp', 1),
    back: tex(BOX + 'back.webp', 1),
    end: tex(BOX + 'end.webp', 1),
    flapL: tex(BOX + 'flap-long.webp', 1),
    flapS: tex(BOX + 'flap-short.webp', 1),
    inside: tex(BOX + 'inside.webp', 1),
    edge: tex(BOX + 'edge.webp', 1),
    nrm: tex(BOX + 'normal-map.webp', 0)
  };
  T.edge.wrapS = THREE.RepeatWrapping;
  T.edge.repeat.set(24, 1);
  function mat(map, rough) {
    return new THREE.MeshStandardMaterial({
      map: map,
      normalMap: T.nrm,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: rough || 0.86,
      metalness: 0,
      envMapIntensity: 0.55
    });
  }
  var M = {
    front: mat(T.front),
    back: mat(T.back),
    end: mat(T.end),
    flapL: mat(T.flapL),
    flapS: mat(T.flapS),
    inside: mat(T.inside, 0.9),
    edge: new THREE.MeshStandardMaterial({ map: T.edge, roughness: 0.95 })
  };
  var tapeM = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xb88a52).convertSRGBToLinear(),
    roughness: 0.38,
    metalness: 0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
    transparent: true,
    opacity: 0.93,
    envMapIntensity: 0.55
  });

  /* build an open-top corrugated box: walls, floor, four hinged flaps */
  var BW = 1.4,
    BH = 1.0,
    BD = 1.0,
    t = 0.022;
  var box = new THREE.Group();
  function wall(w, h, outer) {
    // BoxGeometry order: +x,-x,+y,-y,+z(outer),-z(inner)
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, t), [M.edge, M.edge, M.edge, M.edge, outer, M.inside]);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
  var front = wall(BW, BH, M.front);
  front.position.z = BD / 2 - t / 2;
  box.add(front);
  var back = wall(BW, BH, M.back);
  back.rotation.y = Math.PI;
  back.position.z = -BD / 2 + t / 2;
  box.add(back);
  var endR = wall(BD - 2 * t, BH, M.end);
  endR.rotation.y = Math.PI / 2;
  endR.position.x = BW / 2 - t / 2;
  box.add(endR);
  var endL = wall(BD - 2 * t, BH, M.end);
  endL.rotation.y = -Math.PI / 2;
  endL.position.x = -BW / 2 + t / 2;
  box.add(endL);
  var floor = new THREE.Mesh(new THREE.BoxGeometry(BW - 2 * t, t, BD - 2 * t), [
    M.edge,
    M.edge,
    M.inside,
    M.inside,
    M.edge,
    M.edge
  ]);
  floor.position.y = -BH / 2 + t / 2;
  floor.receiveShadow = true;
  box.add(floor);
  function flap(w, d, topMat) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), [
      M.edge,
      M.edge,
      topMat,
      M.inside,
      M.edge,
      M.edge
    ]);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
  // long flaps (on top), hinged at front/back top edges
  var FL = [];
  [1, -1].forEach(function (sgn) {
    var piv = new THREE.Group();
    piv.position.set(0, BH / 2, sgn * (BD / 2 - t / 2));
    box.add(piv);
    var f = flap(BW, BD / 2 - 0.004, M.flapL);
    f.position.set(0, t / 2, -sgn * (BD / 4 - 0.002));
    piv.add(f);
    var tp = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.002, 0.003, 0.085), tapeM);
    tp.position.set(0, t / 2 + 0.0025, -sgn * (0.248 - 0.0425));
    f.add(tp);
    FL.push({ piv: piv, sgn: sgn });
  });
  // short flaps (underneath), hinged at the end walls
  var FS = [];
  [1, -1].forEach(function (sgn) {
    var piv = new THREE.Group();
    piv.position.set(sgn * (BW / 2 - t / 2), BH / 2 - t, 0);
    box.add(piv);
    var f = flap(0.47, BD - 2 * t - 0.01, M.flapS);
    f.position.set(-sgn * 0.235, t / 2, 0);
    piv.add(f);
    FS.push({ piv: piv, sgn: sgn });
  });
  // tape running down both ends
  [1, -1].forEach(function (sgn) {
    var tp = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.2, 0.17), tapeM);
    tp.position.set(sgn * (BW / 2 + 0.0016), BH / 2 - 0.1, 0);
    box.add(tp);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.003, 0.17), tapeM);
    cap.position.set(sgn * (BW / 2 - 0.012), BH / 2 + t + 0.002, 0);
    box.add(cap);
  });
  function setOpen(oL, oS) {
    FL.forEach(function (f) {
      f.piv.rotation.x = f.sgn * oL * 2.35;
    }); // swing out ~215°
    FS.forEach(function (f) {
      f.piv.rotation.z = -f.sgn * oS * 2.2;
    }); // ~195°
  }

  var spin = new THREE.Group(),
    root = new THREE.Group();
  spin.add(box);
  root.add(spin);
  scene.add(root);

  /* page hooks */
  var flow = document.getElementById('top'),
    rev = document.getElementById('reveal'),
    faller = document.querySelector('.faller'),
    A = [document.getElementById('a1')],
    sh = document.getElementById('sh'),
    rcap = document.getElementById('rcap');
  function cl(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function ease(v) {
    return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
  }
  function eio(v) {
    return v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
  }
  function seg(p, a, b) {
    return ease(cl((p - a) / (b - a)));
  }
  function outBack(v) {
    var c = 1.9;
    return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2);
  }
  function docC(el) {
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 + scrollY, w: r.width, h: r.height };
  }

  var vw = 0,
    vh = 0,
    U = 1,
    dirty = true;
  function resize() {
    vw = innerWidth;
    vh = EYvh();
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    U = (2 * CZ * Math.tan((FOV * Math.PI) / 360)) / vh;
    dirty = true;
  }
  function place(sx, sy, px) {
    root.position.set((sx - vw / 2) * U, -(sy - vh / 2) * U, 0);
    var sc = (px * U) / BW;
    root.scale.setScalar(sc);
    key.position.set(root.position.x - 3 * sc, root.position.y + 6 * sc, root.position.z + 5 * sc);
    key.target.position.copy(root.position);
    fill.position.set(root.position.x + 5 * sc, root.position.y + 1 * sc, root.position.z + 3 * sc);
    var c = key.shadow.camera,
      b = 1.3 * sc;
    c.left = -b;
    c.right = b;
    c.top = b;
    c.bottom = -b;
    c.near = 0.1;
    c.far = 20 * sc;
    c.updateProjectionMatrix();
  }

  function update() {
    var span = flow.offsetHeight - EYvh(),
      pinEnd = flow.offsetTop + span;
    var p = cl((scrollY - flow.offsetTop) / span);
    var rS = rev.offsetTop,
      rE = rev.offsetTop + rev.offsetHeight - EYvh(),
      r = cl((scrollY - rS) / (rE - rS));
    rcap.classList.toggle('on', scrollY >= rS && r >= 0.12 && r < 0.99);
    if (p < 0.83 && scrollY <= pinEnd) {
      root.visible = false;
      faller.style.opacity = 1;
      sh.style.opacity = 0;
      return;
    }
    root.visible = true;
    faller.style.opacity = 0;
    var f = docC(faller);
    var mob = vw < 700,
      S = Math.min(170, Math.max(92, vw * 0.13)),
      SF = S * 1.12,
      SB = mob ? vw * 0.62 : Math.min(vw * 0.32, vh * 0.48);
    var P0 = { x: f.x, y: f.y - f.h * 0.9, s: f.w, yaw: -0.35, pitch: 0.2 };
    var C0 = { x: vw / 2, y: rS + vh * 0.42, s: SB, yaw: -0.55 + Math.PI * 2, pitch: 0.42 };
    var C1 = { x: vw / 2, y: rE + vh * 0.42, s: SB, yaw: 0.55 + Math.PI * 2, pitch: 0.46 };
    var P = A.map(function (el) {
      var c = docC(el);
      return { x: c.x, y: c.y, s: SF, yaw: -0.5 + Math.PI * 4, pitch: 0.28 };
    });
    var x,
      y,
      s,
      yaw,
      pitch,
      oL = 0,
      oS = 0,
      landed = 0,
      wob = 0;
    var roll = 0;
    if (scrollY <= pinEnd) {
      var hv = seg(p, 0.88, 0.99);
      x = f.x;
      y = f.y - scrollY - hv * f.h * 0.9;
      s = f.w;
      yaw = lerp(0, -0.35, hv);
      pitch = lerp(0, 0.2, hv);
    } else if (scrollY < rS) {
      // fly to the centre while turning a full 360°
      var t1 = cl((scrollY - pinEnd) / (rS - pinEnd)),
        e1 = ease(t1);
      x = lerp(P0.x, C0.x, e1);
      y = lerp(P0.y, C0.y, e1) - Math.sin(t1 * Math.PI) * vh * 0.08 - scrollY;
      s = lerp(P0.s, C0.s, e1);
      yaw = lerp(P0.yaw, C0.yaw, e1);
      pitch = lerp(P0.pitch, C0.pitch, e1);
      wob = Math.sin(t1 * Math.PI);
    } else if (scrollY <= rE) {
      // pinned in the middle: flaps open
      x = vw / 2;
      y = vh * 0.42;
      s = SB;
      yaw = lerp(C0.yaw, C1.yaw, eio(r));
      pitch = lerp(C0.pitch, C1.pitch, eio(r)) + Math.sin(r * Math.PI) * 0.04;
      oL = seg(r, 0.12, 0.46);
      oS = seg(r, 0.34, 0.66);
      y += Math.sin(r * Math.PI * 2) * vh * 0.006;
    } else {
      var K1 = Math.max(rE + 300, P[0].y - vh * 0.5),
        tt = cl((scrollY - rE) / (K1 - rE)),
        e = ease(tt),
        a = C1,
        b = P[0];
      x = lerp(a.x, b.x, e) + Math.sin(tt * Math.PI) * vw * 0.06;
      y = lerp(a.y, b.y, e) - Math.sin(tt * Math.PI) * vh * 0.05;
      s = lerp(a.s, b.s, e);
      yaw = lerp(a.yaw, b.yaw, e);
      pitch = lerp(a.pitch, b.pitch, e) + Math.sin(tt * Math.PI) * 0.12;
      wob = Math.sin(tt * Math.PI);
      oL = 1 - seg(tt, 0, 0.3);
      oS = 1 - seg(tt, 0, 0.18); // fold the flaps back as it leaves
      landed = cl((tt - 0.84) / 0.12);
      y += (1 - outBack(cl((tt - 0.78) / 0.2))) * -10; // settle next to the heading
      if (scrollY >= K1) {
        x = b.x;
        y = b.y;
        s = b.s;
        yaw = b.yaw;
        pitch = b.pitch;
        oL = oS = 0;
        landed = 1;
      }
      y -= scrollY;
    }
    place(x, y, s);
    setOpen(oL, oS);
    spin.rotation.set(pitch, yaw, roll + Math.sin(wob * Math.PI) * 0.05);
    sh.style.opacity = landed * 0.9;
    sh.style.width = s * 1.15 + 'px';
    sh.style.height = s * 0.16 + 'px';
    sh.style.top = s * 0.36 + 'px';
  }
  function render() {
    update();
    renderer.render(scene, camera);
  }
  var q = false;
  function req() {
    if (!q) {
      q = true;
      requestAnimationFrame(function () {
        q = false;
        render();
      });
    }
  }
  addEventListener('scroll', req, { passive: true });
  EYonResize(function () {
    resize();
    req();
  });
  resize();
  (function loop() {
    if (dirty) {
      dirty = false;
      render();
    }
    requestAnimationFrame(loop);
  })();
  setTimeout(req, 300);
})();
