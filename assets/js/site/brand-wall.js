/* =========================================================
   קיר המותגים (עמוד המותגים)
   הלוגואים מוצגים באפור. מעבר עכבר "מצייר" עליהם במברשת
   וחושף את הגרסה הצבעונית, שנמחקת לאט כשהעכבר עוצר.
   התמונה הצבעונית מגיעה מ-data-color על האלמנט #pwall.
   ========================================================= */
(function () {
  'use strict';
  var wall = document.getElementById('pwall');
  if (!wall) return;

  var canvas = wall.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var colour = new Image();
  colour.src = wall.getAttribute('data-color');

  // שכבת מסכה: איפה כבר "צוירו" הלוגואים בצבע
  var mask = document.createElement('canvas');
  var mctx = mask.getContext('2d');

  // שוליים של התמונה הצבעונית בתוך הקיר (כמו בתמונה האפורה)
  var PAD_X = 0.02 / 1.04,
    PAD_Y = 0.04 / 1.08;
  var last = null; // הנקודה הקודמת של המברשת
  var active = false; // האם לולאת הציור רצה
  var idle = 0; // כמה פריימים העכבר לא זז
  var ratio = 1; // צפיפות פיקסלים

  function resize() {
    ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = mask.width = Math.round(canvas.clientWidth * ratio);
    canvas.height = mask.height = Math.round(canvas.clientHeight * ratio);
    mctx.lineCap = 'round';
    mctx.lineJoin = 'round';
  }

  function pointFrom(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * ratio, y: (e.clientY - r.top) * ratio, t: performance.now() };
  }

  // משיכת מברשת רכה בין שתי נקודות
  function stroke(a, b, width) {
    mctx.save();
    mctx.strokeStyle = '#fff';
    mctx.shadowColor = '#fff';
    mctx.shadowBlur = width * 0.16;
    mctx.lineWidth = width;
    mctx.beginPath();
    mctx.moveTo(a.x, a.y);
    mctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
    mctx.lineTo(b.x, b.y);
    mctx.stroke();
    mctx.restore();
  }

  // מצייר את הצבע רק איפה שהמסכה צבועה
  function paint() {
    var W = canvas.width,
      H = canvas.height;
    if (!W || !H) return; // הקיר עוד לא קיבל גודל
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-atop';
    if (colour.complete)
      ctx.drawImage(colour, W * PAD_X, H * PAD_Y, W * (1 - 2 * PAD_X), H * (1 - 2 * PAD_Y));
    ctx.globalCompositeOperation = 'source-over';
  }

  function loop() {
    idle++;
    // אחרי כשנייה בלי תנועה, הצבע מתחיל לדעוך
    if (idle > 45) {
      mctx.save();
      mctx.globalCompositeOperation = 'destination-out';
      mctx.fillStyle = 'rgba(0,0,0,.035)';
      mctx.fillRect(0, 0, mask.width, mask.height);
      mctx.restore();
    }
    paint();
    if (idle > 205) {
      // נמחק לגמרי: עוצרים את הלולאה
      mctx.clearRect(0, 0, mask.width, mask.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      active = false;
      return;
    }
    requestAnimationFrame(loop);
  }

  wall.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    if (canvas.width !== Math.round(canvas.clientWidth * ratio)) resize(); // ליתר ביטחון
    var p = pointFrom(e);
    if (last) {
      // תנועה מהירה = מברשת דקה יותר
      var speed = Math.hypot(p.x - last.x, p.y - last.y) / Math.max(1, p.t - last.t);
      stroke(last, p, Math.max(60, Math.min(110, 125 - speed * 22)) * ratio * 0.8);
    }
    last = p;
    idle = 0;
    if (!active) {
      active = true;
      requestAnimationFrame(loop);
    }
  });
  wall.addEventListener('pointerleave', function () {
    last = null;
  });

  // מתאים את גודל הציור לגודל הקיר. ResizeObserver מתעדכן גם כשהעיצוב נטען
  // אחרי הסקריפט (למשל במעבר עמוד בתצוגה המקדימה), אחרת הקנבס נשאר בגובה 0.
  function fit() {
    resize();
    paint();
  }
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(canvas);
  else addEventListener('resize', fit);
  addEventListener('load', fit);
  resize();
})();
