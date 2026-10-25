/* =========================================================
   סמן עכבר רך
   עיגול שקוף שעוקב אחרי העכבר ומתרחב מעל קישורים וכפתורים.
   - פועל רק במחשב עם עכבר (לא במגע).
   - החץ הרגיל מוסתר רק כשהעיגול מוצג (class="cc" על html).
   - כשחלון (dialog) פתוח, למשל הגדרות עוגיות, חוזר החץ הרגיל,
     כי החלון מוצג מעל העיגול.
   ========================================================= */
(function () {
  'use strict';
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  var d = document;
  var html = d.documentElement;

  var dot = d.createElement('div');
  dot.className = 'cur';
  dot.setAttribute('aria-hidden', 'true');
  d.body.appendChild(dot);

  var targetX = -100,
    targetY = -100; // מיקום העכבר
  var x = -100,
    y = -100; // מיקום העיגול (נגרר אחרי העכבר)
  var running = false;

  function follow() {
    var ease = EY.reduceMotion ? 1 : 0.18;
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    if (Math.abs(targetX - x) > 0.1 || Math.abs(targetY - y) > 0.1) requestAnimationFrame(follow);
    else running = false;
  }

  addEventListener(
    'pointermove',
    function (e) {
      if (e.pointerType !== 'mouse') return;
      targetX = e.clientX;
      targetY = e.clientY;

      var dialogOpen = !!d.querySelector('dialog[open]');
      html.classList.toggle('cc', !dialogOpen);
      dot.classList.toggle('on', !dialogOpen);

      var overLink = e.target.closest && e.target.closest('a,button,[role=button],.card,.way,.xcard');
      dot.classList.toggle('big', !!overLink);

      if (!running) {
        running = true;
        requestAnimationFrame(follow);
      }
    },
    { passive: true }
  );

  // העכבר יצא מהחלון: מסתירים את העיגול ומחזירים את החץ
  d.addEventListener('mouseleave', function () {
    dot.classList.remove('on');
    html.classList.remove('cc');
  });
  addEventListener('pointerdown', function () {
    dot.classList.add('down');
  });
  addEventListener('pointerup', function () {
    dot.classList.remove('down');
  });
})();
