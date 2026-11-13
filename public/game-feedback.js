/* Suggestions box for the game pages. Posts to /game-feedback (see GameFeedbackController). Never touches the game. */
(function () {
  'use strict';
  try {
    var form = document.getElementById('sgForm');
    if (!form || !window.fetch) return;
    var msg = form.querySelector('textarea[name=message]'), count = document.getElementById('sgCount'),
      status = form.querySelector('.sg-status'), btn = form.querySelector('button[type=submit]');
    var isTest = false;
    try { isTest = localStorage.getItem('c2o-stats-test') === '1' || /[?&]statstest\b/.test(location.search); } catch (e) {}
    function upd() { count.textContent = msg.value.length; }
    msg.addEventListener('input', upd); upd();
    form.addEventListener('keydown', function (e) { e.stopPropagation(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = msg.value.trim();
      if (text.length < 3) { status.textContent = 'Please write a few words.'; msg.focus(); return; }
      btn.disabled = true; status.textContent = 'Sending...';
      var body = {
        game: form.elements.game.value, message: text, contact: form.elements.contact.value.trim(),
        website: form.elements.website.value, test: isTest ? 1 : 0
      };
      fetch('/game-feedback', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (j) {
          if (j && j.ok) {
            form.innerHTML = '<p class="sg-thanks">Thank you! Your suggestion was sent. We read every one.</p>';
          } else {
            status.textContent = (j && j.error) || 'Could not send. Please try again later.'; btn.disabled = false;
          }
        })
        .catch(function () { status.textContent = 'Could not send. Check your connection and try again.'; btn.disabled = false; });
    });
  } catch (e) { /* never break the page */ }
})();
