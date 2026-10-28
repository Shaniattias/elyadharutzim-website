/* =========================================================
   דף הבית: גובה מסך יציב (בעיקר בשביל אייפון)
   באייפון שורת הכתובת מתכווצת וגדלה בזמן גלילה, ולכן innerHeight משתנה
   כל הזמן ושולח אירועי resize. הסצנות של דף הבית חישבו את עצמן מחדש בכל
   שינוי כזה, וזה גרם לקפיצות ולהבהובים.
   כאן מודדים את הגובה של 100svh (המסך הקטן, כששורת הכתובת פתוחה), שלא
   משתנה בזמן גלילה, ומפעילים חישוב מחדש רק כשהמסך באמת השתנה
   (סיבוב הטלפון, שינוי גודל חלון במחשב).
   נטען ראשון, לפני שאר הסקריפטים של דף הבית.
   ========================================================= */
(function () {
  'use strict';
  var probe = document.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
  (document.body || document.documentElement).appendChild(probe);

  /* גובה המסך לחישובים: יציב בזמן גלילה */
  window.EYvh = function () {
    return probe.offsetHeight || innerHeight;
  };

  /* כמו addEventListener('resize', fn), אבל מתעלם משינויים של שורת הכתובת */
  window.EYonResize = function (fn) {
    var w = innerWidth,
      h = window.EYvh();
    addEventListener('resize', function () {
      var nw = innerWidth,
        nh = window.EYvh();
      if (nw === w && nh === h) return;
      w = nw;
      h = nh;
      fn();
    });
  };
})();
