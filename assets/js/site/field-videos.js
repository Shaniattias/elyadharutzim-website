/* =========================================================
   סרטונים קצרים מהשטח (עמוד הכרייה)
   מתנגנים בלי קול רק כשהם על המסך, ונעצרים כשגוללים הלאה.
   לא מתנגנים כשהמשתמש ביקש פחות תנועה, או עצר אנימציות בתפריט הנגישות:
   אז מוצגת תמונת הפתיחה של הסרטון.
   ========================================================= */
(function () {
  'use strict';
  var videos = EY.all('video[data-field]');
  if (!videos.length) return;

  function allowed() {
    return !EY.reduceMotion && !EY.animationsStopped();
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && allowed()) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else if (!v.paused) v.pause();
      });
    },
    { threshold: 0.35 }
  );
  videos.forEach(function (v) {
    io.observe(v);
  });

  // עצירת אנימציות בתפריט הנגישות עוצרת גם את הסרטונים האלה
  document.addEventListener('ey:a11y', function () {
    if (!allowed())
      videos.forEach(function (v) {
        v.pause();
      });
  });
})();
