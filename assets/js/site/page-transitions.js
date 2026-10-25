/* =========================================================
   מעבר בין עמודים
   לחיצה על קישור לעמוד אחר באתר: העמוד הנוכחי נעלם בהדרגה ואז עוברים.
   העמוד החדש נכנס בעדינות (העיצוב ב-29-page-transitions.css).
   לא פועל כשביקשו פחות תנועה או עצרו אנימציות בתפריט הנגישות.

   מצב תצוגה מקדימה (קישור התצוגה של Claude):
   שם אי אפשר לעבור לקובץ HTML אחר בדרך הרגילה, ולכן העמוד החדש
   נטען ברקע (fetch) ומחליף את העמוד הנוכחי. באתר האמיתי
   (elyadharutzim.com) המעבר הוא ניווט רגיל לגמרי.
   ========================================================= */
(function () {
  'use strict';
  var d = document;
  var html = d.documentElement;
  // עמוד באתר: about.html, about.html#history, en/about.html, ../fr/about.html
  var INTERNAL_PAGE = /^(\.\.\/)?([a-z]{2}\/)?[\w-]+\.html(#.*)?$/;
  var preview = EY.preview;

  // תצוגה מקדימה: טוען את העמוד ומחליף את כל המסמך
  function swapTo(href) {
    // כתובת מלאה של העמוד החדש (לפי הכתובת של העמוד הנוכחי, כולל תיקיית השפה)
    var abs = new URL(href, d.baseURI).href;
    var parts = abs.split('#');
    return fetch(parts[0], { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then(function (page) {
        // <base> כדי שהקישורים והקבצים בעמוד החדש יחושבו מהתיקייה שלו (למשל en/)
        page = page.replace(/<head>/i, '<head><base href="' + parts[0] + '">');
        d.open();
        d.write(page);
        d.close();
        var target = parts[1];
        // גלילה לראש העמוד, או לחלק המבוקש (למשל about.html#history)
        function place() {
          var el = target && d.getElementById(target);
          if (el) el.scrollIntoView({ behavior: 'instant' });
          else scrollTo({ top: 0, behavior: 'instant' });
        }
        place();
        setTimeout(place, 80);
        setTimeout(place, 400);
      });
  }

  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || a.target) return; // פתיחה בלשונית חדשה
    var href = a.getAttribute('href');
    // תצוגה מקדימה: קישור לחלק באותו עמוד (#...) נגלל בתוך העמוד, בלי לטעון מחדש
    if (preview && href.charAt(0) === '#' && href.length > 1) {
      var target = d.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: EY.reduceMotion ? 'instant' : 'smooth' });
        if (target.tabIndex >= 0 || target.id === 'main') target.focus({ preventScroll: true });
      }
      return;
    }
    if (!INTERNAL_PAGE.test(href)) return;
    var samePage = new URL(a.href, location.href).pathname === location.pathname;

    if (preview) {
      // בתצוגה המקדימה כל הקבצים "נמצאים" באותה כתובת, אז תמיד טוענים
      e.preventDefault();
      html.classList.add('pg-out');
      swapTo(href).catch(function () {
        html.classList.remove('pg-out');
        location.href = a.href; // אם הטעינה נכשלה: ניווט רגיל
      });
      return;
    }

    if (samePage) return; // אותו עמוד
    if (EY.reduceMotion || EY.animationsStopped()) return;
    e.preventDefault();
    html.classList.add('pg-out');
    setTimeout(function () {
      location.href = a.href;
    }, 260);
  });

  // חזרה עם כפתור "אחורה": להחזיר את העמוד לתצוגה
  addEventListener('pageshow', function () {
    html.classList.remove('pg-out');
  });
})();
