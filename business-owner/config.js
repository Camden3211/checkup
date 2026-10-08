/*
  BUSINESS OWNER FINANCIAL CHECKUP: everything the person sees.
  Change questions, answers and result text here. The private lead scoring lives in opportunities.js.

  On every answer:
    `key`    = a short name the scoring uses. If you reword an answer, leave its key alone.
    `points` = 0–4 toward their public score (only on the 5 scored questions).

  On every scored question (the ones with a `category`):
    `priority` breaks ties when picking which areas to show first (lower number = shown first).
    `focus`    = shown under "Areas worth a closer look". An answer can have its own `body` to replace focus.body.
    `strength` = shown under "What you're doing well". An answer can have its own `strength`.

  `short`    = the column name in your Google Sheet, so keep it short and don't reuse one.
  `showIf`   = only ask this question if they picked one of those answers on an earlier question.
               Follow-up questions keep the same "Question X of 9" number as the question before them.
  `callout`  = a note for the "Timing matters" box on their results (max 2 show).
  `pinned`   = put this answer's column right after their contact info in the Sheet and email.
  Text in {curly braces} gets filled in automatically: {name} = their first name, {q} = their top question.
*/
window.ASSESSMENT = {
  id: 'business-owner', // also the name of the tab in your Google Sheet

  title: 'Business Owner Financial Checkup',
  intro: {
    hook: 'Is your business actually building your personal wealth, or just keeping you busy?',
    subtext:
      'Answer a few quick questions to see how intentionally your business, retirement, investments and long-term financial future are working together.',
    bullets: ['Takes about 3 minutes', 'No documents or exact account balances required', 'Results right away'],
    byline:
      'Put together by Camden Hardy, former owner of Hardy Hydro Solutions, a pool service and repair company, now a financial advisor working with Arizona business owners.',
    button: 'Start my checkup',
  },

  questions: [
    // Q1 and Q2 are private. They size the opportunity and never affect the score.
    {
      id: 'assets',
      short: 'Q1 Asset Range',
      text: 'Outside the value of your business, roughly how much do you currently have in retirement and investment accounts?',
      help: "A rough range is fine. Only I see this, and it doesn't change your score.",
      options: [
        { key: 'under50k', label: 'Under $50,000' },
        { key: '50k', label: '$50,000–$249,999' },
        { key: '250k', label: '$250,000–$499,999' },
        { key: '500k', label: '$500,000–$999,999' },
        { key: '1m', label: '$1 million–$1.99 million' },
        { key: '2m', label: '$2 million+' },
      ],
    },
    {
      id: 'management',
      short: 'Q2 Investment Management',
      text: 'How are those investments currently managed?',
      options: [
        { key: 'self', label: 'I manage them myself' },
        { key: 'happy', label: "I have a financial advisor I'm happy with" },
        { key: 'shallow', label: 'I have an advisor, but we mostly just talk investments' },
        { key: 'plans', label: "Most of it is in retirement plans and I don't do much with it" },
        { key: 'none', label: "I don't really have investments yet" },
      ],
    },

    // ---- Scored: Q3–Q7, 4 points each, 20 total ----
    {
      id: 'concentration',
      short: 'Q3 Business Concentration',
      category: 'Wealth outside the business',
      priority: 2,
      text: 'Roughly how much of your net worth is tied up in your business?',
      help: 'Your best guess is fine.',
      options: [
        { key: 'under25', label: 'Less than 25%', points: 4 },
        {
          key: '25to50',
          label: '25%–50%',
          points: 3,
          strength: 'A meaningful part of your wealth already sits outside the business.',
        },
        { key: 'over50', label: 'More than 50%', points: 2 },
        { key: 'almostAll', label: 'Almost all of it', points: 0 },
        {
          key: 'unsure',
          label: "I'm not sure",
          points: 1,
          body:
            "If you're not sure how much of your net worth is the business, it's hard to know how much risk you're carrying. A rough number is the starting point for deciding how much should be building outside it.",
        },
      ],
      focus: {
        body:
          "When most of your net worth is the business, your future rides on one asset you can't easily sell, divide or borrow against. Building wealth outside the company is how owners take some of that risk off the table.",
        question: 'How much should be moving out of the business each year, and where should it go?',
      },
      strength: "You've built real wealth outside the business.",
    },
    {
      id: 'cashUse',
      short: 'Q4 Excess Cash Behavior',
      category: 'Business cash strategy',
      priority: 5,
      text: 'When the business generates more cash than it needs to operate, what usually happens to it?',
      options: [
        { key: 'plan', label: 'I have a defined reserve and a plan for anything above it', points: 4 },
        {
          key: 'reinvest',
          label: 'I intentionally reinvest most of it into the business',
          points: 3,
          strength: 'Extra cash goes back into the business on purpose, not by default.',
        },
        { key: 'distributions', label: "I take distributions, but there isn't much of a system", points: 2 },
        { key: 'accumulates', label: 'It mostly accumulates in cash', points: 1 },
        {
          key: 'littleExtra',
          label: "There usually isn't much excess cash",
          points: 2,
          body:
            "When there usually isn't much left over, the question becomes how much you're paying yourself and whether any of it is building wealth outside the business.",
        },
      ],
      focus: {
        body:
          "Cash without a target is usually either too little for a slow stretch or more than the business needs, just sitting there. A set reserve based on your real expenses tells you exactly what's extra and what it could be doing.",
        question: 'How much should stay in the business, and what should happen to the rest?',
      },
      strength: 'You keep a set cash reserve and have a plan for anything above it.',
    },
    {
      // Private follow-up. Only asked if cash "mostly accumulates". Doesn't affect the score.
      id: 'cashAmount',
      short: 'Conditional Excess Cash Amount',
      showIf: { question: 'cashUse', answers: ['accumulates'] },
      text: 'Roughly how much cash tends to sit in the business above what you normally need for operating expenses?',
      help: 'A rough range is fine. Only I see this.',
      options: [
        { key: 'under25k', label: 'Under $25,000' },
        { key: '25k', label: '$25,000–$74,999' },
        { key: '75k', label: '$75,000–$149,999' },
        { key: '150k', label: '$150,000–$299,999' },
        { key: '300k', label: '$300,000+' },
        { key: 'unsure', label: "I'm not sure" },
      ],
    },
    {
      id: 'retirementPlan',
      short: 'Q5 Retirement Setup',
      category: 'Retirement structure',
      priority: 4,
      text: 'What retirement setup does your business currently have?',
      options: [
        { key: 'cashBalance', label: '401(k) plus cash balance / pension-style plan', points: 4 },
        { key: 'company401k', label: 'Company 401(k)', points: 4 },
        { key: 'solo401k', label: 'Solo 401(k)', points: 4 },
        {
          key: 'sepSimple',
          label: 'SEP or SIMPLE IRA',
          points: 3,
          body:
            "SEP and SIMPLE IRAs are easy to run, but they aren't always the best fit as income grows or the team changes. Depending on your income and whether you have employees, a different setup may let you put away more.",
        },
        { key: 'ira', label: 'Mainly an IRA personally', points: 1 },
        { key: 'none', label: 'No retirement plan through the business', points: 0 },
        {
          key: 'unsure',
          label: "I'm not sure",
          points: 0,
          body:
            "If you're not sure what the business has, it's worth finding out. The setup you use affects how much you can put away each year and how that money is taxed.",
        },
      ],
      focus: {
        body:
          'A lot of owners who make good money only put away what an IRA allows, or nothing at all, because the business always seems to need it more. Depending on your income and how the business is set up, a business retirement plan may let you save more and change how that money is taxed.',
        question: 'Is the business using the right retirement setup for what you earn and what you want?',
      },
      strength: "You're saving for retirement through the business, not just around it.",
    },
    {
      // Private follow-up. Only asked if they have a company 401(k). Doesn't affect the score.
      id: 'planReview',
      short: 'Conditional 401(k) Review Answer',
      showIf: { question: 'retirementPlan', answers: ['company401k', 'cashBalance'] },
      text: "When was the last time someone independently reviewed your plan's fees, investments and plan design?",
      options: [
        { key: 'lastYear', label: 'Within the last year' },
        { key: '1to3', label: '1–3 years ago' },
        { key: 'over3', label: 'More than 3 years ago' },
        { key: 'never', label: 'Never' },
        { key: 'unknown', label: "I don't know" },
      ],
    },
    {
      id: 'clarity',
      short: 'Q6 Retirement Clarity',
      category: 'Retirement clarity',
      priority: 3,
      text: "How clear are you on when work can become optional and what you'll need financially to make that happen?",
      options: [
        { key: 'knowNumber', label: 'I know approximately when and what number I need', points: 4 },
        {
          key: 'goodIdea',
          label: 'I have a pretty good idea',
          points: 3,
          strength: 'You have a good sense of when work can become optional and what it will take.',
        },
        { key: 'whenNotWhat', label: "I know when I'd like to stop, but not what I'll need", points: 1 },
        { key: 'notRun', label: "I haven't really run the numbers", points: 0 },
      ],
      focus: {
        body:
          "Without a target, there's no way to tell if what you're doing is enough, too little or more than you need. It doesn't have to be exact, but you should know roughly when work can become optional and whether you're on pace.",
        question: 'What do you actually need, by when, and are you on pace?',
      },
      strength: 'You know roughly when work can become optional and what it will take.',
    },
    {
      id: 'saleDependence',
      short: 'Q7 Sale Dependence',
      category: 'Exit / business dependence',
      priority: 1,
      text: 'How important is eventually selling the business to your long-term financial plan?',
      options: [
        { key: 'fine', label: 'I should be financially fine without selling it', points: 4 },
        {
          key: 'helps',
          label: "A sale would help, but isn't necessary",
          points: 3,
          strength: 'A sale would be a bonus, not the whole plan.',
        },
        { key: 'important', label: 'A sale is an important part of the plan', points: 2 },
        { key: 'isThePlan', label: 'Selling the business is basically my retirement plan', points: 0 },
        {
          key: 'neverThought',
          label: "I've never really thought about it",
          points: 1,
          body:
            "Most owners don't think about selling until they're close to it, and by then there are fewer ways to change the outcome. Knowing what role a sale plays, if any, shapes a lot of other decisions.",
        },
      ],
      focus: {
        body:
          "If the sale is the plan, the sale has to go right: the timing, the buyer, the price and the taxes. That's a lot riding on things you don't fully control. Knowing what you'd keep after taxes and fees, and having a backup, gives you options.",
        question: 'If a sale came in well under what you hope, or never happened, would you still be okay?',
      },
      strength: "Your financial future doesn't hinge on selling the business.",
    },

    // ---- Not scored ----
    {
      id: 'changes',
      short: 'Q8 Money In Motion',
      otherShort: 'Q8 Other Text', // what they type in "Other" gets its own column
      type: 'multi',
      text: 'Are any major financial changes likely in the next 3–5 years?',
      help: 'Pick all that apply.',
      options: [
        {
          key: 'sellBiz',
          label: 'Sell the business',
          callout:
            'You said you may sell the business in the next few years. Most of the planning that affects what you keep happens before the sale, not after it.',
        },
        {
          key: 'retire',
          label: 'Retire or significantly reduce how much I work',
          callout:
            'You said you may retire or cut back in the next few years. That window is when savings, tax and investment decisions start getting harder to undo.',
        },
        {
          key: 'realEstate',
          label: 'Sell real estate',
          callout:
            'A property sale can bring a tax bill and a pile of cash at the same time. Both are easier to handle with a plan in place first.',
        },
        {
          key: 'expand',
          label: 'Buy or expand a business',
          callout:
            'Growing the business and building wealth outside it compete for the same dollars. The split is worth deciding on purpose.',
        },
        { key: 'purchase', label: 'Major home or property purchase' },
        {
          key: 'inheritance',
          label: 'Receive an inheritance or other large sum',
          callout: 'An inheritance or other large sum is easier to handle well when there is a plan in place before it arrives.',
        },
        {
          key: 'move',
          label: 'Move to another state',
          callout:
            'A move to another state can change how your income, your business and your accounts are taxed. Some of those decisions are easier to make before the move than after.',
        },
        { key: 'nothing', label: 'Nothing major that I know of', exclusive: true },
        { key: 'other', label: 'Other', other: true, placeholder: 'What change?' },
      ],
    },
    {
      id: 'topQuestion', // keep this id: the results page quotes it back to them
      short: 'Q9 Primary Financial Question',
      otherShort: 'Q9 Other Text',
      pinned: true,
      text: 'If you could get one financial question answered right now, which would be most useful?',
      options: [
        { key: 'onTrack', label: 'Am I actually on track to make work optional?' },
        { key: 'taxes', label: 'Am I paying more in taxes than I need to?' },
        { key: 'bizCash', label: 'What should I be doing with excess business cash?' },
        { key: 'rightPlan', label: 'Am I using the right retirement plan?' },
        { key: 'investments', label: 'What should I be doing with my investments?' },
        { key: 'salePrice', label: 'How much does my business need to sell for?' },
        { key: 'wealthOutside', label: 'Am I building enough wealth outside the business?' },
        { key: 'decision', label: 'I have a major financial decision I need help thinking through' },
        { key: 'other', label: 'Something else', other: true, placeholder: "What's on your mind?" },
      ],
    },
  ],

  // Shown on the last screen before results.
  contact: {
    heading: 'Last step',
    followUpQuestion:
      "Would you like me to personally take a look at your answers and tell you the 1–2 areas I'd investigate first?",
    // value is what shows in the Sheet's "Wants follow-up" column. Only 'Yes' shows the email/phone boxes.
    followUpOptions: [
      { value: 'Yes', label: "Yes, I'd like your take" },
      { value: 'Maybe', label: 'Maybe. Show me my results first' },
      { value: 'No', label: 'No thanks, I just want the checkup' },
    ],
    reachNote:
      "Where should I send it? Add an email or phone, or leave both blank and I'll message you the same way you got this link.",
    textConsent: "It's OK to text me about my results at this number.",
    privacyNote: "I'll only use this to follow up on your checkup. No mailing list, and I don't share your info.",
    button: 'See my results',
  },

  // Score = points from Q3–Q7 out of 20, shown out of 100. The first band whose `min` the score reaches is used.
  bands: [
    {
      min: 80,
      title: 'Strong foundation',
      body:
        'You have many of the important pieces in place. The next opportunity is making sure your business, investments, retirement strategy and long-term goals are coordinated rather than operating independently.',
    },
    {
      min: 60,
      title: 'Building, with gaps',
      body:
        "You've built some strong pieces, but there may be areas where your business and personal finances aren't fully working together yet.",
    },
    {
      min: 40,
      title: 'Business-dependent',
      body:
        'Your answers suggest a meaningful part of your financial future may still depend on continued business income or the eventual value of the business.',
    },
    {
      min: 0,
      title: 'Foundation needs attention',
      body:
        "Several parts of your long-term financial strategy may not yet have a defined system. That doesn't mean you're behind. It means there may be opportunities to make the income your business creates work more intentionally for your personal future.",
    },
  ],

  results: {
    scoreLabel: 'Your score',
    strengthsHeading: "What you're doing well",
    maxStrengths: 2,
    strengthMinPoints: 3, // only areas with 3 or 4 points count as "doing well"
    focusHeading: 'Areas worth a closer look',
    maxFocusAreas: 2, // their lowest-scoring areas (anything under 4 points)
    noFocus:
      'Nothing stood out as a gap. The next step is coordination: making sure your business, investments, taxes and exit plan are all aimed at the same target.',
    timingHeading: 'Timing matters',
    // What they see at the bottom of their results, based on their answer on the last step
    ctaYes: "Thanks, {name}. I'll take a look at your answers and follow up personally, usually within a day or two.",
    ctaYesTopQuestion: 'I\'ll keep your question in mind: "{q}"',
    ctaMaybe: 'Sounds good, {name}. If you want a second set of eyes on these later, you can reach out anytime.',
    ctaNo:
      "No problem. Save or print this page and use it as a checklist. If you want a second set of eyes later, I'm easy to reach.",
    ctaNoTopQuestion: 'You picked "{q}" as the question you most want answered. That one is worth getting a real answer to.',
    signoff: 'Cam',
  },

  // REQUIRES COMPLIANCE REVIEW BEFORE PUBLICATION.
  disclaimer:
    'This checkup is for educational purposes only and is not individualized investment, tax, or legal advice. Results are based solely on the information provided and are intended to identify areas that may warrant further review.',
};
