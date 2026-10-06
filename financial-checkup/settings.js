/*
  SETTINGS — shared by every checkup on the site.
  This is one of the only two files you should normally need to edit
  (the other is the checkup's own config.js, e.g. pool-owner/config.js).
*/
window.SETTINGS = {
  // Paste your Google Apps Script "Web app" URL between the quotes (README, Step 2).
  // While this is blank, the checkup still works, it just doesn't save anything.
  endpoint: 'https://script.google.com/macros/s/AKfycbzq-Wwwwp-LU4BGHAe6oGQooPDGifGfhg5ZhV-FTkGaYi6TTB6Y_gYyuXcfjfprAYBspw/exec',

  // Shown on the results page for people who aren't ready for follow-up yet.
  // Leave phone or email blank ('') to hide it.
  advisor: {
    name: 'Camden Hardy',
    shortName: 'Cam',
    phone: '602-299-6691',
    email: 'camden.hardy@lpl.com',
  },

  // Paste your firm-required disclosure text here (shown at the bottom of every page).
  firmDisclosure: '',
};
