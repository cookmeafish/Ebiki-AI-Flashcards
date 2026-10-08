// Em/en dashes out of AI text (the app's no-dash rule). Numeric ranges keep a plain hyphen ("10–12" → "10-12");
// a dash that starts or ends a line is dropped; one inside a line becomes ", ". Moved verbatim out of App.jsx.
export const stripAiDashes = (s) => typeof s === 'string'
  ? s.replace(/(\d)[ \t]*[—–][ \t]*(\d)/g, '$1-$2')
    .replace(/(^|\n|\\n)[ \t]*[—–][ \t]*/g, '$1')
    .replace(/[ \t]*[—–][ \t]*(?=\n|\\n|$)/g, '')
    .replace(/[ \t]*[—–][ \t]*/g, ', ')
  : s
