/* =========================================================
   טופס יצירת קשר (עמוד צור קשר)
   1. בודק שכל שדות החובה מולאו, ומציג הודעת שגיאה ליד כל שדה חסר.
   2. שולח את הפנייה דרך FormSubmit לכתובת שב-assets/js/config.js.
   3. מציג הודעה שהפנייה נשלחה, או הודעת שגיאה עם המייל שלנו.

   חשוב: בפעם הראשונה שהטופס נשלח, FormSubmit שולח מייל אישור לכתובת שלנו.
   צריך ללחוץ בו על Activate Form, ורק מאז הפניות מגיעות.
   ========================================================= */
(function () {
  'use strict';
  var form = document.getElementById('contactForm');
  if (!form) return;

  var status = document.getElementById('formStatus');
  var button = form.querySelector('button[type=submit]');
  var settings = window.EY_FORM || {};

  var MESSAGES = {
    valueMissing: EY.t('יש למלא את השדה הזה'),
    typeMismatch: EY.t('כתובת המייל לא נראית תקינה'),
    topic: EY.t('יש לבחור נושא')
  };

  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'fstatus' + (kind ? ' ' + kind : '');
  }

  // הודעת שגיאה מתחת לשדה (וחיבור שלה לשדה, בשביל קוראי מסך)
  function showError(field, message) {
    var box = field.closest('.field');
    var err = box.querySelector('.err');
    if (!message) {
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
      if (err) err.remove();
      return;
    }
    if (!err) {
      err = document.createElement('p');
      err.className = 'err';
      err.id = field.id + '-err';
      box.appendChild(err);
    }
    err.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', err.id);
  }

  function check(field) {
    var v = field.validity;
    var message = '';
    if (v.valueMissing) message = field.tagName === 'SELECT' ? MESSAGES.topic : MESSAGES.valueMissing;
    else if (v.typeMismatch) message = MESSAGES.typeMismatch;
    showError(field, message);
    return !message;
  }

  var fields = EY.all('input[required], select[required], textarea[required]', form);
  fields.forEach(function (f) {
    f.addEventListener('blur', function () {
      if (f.value) check(f);
    });
    f.addEventListener('input', function () {
      if (f.getAttribute('aria-invalid')) check(f);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // בדיקת שדות חובה; פוקוס לשדה השגוי הראשון
    var firstBad = null;
    fields.forEach(function (f) {
      if (!check(f) && !firstBad) firstBad = f;
    });
    if (firstBad) {
      firstBad.focus();
      setStatus(EY.t('יש להשלים את השדות המסומנים.'), 'bad');
      return;
    }

    var data = {};
    new FormData(form).forEach(function (value, key) {
      data[key] = value;
    });
    if (data._honey) return; // רובוט: לא שולחים

    // בתצוגה המקדימה של Claude אי אפשר לשלוח לשירות חיצוני
    if (EY.preview) {
      setStatus(
        EY.t('זו תצוגה מקדימה, ולכן הפנייה לא נשלחה. באתר עצמו היא תגיע אל') + ' ' + settings.email + '.',
        'ok'
      );
      return;
    }

    data._subject =
      EY.t('פנייה מהאתר') + ' (' + EY.lang.toUpperCase() + '): ' + data.topic + ' · ' + data.company;
    data._template = 'table';
    data._captcha = 'false';

    button.disabled = true;
    setStatus(EY.t('שולחים...'));

    fetch('https://formsubmit.co/ajax/' + settings.email, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) {
        return r.json().then(function (body) {
          if (!r.ok || String(body.success) !== 'true') throw new Error(body.message || r.status);
        });
      })
      .then(function () {
        form.reset();
        setStatus(EY.t('תודה! הפנייה נשלחה, ונחזור אליכם בהקדם.'), 'ok');
      })
      .catch(function () {
        setStatus(
          EY.t('השליחה לא הצליחה. אפשר לנסות שוב, או לכתוב לנו ישירות ל-') +
            (EY.lang === 'he' ? '' : ' ') +
            settings.email +
            '.',
          'bad'
        );
      })
      .then(function () {
        button.disabled = false;
      });
  });
})();
