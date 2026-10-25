/* =========================================================
   כרטיסי "שתי דרכים לרכוש" (עמוד איך רוכשים)
   הילה עדינה שעוקבת אחרי העכבר בתוך הכרטיס.
   המיקום עובר ל-CSS דרך המשתנים --mx ו- --my.
   ========================================================= */
(function () {
  'use strict';
  EY.all('.way').forEach(function (card) {
    card.addEventListener(
      'pointermove',
      function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', e.clientX - r.left + 'px');
        card.style.setProperty('--my', e.clientY - r.top + 'px');
      },
      { passive: true }
    );
  });
})();
