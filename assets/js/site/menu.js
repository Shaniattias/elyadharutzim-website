/* =========================================================
   תפריט ראשי
   1. תפריטים נפתחים במחשב: נפתחים במעבר עכבר, בלחיצה ובמקלדת.
   2. תפריט צד בטלפון: כפתור ההמבורגר פותח וסוגר אותו.
   3. צל עדין מתחת לכותרת אחרי שגוללים.
   ובנוסף: תפריט בחירת השפה (כפתור הגלובוס).
   ========================================================= */
(function () {
  'use strict';
  var d = document;
  var canHover = function () {
    return matchMedia('(hover:hover)').matches;
  };

  /* ---------- 1. תפריטים נפתחים ---------- */
  var groups = EY.all('.has-sub');

  function setOpen(li, open) {
    li.classList.toggle('open', open);
    var button = li.querySelector('.sub-t');
    if (button) button.setAttribute('aria-expanded', String(open));
  }

  function closeAll(except) {
    groups.forEach(function (li) {
      if (li !== except) setOpen(li, false);
    });
  }

  groups.forEach(function (li) {
    var button = li.querySelector('.sub-t');
    var closeTimer = 0;

    // לחיצה: פותחת או סוגרת, וסוגרת את שאר התפריטים
    button.addEventListener('click', function () {
      var open = !li.classList.contains('open');
      closeAll(li);
      setOpen(li, open);
    });

    // מעבר עכבר (רק במכשירים עם עכבר)
    li.addEventListener('mouseenter', function () {
      if (!canHover()) return;
      clearTimeout(closeTimer);
      closeAll(li);
      setOpen(li, true);
    });
    li.addEventListener('mouseleave', function () {
      if (!canHover()) return;
      closeTimer = setTimeout(function () {
        setOpen(li, false);
      }, 180);
    });

    // מקלדת: יציאה עם Tab סוגרת, Escape סוגר ומחזיר פוקוס לכפתור
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget)) setOpen(li, false);
    });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setOpen(li, false);
        button.focus();
      }
    });
  });

  // לחיצה מחוץ לתפריט סוגרת הכול
  d.addEventListener('click', function (e) {
    if (!e.target.closest('.has-sub')) closeAll();
  });

  /* ---------- 2. תפריט הטלפון ---------- */
  var burger = d.getElementById('burger');
  var panel = d.getElementById('mnav');

  function setMobileMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? EY.t('סגירת התפריט') : EY.t('פתיחת התפריט'));
    panel.classList.toggle('open', open);
    panel.setAttribute('aria-hidden', String(!open));
    if (open) {
      panel.removeAttribute('inert');
      var first = panel.querySelector('a');
      if (first) first.focus();
    } else {
      panel.setAttribute('inert', ''); // סגור: לא ניתן להגיע אליו במקלדת
    }
    d.body.style.overflow = open ? 'hidden' : ''; // בלי גלילה מאחורי התפריט
    d.body.classList.toggle('menu-open', open); // מסתיר את כפתור הנגישות מעל התפריט
  }

  if (burger && panel) {
    panel.setAttribute('inert', '');
    burger.addEventListener('click', function () {
      setMobileMenu(burger.getAttribute('aria-expanded') !== 'true');
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setMobileMenu(false);
        burger.focus();
      }
    });
    EY.all('a', panel).forEach(function (a) {
      a.addEventListener('click', function () {
        setMobileMenu(false);
      });
    });
  }

  /* ---------- 2א. בחירת שפה (כפתור הגלובוס בכותרת) ---------- */
  var langBox = d.querySelector('.lang');
  if (langBox) {
    var langBtn = langBox.querySelector('.lang-t');
    var setLang = function (open) {
      langBox.classList.toggle('open', open);
      langBtn.setAttribute('aria-expanded', String(open));
    };
    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeAll();
      setLang(!langBox.classList.contains('open'));
    });
    d.addEventListener('click', function (e) {
      if (!e.target.closest('.lang')) setLang(false);
    });
    langBox.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        setLang(false);
        langBtn.focus();
      }
    });
    langBox.addEventListener('focusout', function (e) {
      if (!langBox.contains(e.relatedTarget)) setLang(false);
    });
  }

  /* ---------- 3. צל לכותרת בגלילה ---------- */
  var pill = d.getElementById('pill');
  function updateShadow() {
    if (pill) pill.classList.toggle('shadow', scrollY > 40);
  }
  addEventListener('scroll', updateShadow, { passive: true });
  updateShadow();
})();
