/*
  PRIVATE LEAD SCORING: Business Owner Financial Checkup
  Runs when someone finishes. The output goes to your Google Sheet and email alert only.
  None of it is ever shown on their results page, and none of it changes their public score.
  Heads up: like all the page code, this file is public on GitHub, so someone digging through
  the page source could read it.

  Each opportunity column is saved as "LEVEL · why", e.g. "HIGH · $500k–$999k, self-managed".
  Blank = no opportunity there. To sort leads in the Sheet: Data → Create a filter, then filter
  a column by "Text starts with" HIGH.

  Answers are matched by the `key` on each option in config.js, not the wording, so you can
  reword answers there without breaking anything here.
*/
window.LEAD_SCORING = function (a) {
  // a.key('assets')             -> key of the answer they picked, e.g. '500k' ('' if not asked)
  // a.has('changes', 'sellBiz') -> true if they ticked that box
  // a.other('changes')          -> what they typed in "Other"
  // a.answer('topQuestion')     -> the answer as they saw it
  const ch = (k) => a.has('changes', k);
  const opp = (level, why) => ({ level: level || '', why: [].concat(why).filter(Boolean).join(', ') });
  const cell = (o) => (o.level ? o.level + ' · ' + o.why : '');
  const isHigh = (o) => o.level === 'HIGH';

  // ---------- AUM (Q1 assets + Q2 who manages them) ----------
  const ASSETS = {
    under50k: { points: 0, min: 0, text: 'Under $50k' },
    '50k': { points: 1, min: 50000, text: '$50k–$249k' },
    '250k': { points: 3, min: 250000, text: '$250k–$499k' },
    '500k': { points: 5, min: 500000, text: '$500k–$999k' },
    '1m': { points: 8, min: 1000000, text: '$1M–$1.99M' },
    '2m': { points: 10, min: 2000000, text: '$2M+' },
  };
  const MANAGED = {
    self: { points: 3, text: 'self-managed', lead: 'retirement planning and investment coordination' },
    shallow: { points: 3, text: 'advisor mostly just talks investments', lead: 'a planning-first second opinion' },
    plans: { points: 2, text: 'mostly in retirement plans, not much planning', lead: 'coordinating the money sitting in retirement plans' },
    happy: { points: 0, text: "has an advisor they're happy with", lead: 'a planning-first second opinion, only if they want one' },
    none: { points: 0, text: 'no investments yet', lead: 'building wealth outside the business' },
  };
  const mgmtKey = a.key('management');
  const assets = ASSETS[a.key('assets')] || { points: 0, min: 0, text: '' };
  const mgmt = MANAGED[mgmtKey] || { points: 0, text: '', lead: '' };
  const aumPoints = assets.points + mgmt.points;
  const diy = mgmtKey === 'self' || mgmtKey === 'shallow'; // self-managed, or advisor only does investments

  let aumLevel = 'LOW';
  if (assets.min >= 1000000 || (assets.min >= 500000 && diy)) aumLevel = 'HIGH';
  // Your rule: $250k–$499k and self-managed or a shallow advisor.
  // Added: $500k+ with any other setup, and $250k+ mostly sitting in retirement plans.
  else if (assets.min >= 500000 || (assets.min >= 250000 && (diy || mgmtKey === 'plans'))) aumLevel = 'MEDIUM';
  const aum = opp(aumLevel, [assets.text, mgmt.text]);

  // ---------- Excess cash (Q4 + its follow-up) ----------
  // The amount is only asked when cash "mostly accumulates", so any amount already means no defined strategy.
  const CASH = {
    under25k: { level: 'LOW', text: 'under $25k' },
    '25k': { level: 'LOW/MEDIUM', text: '$25k–$74k' },
    '75k': { level: 'MEDIUM', text: '$75k–$149k' },
    '150k': { level: 'HIGH', text: '$150k–$299k' },
    '300k': { level: 'HIGH', text: '$300k+' },
    unsure: { level: 'MEDIUM', text: 'an unknown amount of' }, // added: cash piles up and they don't know how much
  };
  const cash = a.key('cashUse') === 'accumulates' ? CASH[a.key('cashAmount')] || null : null;
  const excessCash = cash ? opp(cash.level, cash.text + ' cash sitting in the business, no set plan') : opp();
  const bigCash = !!cash && cash.level === 'HIGH';
  const someCash = !!cash && cash.level !== 'LOW';

  // ---------- Retirement plan (Q5, pick all that apply) ----------
  const plan = (k) => a.has('retirementPlan', k);
  const has401kType = plan('company401k') || plan('solo401k') || plan('cashBalance');
  const sepSimpleOnly = (plan('sep') || plan('simple')) && !has401kType; // a personal IRA alongside is fine
  const iraOnly = plan('ira') && !has401kType && !plan('sep') && !plan('simple');
  const sepSimpleText = plan('sep') && plan('simple') ? 'SEP and SIMPLE IRA' : plan('sep') ? 'SEP IRA' : 'SIMPLE IRA';
  let retirementPlan = opp();
  if (plan('none')) retirementPlan = opp('HIGH', 'nothing set up for retirement right now');
  else if (plan('unsure')) retirementPlan = opp('HIGH', "not sure what they're using for retirement");
  else if (iraOnly) retirementPlan = opp('HIGH', 'personal IRA only, no business plan');
  else if (sepSimpleOnly) retirementPlan = opp('MEDIUM', sepSimpleText + ' only, no 401(k)-type plan');
  // Added: a 401(k)-type plan isn't an opportunity by itself, but $75k+ of idle cash next to it is a reason to look
  else if (has401kType && !plan('cashBalance') && someCash && cash.level !== 'LOW/MEDIUM')
    retirementPlan = opp('MEDIUM', 'has a plan, but ' + cash.text + ' extra cash sits idle');

  // ---------- 401(k) review (Q5 follow-up) ----------
  const REVIEW = {
    lastYear: ['LOW', 'reviewed within the last year'],
    '1to3': ['MEDIUM', 'last reviewed 1–3 years ago'],
    over3: ['HIGH', 'last reviewed 3+ years ago'],
    never: ['HIGH', 'never independently reviewed'],
    unknown: ['HIGH', "doesn't know when it was last reviewed"],
  };
  // Only asked when they ticked Company 401(k), so a blank answer means it doesn't apply
  const review = REVIEW[a.key('planReview')] ? opp(...REVIEW[a.key('planReview')]) : opp();

  // ---------- Money in motion (Q8) ----------
  const mimWhy = [];
  if (ch('sellBiz')) mimWhy.push('selling the business');
  if (ch('retire')) mimWhy.push('retiring or cutting back');
  if (ch('inheritance')) mimWhy.push('inheritance or large sum');
  if (ch('realEstate')) mimWhy.push('selling real estate');
  const mimLevel = ch('sellBiz') || ch('retire') || ch('inheritance') ? 'HIGH' : ch('realEstate') ? 'MEDIUM/HIGH' : '';
  const moneyInMotion = opp(mimLevel, mimWhy.join(', ') + ' in the next 3–5 years');

  // ---------- Exit planning (Q7 + Q8) ----------
  const sale = a.key('saleDependence');
  const SALE_TEXT = { important: 'sale is an important part of the plan', isThePlan: 'sale is basically the retirement plan' };
  let exit = opp();
  if (ch('sellBiz')) exit = opp('HIGH', ['expects to sell in the next 3–5 years', SALE_TEXT[sale]]);
  else if (SALE_TEXT[sale]) exit = opp('MEDIUM', SALE_TEXT[sale]);

  // ---------- Planning ----------
  // Big items count 2, smaller ones 1. HIGH = 4+ (e.g. any two big items), MEDIUM = 1–3.
  // Without this, one big item alone would make almost everyone HIGH.
  const SELLING = 'selling the business';
  const RETIRING = 'retiring or cutting back in 3–5 years';
  const clarity = a.key('clarity');
  const conc = a.key('concentration');
  const topQ = a.key('topQuestion');
  const big = [];
  if (clarity === 'notRun') big.push("hasn't run the retirement numbers");
  if (clarity === 'whenNotWhat') big.push("knows when they'd like to stop, not what they'll need");
  if (conc === 'over50' || conc === 'almostAll') big.push('most of their net worth is the business');
  if (sale === 'isThePlan') big.push('the sale is the retirement plan');
  if (topQ === 'decision') big.push('has a major financial decision to make');
  if (topQ === 'taxes') big.push('wants a tax question answered');
  if (topQ === 'investments' || mgmtKey === 'plans') big.push('no clear investment strategy');
  if (ch('move')) big.push('moving states');
  if (ch('sellBiz')) big.push(SELLING);
  if (ch('retire')) big.push(RETIRING);
  const small = [];
  if (conc === 'unsure') small.push('unsure how much is tied up in the business');
  if (a.key('cashUse') === 'distributions' || a.key('cashUse') === 'accumulates') small.push('no system for extra cash');
  if (iraOnly || plan('none')) small.push('no business retirement plan');
  if (plan('unsure')) small.push('unsure of their retirement setup');
  if (sale === 'important') small.push('counting on a sale');
  if (sale === 'neverThought') small.push("hasn't thought about selling");
  if (ch('expand')) small.push('buying or expanding a business');
  if (ch('purchase')) small.push('major home or property purchase');
  if (ch('realEstate')) small.push('selling real estate');
  if (ch('inheritance')) small.push('inheritance coming');
  if (ch('other')) small.push('other change: ' + (a.other('changes') || 'not specified'));
  const planningPoints = big.length * 2 + small.length;
  const planning = opp(planningPoints >= 4 ? 'HIGH' : planningPoints >= 1 ? 'MEDIUM' : '', big.concat(small).slice(0, 3));
  const realPlanningNeed = planningPoints >= 2; // at least one big item, or two smaller ones

  // ---------- Lead priority ----------
  const asksForHelp = ['investments', 'onTrack', 'rightPlan', 'decision'].includes(topQ);
  let priority = 'C';
  if (
    (assets.min >= 1000000 && (realPlanningNeed || mgmtKey !== 'happy')) ||
    (assets.min >= 500000 && mgmtKey === 'self' && realPlanningNeed) ||
    // We don't ask what the business is worth, so $500k+ invested or $150k+ idle cash stands in for "substantial proceeds"
    (ch('sellBiz') && (assets.min >= 500000 || bigCash)) ||
    (assets.min >= 500000 && asksForHelp)
  ) {
    priority = 'A+';
  } else if (
    (assets.min >= 250000 && realPlanningNeed) ||
    bigCash ||
    (ch('retire') && assets.min >= 50000) || // near retirement (under $50k invested drops to B)
    isHigh(planning) ||
    isHigh(review)
  ) {
    priority = 'A';
  } else if (
    aumLevel !== 'LOW' ||
    realPlanningNeed ||
    retirementPlan.level || // IRA-only / nothing / not sure, or SEP/SIMPLE only
    exit.level ||
    moneyInMotion.level ||
    someCash ||
    plan('cashBalance') ||
    review.level === 'MEDIUM'
  ) {
    priority = 'B';
  }

  // ---------- Follow-up angle: the strongest reason first, plus one supporting fact ----------
  const signals = [];
  const add = (when, fact, lead) => when && signals.push({ fact, lead });
  const bigGap = big.find((b) => b !== SELLING && b !== RETIRING);
  add(ch('sellBiz'), 'business sale planned within 3–5 years', 'exit / sale proceeds / retirement analysis');
  add(isHigh(aum), aum.why, mgmt.lead);
  add(bigCash, cash && cash.text + ' excess business cash + no defined strategy', 'business liquidity / excess cash planning');
  add(isHigh(review), 'company 401(k) ' + review.why, 'a 401(k) fee, investment and plan-design review');
  add(isHigh(retirementPlan), retirementPlan.why, 'business retirement-plan review');
  add(ch('retire'), 'retiring or cutting back within 3–5 years', 'retirement income and timing');
  add(ch('inheritance'), 'inheritance or large sum expected', 'a plan for the incoming money');
  add(aumLevel === 'MEDIUM', aum.why, mgmt.lead);
  add(!!bigGap, bigGap, 'retirement target and wealth-outside-the-business planning');
  add(someCash && !bigCash, cash && cash.text + ' excess business cash, no set plan', 'excess cash planning');
  add(!!exit.level, exit.why, 'exit planning');
  add(sepSimpleOnly, sepSimpleText + ' only, no 401(k)-type plan', 'whether a different retirement setup fits better');
  // Skip smaller items that just repeat a retirement-plan or cash point already made above
  const covered = [];
  if (retirementPlan.level) covered.push('no business retirement plan', 'unsure of their retirement setup');
  if (cash) covered.push('no system for extra cash');
  const smallFact = small.find((s) => !covered.includes(s));
  add(!!smallFact, smallFact, 'the question they picked');

  let angle;
  if (signals.length) {
    const [first, second] = signals;
    const fact = first.fact.charAt(0).toUpperCase() + first.fact.slice(1);
    angle = fact + (second && second.fact !== first.fact ? ' + ' + second.fact : '') + ' — lead with ' + first.lead + '.';
  } else {
    const q = a.other('topQuestion') || a.answer('topQuestion');
    angle = 'Nothing urgent flagged — nurture' + (q ? '. Their question: "' + q + '"' : '.');
  }

  // ---------- Saved to the Sheet, in this column order ----------
  const named = [
    ['AUM', aum],
    ['PLANNING', planning],
    ['RETIREMENT PLAN', retirementPlan],
    ['401(K) REVIEW', review],
    ['EXCESS CASH', excessCash],
    ['MONEY IN MOTION', moneyInMotion],
    ['EXIT PLANNING', exit],
  ];
  const tags = named.filter(([, o]) => o.level && o.level !== 'LOW').map(([n, o]) => n + ' ' + o.level);
  if (priority === 'C') tags.push('NURTURE');

  return {
    'Hidden Lead Priority': priority,
    'Follow-Up Angle': angle,
    'Opportunity Tags': tags.join(', '),
    'AUM Points': aumPoints,
    'AUM Opportunity': cell(aum),
    'Planning Opportunity': cell(planning),
    'Retirement Plan Opportunity': cell(retirementPlan),
    '401(k) Review Opportunity': cell(review),
    'Excess Cash Opportunity': cell(excessCash),
    'Money In Motion Opportunity': cell(moneyInMotion),
    'Exit Planning Opportunity': cell(exit),
  };
};
