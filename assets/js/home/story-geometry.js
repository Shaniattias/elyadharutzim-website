/* =========================================================
   גאומטריה משותפת של סיפור הטעינה
   מידות ונקודות מפתח בציור של המנוף (reach stacker), בפיקסלים של התמונה המקורית.
   משמש את home.js ואת loading-story.js דרך window.__EY.
   ========================================================= */
/* Shared geometry of the loading story (image pixels of the 1774x887 reach-stacker drawing) */
(function () {
  var G = { IW: 1774, IH: 887, GND: 859, PIV: [340, 410], HANG: [1445, 132], CC: 1472.4, CY: 352, CH: 300 };
  G.CL = (G.CH * 2324) / 741;
  G.CD = G.CH * 0.94;
  G.TW = G.CL / 0.6191;
  G.TH = (G.TW * 1800) / 3753;
  G.TT = G.GND - 0.85 * G.TH;
  function R(p, o, deg) {
    var r = (deg * Math.PI) / 180,
      x = p[0] - o[0],
      y = p[1] - o[1];
    return [o[0] + x * Math.cos(r) - y * Math.sin(r), o[1] + x * Math.sin(r) + y * Math.cos(r)];
  }
  G.R = R;
  G.hang = function (th) {
    var h = R(G.HANG, G.PIV, th);
    return [h[0] - G.HANG[0], h[1] - G.HANG[1]];
  };
  G.solve = function (dy) {
    var lo = -40,
      hi = 25;
    for (var i = 0; i < 50; i++) {
      var md = (lo + hi) / 2;
      if (G.hang(md)[1] < dy) lo = md;
      else hi = md;
    }
    return (lo + hi) / 2;
  };
  var pick = G.GND - 2 * G.CH - G.CY;
  G.PICK = G.solve(pick);
  G.HOVER = G.solve(pick - 30);
  G.UP = G.solve(pick - G.CH / 2);
  G.PLACE = G.solve(G.TT + 0.3033 * G.TH - G.CY);
  G.REL = G.PLACE - 5;
  G.XC = G.CC + G.hang(G.PICK)[0]; // centre of the stack column
  G.COMP = [60, G.XC + G.CD * 1.5 + 8];
  G.TOP = G.HANG[1] + G.hang(G.HOVER)[1] - 130; // highest drawn point (spreader head)
  G.AX = G.CC + G.hang(G.UP)[0];
  G.TL = G.AX - 0.61095 * G.TW;
  G.stage = function (W, H) {
    var mob = W < 768,
      fy = H * (mob ? 0.66 : 0.74),
      room = fy - (mob ? 70 : 56);
    var u0 = Math.min(((mob ? 0.53 : 0.45) * W) / G.CL, room / (G.GND - G.TOP));
    if (!mob) u0 = Math.min(u0, (0.94 * W) / (G.COMP[1] - G.COMP[0]));
    var left =
      (G.COMP[1] - G.COMP[0]) * u0 > W * 0.96
        ? W - 6 - G.COMP[1] * u0
        : W / 2 - ((G.COMP[0] + G.COMP[1]) / 2) * u0;
    return { u0: u0, fy: fy, left: left, top: fy - G.GND * u0 };
  };
  // where the loaded truck ends: same size as in the story, a short drive forward (to the left), then the next section zooms in
  G.band = function (W, H) {
    var st = G.stage(W, H),
      w = G.TW * st.u0,
      h = G.TH * st.u0,
      x = W / 2 + (G.TL - G.AX) * st.u0 - W * 0.03,
      y = st.top + G.TT * st.u0;
    return { w: w, h: h, x: x, y: y, cx: x + w / 2, cy: y + h / 2 };
  };
  window.__EY = G;
})();
