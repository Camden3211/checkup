/*
  Financial Checkup engine, shared by every checkup.
  You shouldn't need to edit this file to change questions or wording.
  All of that lives in each checkup's config.js.
*/
(function () {
  'use strict';

  const A = window.ASSESSMENT;
  const S = window.SETTINGS || {};
  const advisor = S.advisor || {};
  const app = document.getElementById('app');
  const params = new URLSearchParams(window.location.search);

  const questions = A.questions;
  const CONTACT = questions.length; // step number of the contact screen
  const RESULTS = questions.length + 1; // step number of the results screen
  const STATUS = {
    good: { label: 'On track', mark: '✓', rank: 0 },
    partial: { label: 'Worth a look', mark: '~', rank: 1 },
    gap: { label: 'Gap', mark: '!', rank: 2 },
  };

  const urlName = (params.get('name') || '').trim().slice(0, 40);
  let state = freshState();

  function freshState() {
    return {
      step: -1, // -1 = intro
      answers: {}, // question id -> option index, or array of indexes for multi-select
      otherText: {}, // question id -> text typed for "Something else"
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

  function isAnswered(q) {
    const a = state.answers[q.id];
    return q.type === 'multi' ? Array.isArray(a) && a.length > 0 : typeof a === 'number';
  }

  function answerText(q) {
    const a = state.answers[q.id];
    if (q.type === 'multi') return (a || []).map((i) => q.options[i].label).join('; ');
    const opt = q.options[a];
    if (!opt) return '';
    const other = (state.otherText[q.id] || '').trim();
    return opt.other && other ? opt.label + ': ' + other : opt.label;
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
    const total = RESULTS; // questions + contact screen
    const n = state.step + 1;
    const pct = Math.round((state.step / total) * 100);
    return `
      <div class="topbar">
        <button type="button" class="back" data-action="back"><span aria-hidden="true">←</span> Back</button>
        <div class="progress" role="progressbar" aria-label="Progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${state.step}">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <span class="count">${n} of ${total}</span>
      </div>`;
  }

  function introScreen() {
    const greet = urlName ? `<p class="greeting">Hey ${esc(urlName)},</p>` : '';
    return `
      <section class="screen intro">
        ${greet}
        <h1>${esc(A.title)}</h1>
        <p class="lede">${esc(A.subtitle)}</p>
        <ul class="meta">${A.intro.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <button type="button" class="btn primary" data-action="start">${esc(A.intro.button)}</button>
        <p class="byline">${esc(A.intro.byline)}</p>
      </section>`;
  }

  function questionScreen(q) {
    const a = state.answers[q.id];
    const selected = (i) => (q.type === 'multi' ? (a || []).includes(i) : a === i);
    const otherOpt = q.options.find((o) => o.other);
    const showOther = otherOpt && q.options[a] === otherOpt;
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
            ? `<div class="other" ${showOther ? '' : 'hidden'}>
                <label for="other-text" class="visually-hidden">${esc(otherOpt.label)}</label>
                <textarea id="other-text" rows="3" maxlength="500" data-other placeholder="${esc(otherOpt.placeholder || '')}">${esc(state.otherText[q.id] || '')}</textarea>
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
      `<button type="button" class="option" data-action="follow" data-value="${val}" aria-pressed="${v.followUp === val}">
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
            ${follow('yes', c.followUpYes)}
            ${follow('no', c.followUpNo)}
          </div>
          <div class="reveal" data-reveal ${v.followUp === 'yes' ? '' : 'hidden'}>
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

  function resultsScreen(r) {
    const R = A.results;
    const name = state.contact.firstName.trim();
    const rows = r.rows
      .map(
        (row) => `
        <li class="area s-${row.status}">
          <span class="mark" aria-hidden="true">${STATUS[row.status].mark}</span>
          <span class="area-name">${esc(row.q.area)}</span>
          <span class="area-status">${STATUS[row.status].label}</span>
        </li>`
      )
      .join('');

    const focus = r.focus.length
      ? r.focus
          .map(
            (row, i) => `
          <article class="focus s-${row.status}">
            <h3><span class="num">${i + 1}</span>${esc(row.q.area)}</h3>
            <p class="you-said"><span>You said:</span> “${esc(row.opt.label)}”</p>
            <p>${esc(row.q.focus.body)}</p>
            <p class="ask"><span>The question to answer</span>${esc(row.q.focus.question)}</p>
          </article>`
          )
          .join('')
      : `<p>${esc(R.noFocus)}</p>`;

    const timing = r.timing.length
      ? `<aside class="timing"><p class="label">${esc(R.timingHeading)}</p>${r.timing.map((o) => `<p>${esc(o.callout)}</p>`).join('')}</aside>`
      : '';

    const strengths = r.strengths.length
      ? `<h2>${esc(R.strengthsHeading)}</h2>
         <ul class="strengths">${r.strengths.map((row) => `<li>${esc(row.q.strength)}</li>`).join('')}</ul>`
      : '';

    const wantsFollowUp = state.contact.followUp === 'yes';
    const topQ = r.topQuestion ? esc(fill(wantsFollowUp ? R.ctaYesTopQuestion : R.ctaNoTopQuestion, { q: r.topQuestion })) : '';
    const reach = [
      advisor.phone ? `<a href="tel:${esc(advisor.phone.replace(/[^\d+]/g, ''))}">${esc(advisor.phone)}</a>` : '',
      advisor.email ? `<a href="mailto:${esc(advisor.email)}">${esc(advisor.email)}</a>` : '',
    ]
      .filter(Boolean)
      .join(' · ');
    const cta = `
      <aside class="cta">
        <p>${esc(fill(wantsFollowUp ? R.ctaYes : R.ctaNo, { name: name || 'there' }))}</p>
        ${topQ ? `<p>${topQ}</p>` : ''}
        ${!wantsFollowUp && reach ? `<p class="reach">${esc(advisor.name || '')}<br>${reach}</p>` : ''}
        <p class="signoff">${esc(R.signoff)}</p>
      </aside>`;

    return `
      <section class="screen results">
        <p class="eyebrow">${esc(A.title)}${name ? ' · ' + esc(name) : ''}</p>
        <h1 tabindex="-1" data-focus>${esc(r.verdict.title)}</h1>
        <p class="lede">${esc(r.verdict.body)}</p>

        <div class="tally">
          <div class="t s-good"><b>${r.counts.good}</b><span>${STATUS.good.label}</span></div>
          <div class="t s-partial"><b>${r.counts.partial}</b><span>${STATUS.partial.label}</span></div>
          <div class="t s-gap"><b>${r.counts.gap}</b><span>${STATUS.gap.label}${r.counts.gap === 1 ? '' : 's'}</span></div>
        </div>
        <ul class="areas">${rows}</ul>

        ${timing}

        <h2>${esc(R.focusHeading)}</h2>
        ${focus}

        ${strengths}
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
    const rows = [];
    questions.forEach((q) => {
      if (q.type === 'multi' || q.unscored) return;
      const opt = q.options[state.answers[q.id]];
      if (opt && STATUS[opt.status]) rows.push({ q, opt, status: opt.status }); // 'na' answers are skipped
    });

    const counts = { good: 0, partial: 0, gap: 0 };
    rows.forEach((row) => counts[row.status]++);
    const openShare = rows.length ? (counts.partial + counts.gap * 2) / (rows.length * 2) : 0;
    const verdict = A.verdicts.find((v) => openShare <= v.upTo) || A.verdicts[A.verdicts.length - 1];

    const byPriority = (a, b) => (a.q.priority || 99) - (b.q.priority || 99);
    const focus = rows
      .filter((row) => row.status !== 'good' && row.q.focus)
      .sort((a, b) => STATUS[b.status].rank - STATUS[a.status].rank || byPriority(a, b))
      .slice(0, A.results.maxFocusAreas || 3);
    const strengths = rows.filter((row) => row.status === 'good' && row.q.strength).sort(byPriority).slice(0, 2);

    // "Timing matters" notes: any picked answer with a `callout`, in question order, max 2
    const timing = [];
    questions.forEach((q) => {
      const a = state.answers[q.id];
      const picked = q.type === 'multi' ? (a || []).map((i) => q.options[i]) : q.options[a] ? [q.options[a]] : [];
      picked.forEach((o) => o.callout && timing.push(o));
    });
    timing.splice(2);

    const topQ = questions.find((q) => q.id === 'topQuestion');
    let topQuestion = '';
    if (topQ && isAnswered(topQ)) {
      const opt = topQ.options[state.answers[topQ.id]];
      topQuestion = opt.other ? (state.otherText[topQ.id] || '').trim() : opt.label;
    }

    return { rows, counts, verdict, focus, strengths, timing, topQuestion };
  }

  // ---------- saving to Google Sheets ----------
  function buildPayload(r, honeypot) {
    const c = state.contact;
    const yes = c.followUp === 'yes'; // email/phone are only kept if they asked for follow-up
    const p = {
      Assessment: A.id,
      Source: state.source,
      'First name': c.firstName.trim(),
      'Last name': c.lastName.trim(),
      Email: yes ? c.email.trim() : '',
      Phone: yes ? c.phone.trim() : '',
      'OK to text': yes && c.okToText ? 'Yes' : 'No',
      'Wants follow-up': yes ? 'Yes' : 'No',
      Result: r.verdict.title,
      'On track': r.counts.good,
      'Worth a look': r.counts.partial,
      Gaps: r.counts.gap,
      'Focus 1': r.focus[0] ? r.focus[0].q.area : '',
      'Focus 2': r.focus[1] ? r.focus[1].q.area : '',
      'Focus 3': r.focus[2] ? r.focus[2].q.area : '',
    };
    questions.forEach((q) => {
      p[q.short] = answerText(q);
    });
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
    if (other) other.hidden = !(q.options[a] && q.options[a].other);
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
      go(state.step + 1);
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
    if (!c.followUp) return 'Pick whether you want me to look over your results.';
    if (c.followUp !== 'yes') return ''; // email/phone aren't asked for unless they said yes
    if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) return "That email doesn't look quite right.";
    if (c.okToText && !c.phone) return 'Add a phone number, or uncheck the text option.';
    return '';
  }

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'start') go(0);
    else if (action === 'back') go(state.step - 1);
    else if (action === 'next') {
      if (isAnswered(current())) go(state.step + 1);
    } else if (action === 'option') choose(Number(el.dataset.index));
    else if (action === 'follow') {
      state.contact.followUp = el.dataset.value;
      app.querySelectorAll('[data-action="follow"]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
      app.querySelector('[data-reveal]').hidden = state.contact.followUp !== 'yes';
    } else if (action === 'print') window.print();
    else if (action === 'restart') {
      state = freshState();
      render();
    }
  });

  app.addEventListener('input', (e) => {
    if (e.target.matches('[data-other]')) state.otherText[current().id] = e.target.value;
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
