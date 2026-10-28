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

  /* תמונות הסצנות של דף הבית: אם תמונה לא נטענה (קורה בגלישה סלולרית, כשהסרטון
     נטען במקביל), מנסים לטעון אותה שוב, עד פעמיים. בלי זה התמונה פשוט לא מופיעה. */
  function retry(img) {
    var n = +(img.getAttribute('data-retry') || 0);
    if (n >= 2) return;
    img.setAttribute('data-retry', String(n + 1));
    var src = img.getAttribute('src').split('?')[0];
    setTimeout(function () {
      img.src = src + '?r=' + (n + 1);
    }, 600 * (n + 1));
  }
  function watch() {
    Array.prototype.forEach.call(document.querySelectorAll('#home img[src], #top img[src]'), function (img) {
      img.addEventListener('error', function () {
        retry(img);
      });
      if (img.complete && img.naturalWidth === 0) retry(img); // נכשלה עוד לפני שהסקריפט רץ
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();

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
