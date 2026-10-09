/*
  Engine for the Business Owner checkup.
  Started as a copy of shared/app.js, then added: a 0–100 score, follow-up questions that only
  show for certain answers, "Other" boxes on pick-all-that-apply questions, and private lead
  scoring (opportunities.js). It lives in this folder on purpose: the pool checkup never loads it,
  so nothing changed here can break that one.
  You shouldn't need to edit this file. Wording lives in config.js, lead scoring in opportunities.js.
*/
(function () {
  'use strict';

  const A = window.ASSESSMENT;
  const S = window.SETTINGS || {};
  const advisor = Object.assign({}, S.advisor, A.advisor); // config.js `advisor` overrides settings.js for this checkup only
  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);

  const questions = A.questions;
  const byId = {};
  questions.forEach((q) => (byId[q.id] = q));
  const mainCount = questions.filter((q) => !q.showIf).length; // follow-up questions don't add to "Question X of 9"
  const CONTACT = questions.length; // step number of the contact screen
  const RESULTS = questions.length + 1; // step number of the results screen

  const urlName = (params.get('name') || '').trim().slice(0, 40);
  let state = freshState();

  function freshState() {
    return {
      step: -1, // -1 = intro
      answers: {}, // question id -> option index, or array of indexes for multi-select
      otherText: {}, // question id -> text typed for "Other" / "Something else"
      contact: { firstName: urlName, lastName: '', email: '', phone: '', okToText: false, followUp: null },
      source: (params.get('src') || (urlName ? 'personal link' : 'direct')).slice(0, 60),
      results: null,
      advancing: false,
    };
  }

  // ---------- helpers ----------
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fill = (text, vars) => String(text || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  const current = () => questions[state.step];

  // A follow-up question is only shown if its earlier question got one of the listed answers.
  function isShown(q) {
    if (!q.showIf) return true;
    const parent = byId[q.showIf.question];
    const opts = parent.type === 'multi' ? pickedMany(parent) : [picked(parent)];
    return opts.some((o) => o && q.showIf.answers.includes(o.key));
  }

  // The answer picked on a one-answer question (undefined if unanswered or not shown)
  function picked(q) {
    return q && q.type !== 'multi' && isShown(q) ? q.options[state.answers[q.id]] : undefined;
  }

  // The answers ticked on a pick-all-that-apply question
  function pickedMany(q) {
    return q && q.type === 'multi' && isShown(q) ? (state.answers[q.id] || []).map((i) => q.options[i]) : [];
  }

  function isAnswered(q) {
    const a = state.answers[q.id];
    return q.type === 'multi' ? Array.isArray(a) && a.length > 0 : typeof a === 'number';
  }

  function otherPicked(q) {
    const a = state.answers[q.id];
    return (q.type === 'multi' ? a || [] : [a]).some((i) => q.options[i] && q.options[i].other);
  }

  const otherText = (q) => (q && isShown(q) && otherPicked(q) ? (state.otherText[q.id] || '').trim() : '');

  function answerText(q) {
    if (!q || !isShown(q)) return '';
    const other = otherText(q);
    return (q.type === 'multi' ? pickedMany(q) : [picked(q)])
      .filter(Boolean)
      .map((o) => (o.other && other && !q.otherShort ? o.label + ': ' + other : o.label))
      .join('; ');
  }

  // Skip over follow-up questions that don't apply
  function nextStep(from) {
    let s = from + 1;
    while (s < CONTACT && !isShown(questions[s])) s++;
    return s;
  }
  function prevStep(from) {
    let s = from - 1;
    while (s >= 0 && !isShown(questions[s])) s--;
    return s;
  }

  // ---------- screens ----------
  function render() {
    let html;
    if (state.step < 0) html = introScreen();
    else if (state.step < CONTACT) html = questionScreen(current());
    else if (state.step === CONTACT) html = contactScreen();
    else html = resultsScreen(state.results);

    app.innerHTML = html + footer();
    app.querySelector('.screen').classList.add('enter');
    window.scrollTo(0, 0);
    const target = app.querySelector('[data-focus]');
    if (target && state.step >= 0) target.focus({ preventScroll: true });
  }

  function topbar() {
    let label, done;
    if (state.step === CONTACT) {
      label = 'Last step';
      done = mainCount;
    } else {
      const n = questions.slice(0, state.step + 1).filter((q) => !q.showIf).length;
      label = `Question ${n} of ${mainCount}`;
      done = n - 1 + (current().showIf ? 0.5 : 0);
    }
    const pct = Math.round((done / (mainCount + 1)) * 100);
    return `
      <div class="topbar">
        <button type="button" class="back" data-action="back"><span aria-hidden="true">←</span> Back</button>
        <div class="progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <span class="count">${label}</span>
      </div>`;
  }

  function introScreen() {
    const I = A.intro;
    const greet = urlName ? `<p class="greeting">Hey ${esc(urlName)},</p>` : '';
    return `
      <section class="screen intro">
        ${greet}
        <p class="eyebrow">${esc(A.title)}</p>
        <h1>${esc(I.hook)}</h1>
        <p class="lede">${esc(I.subtext)}</p>
        <ul class="meta">${I.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <button type="button" class="btn primary" data-action="start">${esc(I.button)}</button>
        <p class="byline">${esc(I.byline)}</p>
      </section>`;
  }

  function questionScreen(q) {
    const a = state.answers[q.id];
    const selected = (i) => (q.type === 'multi' ? (a || []).includes(i) : a === i);
    const otherOpt = q.options.find((o) => o.other);
    return `
      ${topbar()}
      <section class="screen question">
        <h2 id="q-title" tabindex="-1" data-focus>${esc(q.text)}</h2>
        ${q.help ? `<p class="help">${esc(q.help)}</p>` : ''}
        <div class="options" role="group" aria-labelledby="q-title">
          ${q.options
            .map(
              (o, i) => `
            <button type="button" class="option${q.type === 'multi' ? ' multi' : ''}" data-action="option" data-index="${i}" aria-pressed="${selected(i)}">
              <span class="option-label">${esc(o.label)}</span><span class="tick" aria-hidden="true"></span>
            </button>`
            )
            .join('')}
        </div>
        ${
          otherOpt
            ? `<div class="other" ${otherPicked(q) ? '' : 'hidden'}>
                <label for="other-text" class="visually-hidden">${esc(otherOpt.label)}</label>
                <input id="other-text" type="text" maxlength="200" autocomplete="off" data-other placeholder="${esc(otherOpt.placeholder || '')}" value="${esc(state.otherText[q.id] || '')}">
              </div>`
            : ''
        }
        <div class="nav">
          <button type="button" class="btn primary" data-action="next" ${isAnswered(q) ? '' : 'disabled'}>Next</button>
        </div>
      </section>`;
  }

  function contactScreen() {
    const c = A.contact;
    const v = state.contact;
    const follow = (val, label) =>
      `<button type="button" class="option" data-action="follow" data-value="${esc(val)}" aria-pressed="${v.followUp === val}">
         <span class="option-label">${esc(label)}</span><span class="tick" aria-hidden="true"></span>
       </button>`;
    return `
      ${topbar()}
      <section class="screen contact">
        <h2 tabindex="-1" data-focus>${esc(c.heading)}</h2>
        <form novalidate>
          <div class="fields">
            <div class="field">
              <label for="firstName">First name</label>
              <input id="firstName" name="firstName" autocomplete="given-name" maxlength="40" value="${esc(v.firstName)}" required>
            </div>
            <div class="field">
              <label for="lastName">Last name</label>
              <input id="lastName" name="lastName" autocomplete="family-name" maxlength="40" value="${esc(v.lastName)}" required>
            </div>
          </div>
          <p class="field-question" id="follow-q">${esc(c.followUpQuestion)}</p>
          <div class="options" role="group" aria-labelledby="follow-q">
            ${c.followUpOptions.map((o) => follow(o.value, o.label)).join('')}
          </div>
          <div class="reveal" data-reveal ${v.followUp === 'Yes' ? '' : 'hidden'}>
            <p class="reveal-note">${esc(c.reachNote)}</p>
            <div class="fields">
              <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" inputmode="email" autocomplete="email" maxlength="100" value="${esc(v.email)}">
              </div>
              <div class="field">
                <label for="phone">Phone</label>
                <input id="phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" value="${esc(v.phone)}">
              </div>
            </div>
            <label class="check">
              <input type="checkbox" name="okToText" ${v.okToText ? 'checked' : ''}>
              <span>${esc(c.textConsent)}</span>
            </label>
          </div>
          <div class="hp" aria-hidden="true">
            <label for="website">Website</label>
            <input id="website" name="website" tabindex="-1" autocomplete="off">
          </div>
          <p class="error" role="alert" data-error hidden></p>
          <button type="submit" class="btn primary">${esc(c.button)}</button>
          <p class="fine">${esc(c.privacyNote)}</p>
        </form>
      </section>`;
  }

  // Colors the left edge of each focus card: full points = good, 2–3 = worth a look, 0–1 = gap
  const tone = (row) => (row.points >= row.max ? 'good' : row.points >= 2 ? 'partial' : 'gap');

  function resultsScreen(r) {
    const R = A.results;
    const name = state.contact.firstName.trim();

    const strengths = r.strengths.length
      ? `<h2>${esc(R.strengthsHeading)}</h2>
         <ul class="strengths">${r.strengths
           .map((row) => `<li><span><b>${esc(row.q.category)}</b>${esc(row.opt.strength || row.q.strength)}</span></li>`)
           .join('')}</ul>`
      : '';

    const focus = r.focus.length
      ? r.focus
          .map(
            (row, i) => `
          <article class="focus s-${tone(row)}">
            <h3><span class="num">${i + 1}</span>${esc(row.q.category)}</h3>
            <p class="you-said"><span>You said:</span> “${esc(row.opt.label)}”</p>
            <p>${esc(row.opt.body || row.q.focus.body)}</p>
            <p class="ask"><span>The question to answer</span>${esc(row.q.focus.question)}</p>
          </article>`
          )
          .join('')
      : `<p>${esc(R.noFocus)}</p>`;

    const timing = r.timing.length
      ? `<aside class="timing"><p class="label">${esc(R.timingHeading)}</p>${r.timing.map((o) => `<p>${esc(o.callout)}</p>`).join('')}</aside>`
      : '';

    const wantsFollowUp = state.contact.followUp === 'Yes';
    const ctaText = wantsFollowUp ? R.ctaYes : state.contact.followUp === 'Maybe' ? R.ctaMaybe : R.ctaNo;
    const topQ = r.topQuestion ? esc(fill(wantsFollowUp ? R.ctaYesTopQuestion : R.ctaNoTopQuestion, { q: r.topQuestion })) : '';
    const reach = [
      advisor.phone ? `<a href="tel:${esc(advisor.phone.replace(/[^\d+]/g, ''))}">${esc(advisor.phone)}</a>` : '',
      advisor.email ? `<a href="mailto:${esc(advisor.email)}">${esc(advisor.email)}</a>` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const cta = `
      <aside class="cta">
        <p>${esc(fill(ctaText, { name: name || 'there' }))}</p>
        ${topQ ? `<p>${topQ}</p>` : ''}
        ${!wantsFollowUp && reach ? `<p class="reach">${esc(advisor.name || '')}<br>${reach}</p>` : ''}
        <p class="signoff">${esc(R.signoff)}</p>
      </aside>`;

    return `
      <section class="screen results">
        <p class="eyebrow">${esc(A.title)}${name ? ' · ' + esc(name) : ''}</p>
        <div class="score-card">
          <p class="score-label">${esc(R.scoreLabel)}</p>
          <p class="score"><b>${r.score}</b><span>/100</span></p>
          <div class="score-bar" aria-hidden="true"><div style="width:${r.score}%"></div></div>
          <h1 tabindex="-1" data-focus>${esc(r.band.title)}</h1>
          <p class="lede">${esc(r.band.body)}</p>
        </div>

        ${strengths}

        <h2>${esc(R.focusHeading)}</h2>
        ${focus}

        ${timing}
        ${cta}

        <div class="actions">
          <button type="button" class="btn secondary" data-action="print">Save or print my results</button>
          <button type="button" class="btn link" data-action="restart">Start over</button>
        </div>
      </section>`;
  }

  function footer() {
    return `
      <footer class="footer">
        <p>${esc(A.disclaimer)}</p>
        ${S.firmDisclosure ? `<p>${esc(S.firmDisclosure)}</p>` : ''}
      </footer>`;
  }

  // ---------- results ----------
  function computeResults() {
    const R = A.results;
    const rows = [];
    questions.forEach((q) => {
      if (!q.category) return;
      const opts = q.type === 'multi' ? pickedMany(q) : [picked(q)].filter(Boolean);
      if (!opts.length) return;
      // Pick-all-that-apply questions score their single best answer. Points are never added together.
      const best = opts.reduce((a, b) => ((b.points || 0) > (a.points || 0) ? b : a));
      const opt = opts.length > 1 ? Object.assign({}, best, { label: opts.map((o) => o.label).join(', ') }) : best;
      rows.push({ q, opt, points: best.points || 0, max: Math.max(...q.options.map((o) => o.points || 0)) });
    });

    const total = rows.reduce((n, row) => n + row.points, 0);
    const max = rows.reduce((n, row) => n + row.max, 0);
    const score = max ? Math.round((total / max) * 100) : 0;
    const band = A.bands.find((b) => score >= b.min) || A.bands[A.bands.length - 1];

    // Lowest-scoring areas first, ties broken by priority. Full-point areas never count as a focus.
    const byPriority = (a, b) => (a.q.priority || 99) - (b.q.priority || 99);
    const focus = rows
      .filter((row) => row.points < row.max)
      .sort((a, b) => a.points - b.points || byPriority(a, b))
      .slice(0, R.maxFocusAreas || 2);
    const strengths = rows
      .filter((row) => !focus.includes(row) && row.points >= (R.strengthMinPoints || 3))
      .sort((a, b) => b.points - a.points || byPriority(a, b))
      .slice(0, R.maxStrengths || 2);

    // "Timing matters" notes: any picked answer with a `callout`, in question order, max 2
    const timing = [];
    questions.forEach((q) => {
      (q.type === 'multi' ? pickedMany(q) : [picked(q)]).forEach((o) => o && o.callout && timing.push(o));
    });
    timing.splice(2);

    const topQ = byId.topQuestion;
    const topOpt = picked(topQ);
    const topQuestion = topOpt ? (topOpt.other ? otherText(topQ) : topOpt.label) : '';

    return { rows, total, max, score, band, focus, strengths, timing, topQuestion };
  }

  // What opportunities.js gets to read. Questions that weren't shown read as unanswered.
  const scoringAnswers = {
    key: (id) => (picked(byId[id]) || {}).key || '',
    has: (id, key) => pickedMany(byId[id]).some((o) => o.key === key),
    other: (id) => otherText(byId[id]),
    answer: (id) => answerText(byId[id]),
  };

  // ---------- saving to Google Sheets ----------
  function buildPayload(r, honeypot) {
    const c = state.contact;
    const yes = c.followUp === 'Yes'; // email/phone are only kept if they asked for follow-up
    const p = {
      Assessment: A.id,
      Source: state.source,
      'First name': c.firstName.trim(),
      'Last name': c.lastName.trim(),
      Email: yes ? c.email.trim() : '',
      Phone: yes ? c.phone.trim() : '',
      'OK to text': yes && c.okToText ? 'Yes' : 'No',
      'Wants follow-up': c.followUp, // Yes / Maybe / No. Keep this column name: the Apps Script email alert reads it.
    };
    const addAnswer = (q) => {
      p[q.short] = answerText(q);
      if (q.otherShort) p[q.otherShort] = otherText(q);
    };
    questions.filter((q) => q.pinned).forEach(addAnswer);

    if (typeof window.LEAD_SCORING === 'function') {
      try {
        Object.assign(p, window.LEAD_SCORING(scoringAnswers));
      } catch (err) {
        console.warn('[checkup] Lead scoring failed', err); // never blocks their results
        p['Lead scoring error'] = String(err && err.message);
      }
    }

    p['Public Score'] = r.score;
    p['Public Result Category'] = r.band.title;
    p['Focus Area 1'] = r.focus[0] ? r.focus[0].q.category : '';
    p['Focus Area 2'] = r.focus[1] ? r.focus[1].q.category : '';
    questions.filter((q) => !q.pinned).forEach(addAnswer);
    p.website = honeypot; // spam trap, the script throws out anything with this filled in
    return p;
  }

  function save(payload) {
    if (!S.endpoint) {
      console.info('[checkup] No endpoint in settings.js, so this was not saved:', payload);
      return;
    }
    try {
      fetch(S.endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch((err) => console.warn('[checkup] Could not save', err));
    } catch (err) {
      console.warn('[checkup] Could not save', err);
    }
  }

  // ---------- actions ----------
  function go(step) {
    state.step = Math.max(-1, Math.min(step, RESULTS));
    render();
  }

  function syncOptions(q) {
    const a = state.answers[q.id];
    app.querySelectorAll('[data-action="option"]').forEach((btn) => {
      const i = Number(btn.dataset.index);
      btn.setAttribute('aria-pressed', String(q.type === 'multi' ? (a || []).includes(i) : a === i));
    });
    const other = app.querySelector('.other');
    if (other) other.hidden = !otherPicked(q);
    const next = app.querySelector('[data-action="next"]');
    if (next) next.disabled = !isAnswered(q);
  }

  function choose(i) {
    if (state.advancing) return;
    const q = current();
    const opt = q.options[i];

    if (q.type === 'multi') {
      let sel = (state.answers[q.id] || []).slice();
      if (opt.exclusive) sel = sel.includes(i) ? [] : [i];
      else {
        sel = sel.filter((j) => !q.options[j].exclusive);
        sel = sel.includes(i) ? sel.filter((j) => j !== i) : sel.concat(i);
      }
      state.answers[q.id] = sel;
      syncOptions(q);
      if (opt.other && sel.includes(i)) app.querySelector('[data-other]').focus();
      return;
    }

    state.answers[q.id] = i;
    syncOptions(q);
    if (opt.other) {
      app.querySelector('[data-other]').focus();
      return;
    }
    state.advancing = true;
    setTimeout(() => {
      state.advancing = false;
      go(nextStep(state.step));
    }, 240);
  }

  function readContact(form) {
    const c = state.contact;
    c.firstName = form.firstName.value.trim();
    c.lastName = form.lastName.value.trim();
    c.email = form.email.value.trim();
    c.phone = form.phone.value.trim();
    c.okToText = form.okToText.checked;
  }

  function contactError() {
    const c = state.contact;
    if (!c.firstName || !c.lastName) return 'Please add your first and last name.';
    if (!c.followUp) return 'Pick one of the options above.';
    if (c.followUp !== 'Yes') return ''; // email/phone aren't asked for unless they said yes
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return "That email doesn't look quite right.";
    if (c.okToText && !c.phone) return 'Add a phone number, or uncheck the text option.';
    return '';
  }

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'start') go(nextStep(-1));
    else if (action === 'back') go(prevStep(state.step));
    else if (action === 'next') {
      if (isAnswered(current())) go(nextStep(state.step));
    } else if (action === 'option') choose(Number(el.dataset.index));
    else if (action === 'follow') {
      state.contact.followUp = el.dataset.value;
      app.querySelectorAll('[data-action="follow"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      app.querySelector('[data-reveal]').hidden = state.contact.followUp !== 'Yes';
    } else if (action === 'print') window.print();
    else if (action === 'restart') {
      state = freshState();
      render();
    }
  });

  app.addEventListener('input', (e) => {
    if (e.target.matches('[data-other]')) state.otherText[current().id] = e.target.value;
  });

  // Enter in an "Other" box moves on, same as tapping Next
  app.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[data-other]') && isAnswered(current())) {
      e.preventDefault();
      go(nextStep(state.step));
    }
  });

  app.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    readContact(form);
    const err = contactError();
    const box = form.querySelector('[data-error]');
    if (err) {
      box.textContent = err;
      box.hidden = false;
      return;
    }
    state.results = computeResults();
    save(buildPayload(state.results, form.website.value));
    go(RESULTS);
  });

  document.title = A.title;
  render();
})();
