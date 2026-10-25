/* =========================================================
   אייקוני רשתות חברתיות בתחתית האתר
   הכתובות מגיעות מהקובץ assets/js/config.js.
   אייקון עם כתובת: קישור שנפתח בחלון חדש.
   אייקון בלי כתובת: מוצג, אבל לא לחיץ (עד שמוסיפים כתובת).
   ========================================================= */
(function () {
  'use strict';
  var links = window.EY_SOCIAL || {};

  EY.all('[data-social]').forEach(function (a) {
    var url = links[a.getAttribute('data-social')];
    if (url) {
      a.href = url;
      a.removeAttribute('role');
      a.removeAttribute('aria-disabled');
      a.classList.remove('soon');
    } else {
      a.removeAttribute('href'); // בלי כתובת: לא קישור
      a.setAttribute('role', 'link'); // לקוראי מסך: קישור שעדיין לא פעיל
      a.setAttribute('aria-disabled', 'true');
      a.classList.add('soon');
      a.title = EY.t('בקרוב');
    }
  });
})();
