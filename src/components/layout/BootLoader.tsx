/**
 * Branded boot screen — shown from the very first paint (server-rendered, inline CSS + script, no
 * JavaScript bundle needed) until EVERYTHING is in: every photo on the page, the fonts, the scripts
 * and React's hydration. Then it dissolves and the hero's entrance animations start (they wait for
 * the `yazd:reveal` event, see src/lib/reveal.ts), so nothing pops in half-loaded afterwards.
 *
 * Progress is real: photos 70 % · fonts 10 % · page scripts 10 % · hydration 10 %.
 * Safety nets: an «ورود» button appears after 8 s, and the site opens by itself after 20 s.
 */

const CSS = `
html[data-booting], html[data-booting] body { overflow: hidden; }
#yazd-boot {
  position: fixed; inset: 0; z-index: 200; display: grid; place-items: center;
  background: radial-gradient(60% 45% at 50% 40%, rgba(212,140,41,0.10), rgba(212,140,41,0) 70%), #faf6f0;
  color: #1c1613; opacity: 0; visibility: hidden;
  transition: opacity .7s cubic-bezier(.22,1,.36,1), visibility 0s linear .7s;
}
html[data-booting] #yazd-boot { opacity: 1; visibility: visible; transition: none; }
#yazd-boot .yb-box { display: grid; justify-items: center; gap: 18px; padding: 24px; text-align: center;
  transform: translateY(0) scale(1); transition: transform .7s cubic-bezier(.22,1,.36,1); }
html:not([data-booting]) #yazd-boot .yb-box { transform: translateY(-10px) scale(.98); }
#yazd-boot svg { width: 92px; height: 92px; overflow: visible; }
#yazd-boot .yb-line { fill: none; stroke: #b85d3b; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
  stroke-dasharray: 1; stroke-dashoffset: 1; animation: yb-draw 1.6s cubic-bezier(.65,0,.35,1) forwards; }
#yazd-boot .yb-line.d2 { animation-delay: .25s; } #yazd-boot .yb-line.d3 { animation-delay: .5s; }
#yazd-boot .yb-vent { fill: #1d6a73; transform-box: fill-box; transform-origin: 50% 100%; transform: scaleY(0);
  animation: yb-vent 2.4s cubic-bezier(.45,0,.55,1) infinite; }
#yazd-boot .yb-vent:nth-of-type(2) { animation-delay: .15s; } #yazd-boot .yb-vent:nth-of-type(3) { animation-delay: .3s; }
#yazd-boot .yb-vent:nth-of-type(4) { animation-delay: .45s; }
#yazd-boot .yb-ground { fill: none; stroke: #d48c29; stroke-width: 2; stroke-linecap: round; stroke-dasharray: 2 5; opacity: 0;
  animation: yb-fade .6s ease-out .9s forwards; }
#yazd-boot .yb-title { font-size: 19px; font-weight: 900; letter-spacing: 0; line-height: 1.6; }
#yazd-boot .yb-sub { margin-top: -12px; font-size: 13px; font-weight: 600; color: #5e5249; }
#yazd-boot .yb-bar { position: relative; width: 220px; height: 4px; border-radius: 999px; background: rgba(28,22,19,.1); overflow: hidden; }
#yazd-boot .yb-fill { position: absolute; inset: 0; border-radius: inherit; transform-origin: 100% 50%; transform: scaleX(0);
  background: linear-gradient(270deg, #b85d3b, #d48c29); }
#yazd-boot .yb-pct { margin-top: -8px; font-size: 12px; font-weight: 700; color: #9a4a2c; font-variant-numeric: tabular-nums; min-height: 20px; }
#yazd-boot .yb-skip { display: none; margin-top: 2px; min-height: 44px; padding: 0 22px; border-radius: 999px; border: 1px solid rgba(28,22,19,.12);
  background: #fffdf9; color: #1c1613; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
#yazd-boot.yb-slow .yb-skip { display: inline-flex; align-items: center; }
@keyframes yb-draw { to { stroke-dashoffset: 0; } }
@keyframes yb-fade { to { opacity: .8; } }
@keyframes yb-vent { 0%, 100% { transform: scaleY(.15); opacity: .35; } 50% { transform: scaleY(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  #yazd-boot .yb-line { animation: none; stroke-dashoffset: 0; }
  #yazd-boot .yb-vent { animation: none; transform: none; }
  #yazd-boot .yb-ground { animation: none; opacity: .8; }
}
`;

/* runs inline, before any bundle: collects every resource the page needs and drives the bar */
const SCRIPT = `(function(){
  var html = document.documentElement, root = document.getElementById('yazd-boot');
  if (!root || !html.hasAttribute('data-booting')) return;
  var fill = root.querySelector('.yb-fill'), pct = root.querySelector('.yb-pct'), skip = root.querySelector('.yb-skip');
  var FA = '۰۱۲۳۴۵۶۷۸۹', fa = function(n){ return String(n).replace(/\\d/g, function(d){ return FA[d]; }); };
  var state = window.__yazdBoot = { imgs: 0, imgsDone: 0, fonts: 0, load: 0, hydrated: 0 }, shown = 0, done = false, t0 = performance.now();
  function target(){
    var img = state.imgs ? state.imgsDone / state.imgs : (state.load ? 1 : 0);
    return Math.min(1, Math.round((img * .7 + state.fonts * .1 + state.load * .1 + state.hydrated * .1) * 1000) / 1000);
  }
  function reveal(){
    if (done) return; done = true;
    shown = 1; fill.style.transform = 'scaleX(1)'; pct.textContent = fa(100) + '٪';
    setTimeout(function(){
      html.removeAttribute('data-booting');
      window.dispatchEvent(new Event('yazd:reveal'));
      // after the fade: take it out of rendering entirely, so its looping SVG animations stop
      setTimeout(function(){ root.setAttribute('aria-hidden', 'true'); root.style.display = 'none'; }, 800);
    }, 260);
  }
  function tick(){
    if (done) return;
    var t = target();
    shown += (t - shown) * 0.12;
    if (t - shown < 0.004) shown = t;
    fill.style.transform = 'scaleX(' + shown.toFixed(4) + ')';
    pct.textContent = fa(Math.round(shown * 100)) + '٪';
    if (t >= 0.999 && shown >= 0.995) return reveal();
    var el = performance.now() - t0;
    if (el > 8000) root.classList.add('yb-slow');
    if (el > 20000) return reveal();
    requestAnimationFrame(tick);
  }
  function watchImages(){
    var list = Array.prototype.slice.call(document.images);
    state.imgs = list.length;
    list.forEach(function(img){
      if (img.complete) { state.imgsDone++; return; }
      var fin = function(){ state.imgsDone++; img.removeEventListener('load', fin); img.removeEventListener('error', fin); };
      img.addEventListener('load', fin); img.addEventListener('error', fin);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchImages); else watchImages();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ state.fonts = 1; }); else state.fonts = 1;
  if (document.readyState === 'complete') state.load = 1; else window.addEventListener('load', function(){ state.load = 1; });
  if (window.__yazdHydrated) state.hydrated = 1; else window.addEventListener('yazd:hydrated', function(){ state.hydrated = 1; });
  skip.addEventListener('click', reveal);
  requestAnimationFrame(tick);
})();`;

/* static markup, injected as HTML so React never tries to hydrate (and fight over) the parts the
   inline script animates — the percentage text, the bar, the "slow" class */
const MARKUP = `
<div id="yazd-boot" role="status" aria-live="polite" aria-label="در حال بارگذاری سایت">
  <div class="yb-box">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path class="yb-line" pathLength="1" d="M11 56V45h10V31.5h-2V29h2V9h4v4h2V9h4v4h2V9h4v4h2V9h4v20h2v2.5h-2V45h10v11"/>
      <path class="yb-line d2" pathLength="1" d="M29.5 56v-5a2.5 2.5 0 0 1 5 0v5M29.5 42.5V38a2.5 2.5 0 0 1 5 0v4.5"/>
      <path class="yb-ground" d="M4 56.5h56"/>
      <rect class="yb-vent" x="25" y="15" width="2" height="11" rx="1"/>
      <rect class="yb-vent" x="29" y="15" width="2" height="11" rx="1"/>
      <rect class="yb-vent" x="33" y="15" width="2" height="11" rx="1"/>
      <rect class="yb-vent" x="37" y="15" width="2" height="11" rx="1"/>
    </svg>
    <div class="yb-title">شیرینی‌ها و سوغات اصیل یزد</div>
    <div class="yb-sub">در حال آماده‌سازی شیرینی‌ها…</div>
    <div class="yb-bar"><div class="yb-fill"></div></div>
    <div class="yb-pct">۰٪</div>
    <button type="button" class="yb-skip">ورود به سایت</button>
  </div>
</div>`;

export function BootLoader() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <noscript>
        <style>{"#yazd-boot{display:none!important}html[data-booting],html[data-booting] body{overflow:auto!important}"}</style>
      </noscript>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: MARKUP }} />
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
    </>
  );
}
