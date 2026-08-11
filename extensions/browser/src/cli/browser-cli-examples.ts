/**
 * Help examples shown by the Browser CLI root command.
 */
/** Core Browser CLI examples for lifecycle and inspection commands. */
export const browserCoreExamples = [
  "natesclaw browser status",
  "natesclaw browser start",
  "natesclaw browser start --headless",
  "natesclaw browser stop",
  "natesclaw browser tabs",
  "natesclaw browser open https://example.com",
  "natesclaw browser focus abcd1234",
  "natesclaw browser close abcd1234",
  "natesclaw browser screenshot",
  "natesclaw browser screenshot --full-page",
  "natesclaw browser screenshot --ref 12",
  "natesclaw browser snapshot",
  "natesclaw browser snapshot --format aria --limit 200",
  "natesclaw browser snapshot --efficient",
  "natesclaw browser snapshot --labels",
];

/** Browser CLI examples for interaction/action commands. */
export const browserActionExamples = [
  "natesclaw browser navigate https://example.com",
  "natesclaw browser resize 1280 720",
  "natesclaw browser click 12 --double",
  "natesclaw browser click-coords 120 340",
  'natesclaw browser type 23 "hello" --submit',
  "natesclaw browser press Enter",
  "natesclaw browser hover 44",
  "natesclaw browser drag 10 11",
  "natesclaw browser select 9 OptionA OptionB",
  "natesclaw browser upload /tmp/natesclaw/uploads/file.pdf",
  "natesclaw browser upload media://inbound/file.pdf",
  'natesclaw browser fill --fields \'[{"ref":"1","value":"Ada"}]\'',
  "natesclaw browser dialog --accept",
  'natesclaw browser wait --text "Done"',
  "natesclaw browser evaluate --fn '(el) => el.textContent' --ref 7",
  "natesclaw browser evaluate --fn 'const title = document.title; return title;'",
  "natesclaw browser console --level error",
  "natesclaw browser pdf",
  "natesclaw browser batch --actions-file plan.json",
  'natesclaw browser batch --actions \'[{"kind":"wait","timeMs":500},{"kind":"click","ref":"12"},{"kind":"type","ref":"23","text":"hello"}]\'',
  "natesclaw browser batch --actions-file plan.json --continue",
];
