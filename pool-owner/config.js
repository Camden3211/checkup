/*
  POOL OWNER FINANCIAL CHECKUP: all wording and logic for this checkup.
  Change questions, answers and result text here. You never need to touch shared/app.js for that.

  On every answer, `status` decides how it shows up in the results:
    'good'    = On track
    'partial' = Worth a look
    'gap'     = Gap
    'na'      = Doesn't apply (left out of the results entirely)

  On every question, `priority` decides which areas come first under "Where I'd look first"
  (lower number = shown first). Gaps always come before "worth a look" items.

  `short` is the column name in your Google Sheet, so keep it short and don't reuse one.
  Text in {curly braces} gets filled in automatically: {name} = their first name, {q} = their top question.
*/
window.ASSESSMENT = {
  id: 'pool-owner', // also the name of the tab in your Google Sheet

  title: 'Pool Owner Financial Checkup',
  subtitle:
    'See whether your pool business is actually building your retirement, or whether the business is the retirement plan.',
  intro: {
    bullets: ['About 3 minutes', 'No documents or account balances', 'Results right away'],
    byline:
      'Put together by Camden Hardy, former owner of Hardy Hydro Solutions, now a financial advisor working with Arizona business owners.',
    button: 'Start the checkup',
  },

  questions: [
    {
      id: 'retirement',
      short: 'Retirement savings',
      area: 'Retirement savings outside the business',
      priority: 4,
      text: 'Outside of the business itself, what are you doing for retirement right now?',
      options: [
        { label: 'Nothing right now', status: 'gap' },
        { label: 'Mainly an IRA', status: 'partial' },
        { label: 'A business retirement plan (Solo 401(k), SEP, SIMPLE, etc.)', status: 'good' },
        { label: 'A business plan plus other investing', status: 'good' },
      ],
      focus: {
        body:
          "A lot of owners who make good money only put away what an IRA allows, or nothing at all, because the business always seems to need it more. Depending on your income and how the business is set up, a business retirement plan may let you save more, sometimes a lot more, and change how that money is taxed.",
        question: 'How much could you be putting away through the business, and what would it change?',
      },
      strength: "You're saving for retirement through the business, not just around it.",
    },
    {
      id: 'target',
      short: 'Retirement number',
      area: 'Your retirement number',
      priority: 3,
      text: 'Do you know roughly how much you need saved to retire when you want to?',
      options: [
        { label: 'Yes, and I check on it', status: 'good' },
        { label: 'I have a rough idea', status: 'partial' },
        { label: 'Not really', status: 'gap' },
        { label: 'No idea', status: 'gap' },
      ],
      focus: {
        body:
          "Without a target there's no way to tell if what you're doing is enough, too little, or more than you need. It doesn't have to be exact, but you should know roughly what the number is and whether you're on pace for it.",
        question: 'What do you actually need, by when, and are you on pace?',
      },
      strength: 'You know your retirement number and keep track of it.',
    },
    {
      // Not scored. It's a timeline, not right or wrong. It feeds the "Timing matters" box.
      id: 'horizon',
      short: 'Work optional by',
      unscored: true,
      text: 'When would you like work to become optional?',
      options: [
        {
          label: 'Within 5 years',
          callout:
            "You'd like work to be optional within 5 years. That's not a lot of runway, so the decisions you make in the next year or two will carry more weight than usual.",
        },
        {
          label: '5–10 years',
          callout:
            "You'd like work to be optional in 5 to 10 years. That's enough time to change the outcome, if the plan starts now rather than in a few years.",
        },
        { label: '10–20 years' },
        { label: '20+ years' },
        {
          label: "I haven't really thought about it",
          callout:
            "You haven't picked a date for when work becomes optional. Almost everything else, from how much to save to what the business needs to sell for, depends on that one answer.",
        },
      ],
    },
    {
      id: 'concentration',
      short: 'Net worth in business',
      area: 'Wealth outside the business',
      priority: 2,
      text: 'Roughly how much of your net worth is the business?',
      help: 'Your best guess is fine.',
      options: [
        { label: 'Less than a quarter', status: 'good' },
        { label: 'About a quarter to half', status: 'partial' },
        { label: 'More than half', status: 'gap' },
        { label: 'Almost all of it', status: 'gap' },
      ],
      focus: {
        body:
          "When most of your net worth is the business, your future rides on one asset you can't easily sell, spread out or borrow against, and on you staying healthy enough to run it. Building wealth outside the company is how owners take some of that risk off the table.",
        question: 'How much should be moving out of the business each year, and where should it go?',
      },
      strength: "You've built real wealth outside the business.",
    },
    {
      id: 'dependence',
      short: 'Retirement depends on sale',
      area: 'How much rides on selling',
      priority: 1,
      text: 'How much does your retirement depend on selling the business someday?',
      options: [
        { label: "It doesn't. I'm on track either way", status: 'good' },
        { label: "A sale would help, but it isn't essential", status: 'good' },
        { label: "It's an important part of the plan", status: 'partial' },
        { label: 'Selling the business is basically the plan', status: 'gap' },
      ],
      focus: {
        body:
          "If the sale is the plan, the sale has to go right: the timing, the buyer, the price, and what routes are going for when you're ready. That's a lot riding on things you don't fully control.",
        question: 'If the sale came in well under what you hope, would you still be okay?',
      },
      strength: "Your retirement doesn't hinge on selling the business.",
    },
    {
      id: 'exitNumber',
      short: 'Knows sale number',
      area: 'Knowing your sale number',
      priority: 1,
      text: 'If you sold, do you know what the business would need to sell for, after taxes and fees, to fund your retirement?',
      options: [
        { label: 'Yes, I know the number', status: 'good' },
        { label: 'I have a ballpark', status: 'partial' },
        { label: 'No', status: 'gap' },
        { label: "I'm not planning to sell", status: 'na' },
      ],
      focus: {
        body:
          "What the business sells for and what you actually keep aren't the same number. Taxes, broker fees and how the deal is structured all come out of it. Owners who work this out 3 to 5 years ahead have time to change the outcome. Owners who figure it out at closing usually have far fewer options.",
        question: 'What does the business need to sell for, after taxes and fees, to fund the retirement you want?',
      },
      strength: 'You know what the business needs to sell for.',
    },
    {
      id: 'cash',
      short: 'Business cash',
      area: 'Business cash',
      priority: 5,
      text: 'How do you handle cash in the business?',
      options: [
        { label: 'I keep a set reserve, and anything above it has a plan', status: 'good' },
        { label: 'I keep enough for expenses and the season. The rest just sits', status: 'partial' },
        { label: 'I mostly leave whatever builds up', status: 'gap' },
        { label: "I'm not sure how much should stay", status: 'gap' },
      ],
      focus: {
        body:
          "Cash that sits in the business account without a target is usually either too little, so a slow month hurts, or too much, so it isn't doing anything for you. A set reserve based on your real expenses and seasons tells you exactly what's extra.",
        question: 'How much should actually stay in the business, and what should happen to the rest?',
      },
      strength: 'You run the business with a set cash reserve and a plan for the extra.',
    },
    {
      id: 'investments',
      short: 'Investment strategy',
      area: 'Investment strategy',
      priority: 6,
      text: 'Do you have a defined strategy for your investments outside the business?',
      options: [
        { label: 'Yes, and I review it regularly', status: 'good' },
        { label: "Generally, but it's not very structured", status: 'partial' },
        { label: 'I invest when I can, without a real plan', status: 'gap' },
        { label: "I don't have investments outside the business yet", status: 'gap' },
      ],
      focus: {
        body:
          "Investing without a set strategy usually means the accounts don't match your timeline, your risk or each other, especially with old accounts scattered around. A strategy gives every account a job.",
        question: 'What is each account supposed to accomplish, and is it set up to do that?',
      },
      strength: 'Your investments have a defined strategy that you review.',
    },

    // ---- Not scored: only you see these (Sheet + email). They size the opportunity. ----
    {
      id: 'assets',
      short: 'Invested outside business',
      unscored: true,
      text: 'Roughly how much do you have in retirement and investment accounts, outside the business?',
      help: "Ranges are fine. Only I see this, and you can skip it.",
      options: [
        { label: 'Under $50,000' },
        { label: '$50,000 – $250,000' },
        { label: '$250,000 – $500,000' },
        { label: '$500,000 – $1 million' },
        { label: '$1 – $2 million' },
        { label: '$2 million +' },
        { label: 'Prefer not to say' },
      ],
    },
    {
      id: 'management',
      short: 'Investments managed by',
      unscored: true,
      text: 'How are those investments managed today?',
      options: [
        { label: 'I manage them myself' },
        { label: "With an advisor I'm happy with" },
        { label: "With an advisor, but I'm not sure what I'm getting" },
        { label: 'Mostly through a 401(k) or other retirement plan' },
        { label: "I don't really have investments yet" },
      ],
    },
    {
      id: 'bizCash',
      short: 'Extra business cash',
      unscored: true,
      text: 'Beyond normal monthly expenses, about how much cash does the business usually carry?',
      help: "Ranges are fine. Only I see this, and you can skip it.",
      options: [
        { label: 'Under $25,000' },
        { label: '$25,000 – $75,000' },
        { label: '$75,000 – $150,000' },
        { label: '$150,000 – $300,000' },
        { label: '$300,000 +' },
        { label: 'Prefer not to say' },
      ],
    },

    // ---- Not scored: used for the "Timing matters" box and for your follow-up ----
    {
      id: 'changes',
      short: 'Big changes ahead',
      type: 'multi',
      text: 'Are any big financial changes on your radar over the next few years?',
      help: 'Pick all that apply.',
      options: [
        {
          label: 'Sell the pool business',
          callout:
            'You said you may sell the business in the next few years. Most of the planning that affects what you keep happens before the sale, not after it.',
        },
        {
          label: 'Retire or step back',
          callout:
            "You said you may retire or step back in the next few years. That window is when savings, tax and investment decisions start getting harder to undo.",
        },
        {
          label: 'Buy routes or expand',
          callout:
            'Growing the business and building wealth outside it compete for the same dollars. The split is worth deciding on purpose.',
        },
        {
          label: 'Sell real estate',
          callout:
            'A property sale can bring a tax bill and a pile of cash at the same time. Both are easier to handle with a plan in place first.',
        },
        {
          label: 'Receive an inheritance',
          callout: 'An inheritance is easier to handle well when there is a plan in place before it arrives.',
        },
        { label: 'A major purchase (home, trucks, equipment)' },
        { label: 'Nothing big that I know of', exclusive: true },
      ],
    },
    {
      id: 'topQuestion',
      short: 'Top question',
      unscored: true,
      text: 'Which question would you most like answered right now?',
      options: [
        { label: 'Am I actually on track to retire?' },
        { label: 'What should I be doing beyond my IRA?' },
        { label: 'What should I do with extra cash in the business?' },
        { label: 'Is too much of my wealth tied up in the business?' },
        { label: 'What does my business need to sell for to fund my retirement lifestyle?' },
        { label: 'What should I do with the investments I already have?' },
        { label: 'Am I paying more in taxes than I need to?' },
        { label: 'Something else', other: true, placeholder: "What's on your mind?" },
      ],
    },
  ],

  // Shown on the last screen before results.
  contact: {
    heading: 'Last step',
    followUpQuestion: 'Want me to look over your results personally?',
    followUpYes: "Yes, tell me the 1 or 2 things you'd look at first",
    followUpNo: 'Not right now. Just show me my results',
    reachNote: "Want me to reach you directly? Add an email or phone. Both are optional.",
    textConsent: "It's OK to text me about my results at this number.",
    privacyNote: "I'll only use this to follow up on your checkup. No mailing list, and I don't share your info.",
    button: 'See my results',
  },

  // The headline on the results page. `upTo` is the share of areas with open items
  // (0 = everything on track, 1 = every area is a gap). The first one that fits is used.
  verdicts: [
    {
      upTo: 0.25,
      title: "You're ahead of most owners.",
      body:
        'Most of the pieces are in place. The next step is making sure they work together, so the business, your investments, your taxes and your exit all point at the same target instead of being separate decisions.',
    },
    {
      upTo: 0.45,
      title: 'Solid in places, with some real gaps.',
      body:
        "You've made progress, but a few important areas are running without a set plan. The gaps below are worth closing while you still have time to do it on your terms.",
    },
    {
      upTo: 0.7,
      title: 'The business is doing most of the heavy lifting.',
      body:
        'Your answers suggest your future still depends heavily on the business: its income now, and what it sells for later. Building more structure outside of it deserves a hard look.',
    },
    {
      upTo: 1,
      title: 'Right now, the business is the plan.',
      body:
        "That's common. Most owners pour everything into the business because it needs it. But it means one asset is carrying your whole future. The good news is that each gap below is a decision you can make, not a problem you're stuck with.",
    },
  ],

  results: {
    maxFocusAreas: 3,
    focusHeading: "Where I'd look first",
    noFocus:
      "Nothing jumped out as a gap. The next step is coordination: making sure your business, investments, taxes and exit plan are all aimed at the same target.",
    strengthsHeading: "What you're doing well",
    timingHeading: 'Timing matters',
    ctaYes:
      "Thanks, {name}. I'll go through your answers personally and reach out in the next day or two with the 1 or 2 things I'd look at first.",
    ctaYesTopQuestion: 'I\'ll start with your question: "{q}"',
    ctaNo:
      "No problem. Save or print this page and use it as a checklist. If you want a second set of eyes later, I'm easy to reach.",
    ctaNoTopQuestion: 'You said the question you most want answered is "{q}" That one is worth getting a real answer to.',
    signoff: 'Cam',
  },

  disclaimer:
    'This checkup is for educational purposes only and is not individualized investment, tax or legal advice. Results are based only on the answers you gave and are meant to point out areas that may be worth a closer look.',
};
