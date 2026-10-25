/* =========================================================
   דף הבית: סרטון הפתיחה
   סרטון מסך מלא עם הכותרת. בגלילה הוא נעלם בהדרגה והמכונות נכנסות לאותו מסך נעוץ.
   ========================================================= */
/* Opening: full-screen video with the headline; on scroll it fades and the machines take over the same pinned screen */
(function () {
  var sec = document.getElementById('home'),
    works = document.getElementById('works'),
    hw = document.getElementById('hvid'),
    hv = document.getElementById('hv'),
    side = [].slice.call(sec.querySelectorAll('.gside,.gcue'));
  function cl(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }
  var inView = true,
    raf = 0;
  function f() {
    raf = 0;
    var sr = sec.getBoundingClientRect(),
      vh = Math.max(1, innerHeight),
      pxs = Math.max(0, -sr.top),
      sp = Math.min(1, pxs / (1.6 * vh));
    var fade = cl((sp - 0.18) / 0.27),
      ff = fade * fade * (3 - 2 * fade);
    hw.style.opacity = String(1 - ff);
    hw.style.transform = 'scale(' + (1 + 0.05 * ff) + ')';
    var wo = cl((sp - 0.36) / 0.18);
    wo = wo * wo * (3 - 2 * wo);
    works.style.opacity = String(wo);
    works.style.transform = 'translateY(' + (1 - wo) * 40 + 'px)';
    works.classList.toggle('on', wo > 0.5);
    if (window.__worksState) window.__worksState(inView && wo > 0.01, sp > 0.42);
    // the story finishes a little before the truck section takes over (it starts 360px before the end, see CSS #top)
    if (window.__worksProg) window.__worksProg(cl((pxs - vh) / (3.85 * vh - 360)));
    var tf = String(Math.max(0, 1 - sp * 5));
    side.forEach(function (el) {
      el.style.opacity = tf;
    });
    // only play the video while it can be seen
    var show = inView && ff < 1;
    if (show && hv.paused) {
      var p = hv.play();
      if (p && p.catch) p.catch(function () {});
    } else if (!show && !hv.paused) hv.pause();
  }
  function req() {
    if (!raf) raf = requestAnimationFrame(f);
  }
  new IntersectionObserver(
    function (es) {
      inView = es[0].isIntersecting;
      req();
    },
    { threshold: 0 }
  ).observe(sec);
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  req();
})();
