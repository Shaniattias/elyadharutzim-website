/* =========================================================
   תפריט נגישות (לפי תקן ישראלי 5568)

   ארבעה חלקים בחלונית:
     פרופילי נגישות  – לחיצה אחת מפעילה כמה התאמות שמתאימות לקבוצה (ראו PROFILES)
     התאמות ניווט    – ניווט מקלדת, הקראת טקסט, מדריך קריאה, סמן גדול, עצירת אנימציות
     התאמות צבע      – מונוכרום, ניגודיות כהה/בהירה, רוויה נמוכה/גבוהה, היפוך צבעים
     התאמות תוכן     – גודל טקסט (3 רמות), ריווח, גופן קריא, הדגשת כותרות וקישורים,
                       הסתרת תמונות, יישור לימין

   כל התאמה מוסיפה class לתגית html (למשל a11y-contrast); העיצוב ב-28-accessibility-menu.css.
   התאמות הצבע שמשנות פילטר (מונוכרום, רוויה, כהה, היפוך) מחושבות כאן לפילטר אחד.
   הבחירות נשמרות בדפדפן תחת המפתח ey-a11y ונשארות בכל העמודים.
   ========================================================= */
(function () {
  'use strict';
  var d = document;
  var html = d.documentElement;
  var KEY = 'ey-a11y';
  var TOGGLES = [
    'kbd',
    'tts',
    'guide',
    'cursor',
    'still',
    'gray',
    'dark',
    'contrast',
    'lowsat',
    'highsat',
    'invert',
    'spacing',
    'font',
    'headings',
    'links',
    'noimg',
    'align'
  ];
  // התאמות שלא פועלות יחד: הפעלה של אחת מכבה את האחרות בקבוצה
  var EXCLUSIVE = [
    ['gray', 'lowsat', 'highsat'],
    ['dark', 'contrast', 'invert']
  ];
  // פרופילים: אילו התאמות כל פרופיל מפעיל (t = רמת גודל הטקסט)
  var PROFILES = {
    vision: { t: 2, contrast: true, headings: true, links: true, cursor: true, font: true },
    seizure: { still: true, lowsat: true },
    adhd: { still: true, guide: true, headings: true },
    cog: { font: true, spacing: true, headings: true, links: true },
    kbd: { kbd: true }
  };
  var TEXT_SIZE_LABELS = [EY.t('רגיל'), EY.t('גדול'), EY.t('גדול מאוד')];

  function defaults() {
    var s = { t: 0, profile: '' };
    TOGGLES.forEach(function (k) {
      s[k] = false;
    });
    return s;
  }

  var button = d.getElementById('a11yBtn');
  var panel = d.getElementById('a11yPanel');
  var state = Object.assign(defaults(), EY.store(KEY) || {});

  /* ---------- החלת ההגדרות על העמוד ---------- */
  function apply() {
    html.classList.toggle('a11y-t1', state.t === 1);
    html.classList.toggle('a11y-t2', state.t === 2);
    TOGGLES.forEach(function (k) {
      html.classList.toggle('a11y-' + k, !!state[k]);
    });

    // פילטר צבע אחד שמשלב את כל התאמות הצבע הפעילות
    var f = [];
    if (state.dark || state.invert) f.push('invert(1) hue-rotate(180deg)');
    if (state.gray) f.push('grayscale(1)');
    if (state.lowsat) f.push('saturate(0.45)');
    if (state.highsat) f.push('saturate(1.8)');
    html.style.filter = f.join(' ');

    // מצב הכפתורים בחלונית
    if (panel) {
      EY.all('[data-a]', panel).forEach(function (b) {
        var k = b.getAttribute('data-a');
        b.setAttribute('aria-pressed', String(k === 't' ? state.t > 0 : !!state[k]));
        if (k === 't') b.querySelector('em').textContent = TEXT_SIZE_LABELS[state.t];
      });
      EY.all('[data-profile]', panel).forEach(function (b) {
        b.setAttribute('aria-pressed', String(state.profile === b.getAttribute('data-profile')));
      });
    }

    // עצירת אנימציות עוצרת גם סרטונים
    if (state.still) {
      EY.all('video').forEach(function (v) {
        v.pause();
        v.removeAttribute('autoplay');
      });
    }
    if (!state.tts && window.speechSynthesis) speechSynthesis.cancel();
    guide(state.guide);
    d.dispatchEvent(new CustomEvent('ey:a11y', { detail: state }));
  }

  function save() {
    EY.store(KEY, state);
    apply();
  }

  /* ---------- מדריך קריאה: פס שקוף שעוקב אחרי העכבר, והשאר מוחשך ---------- */
  var mask = null;
  function moveGuide(e) {
    if (!mask) return;
    var y = e.clientY,
      h = 64;
    mask.top.style.height = Math.max(0, y - h / 2) + 'px';
    mask.bottom.style.top = y + h / 2 + 'px';
  }
  function guide(on) {
    if (on && !mask) {
      mask = { top: d.createElement('div'), bottom: d.createElement('div') };
      mask.top.className = 'a11y-mask a11y-mask-top';
      mask.bottom.className = 'a11y-mask a11y-mask-bottom';
      [mask.top, mask.bottom].forEach(function (el) {
        el.setAttribute('aria-hidden', 'true');
        d.body.appendChild(el);
      });
      moveGuide({ clientY: innerHeight / 2 });
      addEventListener('pointermove', moveGuide, { passive: true });
    } else if (!on && mask) {
      mask.top.remove();
      mask.bottom.remove();
      mask = null;
      removeEventListener('pointermove', moveGuide);
    }
  }

  /* ---------- הקראת טקסט: לחיצה על פסקה או כותרת מקריאה אותה בקול ---------- */
  var READABLE = 'p, h1, h2, h3, h4, li, blockquote, label, figcaption, .lead, .eyebrow, address, td, th';
  d.addEventListener(
    'click',
    function (e) {
      if (!state.tts || !window.speechSynthesis) return;
      if (e.target.closest('#a11yPanel, #a11yBtn')) return;
      var el = e.target.closest(READABLE);
      if (!el) return;
      var text = el.innerText.trim();
      if (!text) return;
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = /[\u0590-\u05FF]/.test(text)
        ? 'he-IL'
        : { en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES' }[EY.lang] || 'en-US';
      u.rate = 0.95;
      speechSynthesis.speak(u);
    },
    true
  );

  apply();
  if (!button || !panel) return;

  /* ---------- פתיחה וסגירה של החלונית ---------- */
  function setPanel(open) {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) {
      var first = panel.querySelector('.a11y-close');
      if (first) first.focus();
    }
  }
  button.addEventListener('click', function () {
    setPanel(panel.hidden);
  });
  panel.querySelector('[data-a11y-close]').addEventListener('click', function () {
    setPanel(false);
    button.focus();
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) {
      setPanel(false);
      button.focus();
    }
  });
  d.addEventListener('click', function (e) {
    if (!panel.hidden && !e.target.closest('#a11yPanel') && !e.target.closest('#a11yBtn')) setPanel(false);
  });

  // כותרות החלקים פותחות וסוגרות את החלק
  EY.all('.a11y-sec-t', panel).forEach(function (t) {
    t.addEventListener('click', function () {
      var open = t.getAttribute('aria-expanded') !== 'true';
      t.setAttribute('aria-expanded', String(open));
      d.getElementById(t.getAttribute('aria-controls')).hidden = !open;
      t.closest('.a11y-sec').classList.toggle('closed', !open);
    });
  });

  /* ---------- התאמות בודדות ---------- */
  EY.all('[data-a]', panel).forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-a');
      if (k === 't') state.t = (state.t + 1) % 3;
      else {
        state[k] = !state[k];
        if (state[k]) {
          EXCLUSIVE.forEach(function (group) {
            if (group.indexOf(k) >= 0)
              group.forEach(function (o) {
                if (o !== k) state[o] = false;
              });
          });
        }
      }
      state.profile = ''; // שינוי ידני מבטל את סימון הפרופיל
      save();
    });
  });

  /* ---------- פרופילים ---------- */
  EY.all('[data-profile]', panel).forEach(function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-profile');
      var off = state.profile === name; // לחיצה שנייה על אותו פרופיל מבטלת אותו
      state = defaults();
      if (!off) {
        Object.assign(state, PROFILES[name]);
        state.profile = name;
      }
      save();
    });
  });

  /* ---------- איפוס ---------- */
  panel.querySelector('[data-a11y-reset]').addEventListener('click', function () {
    state = defaults();
    save();
  });
})();
