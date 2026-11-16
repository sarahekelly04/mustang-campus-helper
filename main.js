// Scroll-reveal animation
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Make sure the hero video plays (some browsers need a nudge)
const vid = document.querySelector('.hero-video');
if (vid) {
  vid.muted = true;
  const p = vid.play();
  if (p && p.catch) p.catch(() => {});
  // Loop a 5-second segment (1.5s to 6.5s) of the AI-generated clip
  const LOOP_START = 1.5, LOOP_END = 6.5;
  vid.addEventListener('timeupdate', () => {
    if (vid.currentTime >= LOOP_END || vid.currentTime < LOOP_START - 0.2) vid.currentTime = LOOP_START;
  });
  vid.addEventListener('ended', () => { vid.currentTime = LOOP_START; vid.play(); });
}

// Open the Chatling widget from the hero button
function openChat() {
  try {
    if (window.Chatling && typeof window.Chatling.open === 'function') { window.Chatling.open(); return; }
  } catch (e) {}
  const launcher = document.querySelector('#chtl-launcher, [id^="chtl"] button, iframe[id^="chtl"]');
  if (launcher && launcher.click) launcher.click();
  else alert('Click the chat bubble in the bottom-right corner to start chatting!');
}

// X-Factor: live "Do I need a permit right now?" checker (America/Chicago time)
(function parkingCheck() {
  const light = document.getElementById('pcLight');
  if (!light) return;
  const headline = document.getElementById('pcHeadline');
  const detail = document.getElementById('pcDetail');
  const clock = document.getElementById('pcClock');
  const START = 7, END = 19; // 7 a.m. to 7 p.m., Mon–Fri

  function dallasNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric',
      second: 'numeric', hour12: false
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const dayIdx = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(get('weekday'));
    let h = parseInt(get('hour'), 10); if (h === 24) h = 0;
    return { day: dayIdx, h, m: parseInt(get('minute'), 10), s: parseInt(get('second'), 10) };
  }
  function fmt(totalSec) {
    const d = Math.floor(totalSec / 86400), h = Math.floor(totalSec % 86400 / 3600),
          m = Math.floor(totalSec % 3600 / 60), s = totalSec % 60;
    return (d ? d + 'd ' : '') + String(h).padStart(2,'0') + 'h ' + String(m).padStart(2,'0') + 'm ' + String(s).padStart(2,'0') + 's';
  }
  function secsUntil(now, targetDay, targetHour) {
    let days = (targetDay - now.day + 7) % 7;
    let secs = days * 86400 + (targetHour * 3600) - (now.h * 3600 + now.m * 60 + now.s);
    if (secs <= 0) secs += 7 * 86400;
    return secs;
  }
  function tick() {
    const n = dallasNow();
    const weekday = n.day >= 1 && n.day <= 5;
    const inHours = n.h >= START && n.h < END;
    const enforced = weekday && inHours;
    let nextChange;
    if (enforced) {
      nextChange = (END * 3600) - (n.h * 3600 + n.m * 60 + n.s);
      headline.textContent = 'Yes — permits are enforced now';
      detail.textContent = 'Enforcement ends in ' + fmt(nextChange);
    } else {
      // next weekday 7 a.m.
      let best = Infinity;
      for (let d = 1; d <= 5; d++) best = Math.min(best, secsUntil(n, d, START));
      headline.textContent = 'No — permit parking is not enforced now';
      detail.textContent = 'Enforcement resumes in ' + fmt(best);
    }
    light.className = 'pc-light ' + (enforced ? 'on' : 'off');
    clock.textContent = 'Dallas time: ' + new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago', weekday: 'long', hour: 'numeric', minute: '2-digit', second: '2-digit' }) +
      ' · Fall/spring weekday rule; reserved, fire-lane and disabled spaces are enforced 24/7.';
  }
  tick();
  setInterval(tick, 1000);
})();
