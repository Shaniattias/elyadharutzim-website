/* =========================================================
   הסכמה לעוגיות
   - פס בתחתית המסך בביקור הראשון: אישור / חיוניות בלבד / הגדרות.
   - חלון הגדרות עם מתגים לכל סוג עוגיות.
   - הבחירה נשמרת בדפדפן תחת המפתח ey-consent.
   - כפתור "הגדרות עוגיות" בתחתית האתר פותח שוב את החלון.

   לשימוש עתידי (למשל Google Analytics):
     window.eyConsent()                 מחזיר את הבחירה הנוכחית
     document.addEventListener('ey:consent', ...)   מופעל אחרי כל שינוי בחירה
   ========================================================= */
(function () {
  'use strict';
  var d = document;
  var KEY = 'ey-consent';
  var bar = d.getElementById('ck'); // הפס בתחתית
  var dialog = d.getElementById('ckd'); // חלון ההגדרות
  var consent = EY.store(KEY);

  window.eyConsent = function () {
    return EY.store(KEY) || { necessary: true, analytics: false, marketing: false };
  };

  function hideBar() {
    if (!bar) return;
    bar.classList.remove('in');
    d.body.classList.remove('has-ck');
    setTimeout(
      function () {
        bar.hidden = true;
      },
      EY.reduceMotion ? 0 : 700
    );
  }

  function save(analytics, marketing) {
    consent = {
      v: 1,
      necessary: true,
      analytics: !!analytics,
      marketing: !!marketing,
      ts: new Date().toISOString()
    };
    EY.store(KEY, consent);
    hideBar();
    d.dispatchEvent(new CustomEvent('ey:consent', { detail: consent }));
  }

  function openSettings() {
    if (!dialog) return;
    var current = consent || {};
    dialog.querySelector('[name=analytics]').checked = !!current.analytics;
    dialog.querySelector('[name=marketing]').checked = !!current.marketing;
    if (dialog.showModal) dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  /* ---------- הפס בתחתית ---------- */
  if (bar) {
    if (!consent) {
      bar.hidden = false;
      d.body.classList.add('has-ck');
      // גובה הפס, כדי שכפתור הנגישות יעלה מעליו
      var setHeight = function () {
        d.documentElement.style.setProperty('--ckh', bar.offsetHeight + 'px');
      };
      setHeight();
      addEventListener('resize', setHeight);
      // עולה בעדינות אחרי שנייה
      setTimeout(
        function () {
          bar.classList.add('in');
        },
        EY.reduceMotion ? 0 : 900
      );
    }
    bar.querySelector('[data-ck=accept]').addEventListener('click', function () {
      save(true, true);
    });
    bar.querySelector('[data-ck=reject]').addEventListener('click', function () {
      save(false, false);
    });
    bar.querySelector('[data-ck=prefs]').addEventListener('click', openSettings);
  }

  /* ---------- חלון ההגדרות ---------- */
  if (dialog) {
    var button = function (name, handler) {
      dialog.querySelector('[data-ck=' + name + ']').addEventListener('click', function (e) {
        e.preventDefault();
        handler();
        dialog.close();
      });
    };
    button('save', function () {
      save(
        dialog.querySelector('[name=analytics]').checked,
        dialog.querySelector('[name=marketing]').checked
      );
    });
    button('rejectall', function () {
      save(false, false);
    });
    button('acceptall', function () {
      save(true, true);
    });
  }

  /* ---------- "הגדרות עוגיות" בתחתית האתר ---------- */
  EY.all('[data-open-cookies]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.preventDefault();
      openSettings();
    });
  });
})();
