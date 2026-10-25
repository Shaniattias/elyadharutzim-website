/* =========================================================
   ליבה משותפת
   כלים קטנים שכל שאר הקבצים בתיקייה site משתמשים בהם.
   נטען ראשון, לפני כל שאר הסקריפטים של האתר.
   ========================================================= */
(function () {
  'use strict';

  window.EY = {
    /* האם המשתמש ביקש במערכת ההפעלה פחות תנועה */
    reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,

    /* האם האתר מוצג בקישור התצוגה המקדימה של Claude (ולא ב-elyadharutzim.com).
       שם אי אפשר לעבור בין קבצי HTML או לשלוח טפסים בדרך הרגילה. */
    preview:
      !/^(www\.)?elyadharutzim\.com$|^localhost$|^127\.0\.0\.1$/.test(location.hostname) ||
      /[?&]preview\b/.test(location.search),

    /* שפת העמוד (he, en, fr, de, es) */
    lang: document.documentElement.lang || 'he',

    /* תרגום של טקסט שמופיע בתוך הסקריפטים. בעברית מחזיר את הטקסט כמו שהוא;
       בשפות אחרות לוקח את התרגום מ-assets/js/i18n/<שפה>.js (נוצר על ידי build.py) */
    t: function (text) {
      var d = window.EY_DICT || {};
      return d[text] || text;
    },

    /* האם המשתמש עצר אנימציות בתפריט הנגישות */
    animationsStopped: function () {
      return document.documentElement.classList.contains('a11y-still');
    },

    /* קריאה ושמירה בזיכרון הדפדפן (localStorage).
       store('key') מחזיר ערך, store('key', value) שומר.
       עטוף ב-try כי בחלון פרטי הזיכרון עלול להיות חסום. */
    store: function (key, value) {
      try {
        if (value === undefined) {
          return JSON.parse(localStorage.getItem(key) || 'null');
        }
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        return null;
      }
    },

    /* כל האלמנטים שמתאימים לבורר, כמערך רגיל */
    all: function (selector, root) {
      return Array.prototype.slice.call((root || document).querySelectorAll(selector));
    }
  };
})();
