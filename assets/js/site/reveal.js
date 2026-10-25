/* =========================================================
   הופעה בגלילה ומוני מספרים (עמודים פנימיים)
   כל אלמנט עם class="reveal" מקבל class="vis" כשהוא נכנס למסך.
   מספר עם data-n="18" נספר מאפס עד הערך.
     data-p = תחילית (למשל $), data-s = סיומת (ברירת מחדל +).
   לדף הבית יש גרסה משלו בתוך assets/js/home/home.js.
   ========================================================= */
(function () {
  'use strict';
  if (document.body.hasAttribute('data-home')) return;

  function countUp(el) {
    var target = +el.dataset.n;
    var suffix = el.dataset.s !== undefined ? el.dataset.s : '+';
    var prefix = el.dataset.p || '';
    var format = function (n) {
      return prefix + n.toLocaleString('en-US') + suffix;
    };

    if (EY.reduceMotion || EY.animationsStopped()) {
      el.textContent = format(target);
      return;
    }
    var start = null;
    requestAnimationFrame(function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / 1600);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    });
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('vis');
        observer.unobserve(el);
        EY.all('b[data-n]', el).forEach(countUp);
        if (el.matches('b[data-n]')) countUp(el);
      });
    },
    { rootMargin: '0px 0px -60px 0px' }
  );

  EY.all('.reveal').forEach(function (el) {
    observer.observe(el);
  });
})();
