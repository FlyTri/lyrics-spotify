export const NO_RESULT = {
  type: "NO_RESULT",
};

export const INSTRUMENTAL = {
  type: "INSTRUMENTAL",
};

export const DJ = {
  type: "DJ",
};

/**
 *@param {string} text
 @returns {string}
 */
export function formatText(text) {
  [
    ["（", "("],
    ["）", ")"],
    ["【", "["],
    ["】", "]"],
    ["。", "."],
    ["；", ";"],
    ["：", ":"],
    ["？", "?"],
    ["！", "!"],
    ["、", ","],
    ["，", ","],
    ["‘", "'"],
    ["”", '"'],
    ["＇", "'"],
    ["〜", "~"],
    ["·", "•"],
    ["・", "•"],
    ["「", '"'],
    ["」", '"'],
    ["０", "0"],
    ["１", "1"],
    ["２", "2"],
    ["３", "3"],
    ["４", "4"],
    ["５", "5"],
    ["６", "6"],
    ["７", "7"],
    ["８", "8"],
    ["９", "9"],
    ["＃", "#"],
    ["＄", "$"],
    ["％", "%"],
    ["＆", "&"],
    ["’", "'"],
    ["＝", "="],
    ["～", "~"],
    ["｜", "|"],
    ["＠", "@"],
    ["‘", "`"],
    ["＋", "+"],
    ["＊", "*"],
    ["＜", "<"],
    ["＞", ">"],
    ["／", "/"],
    ["＿", "_"],
    ["・", "･"],
    ["｛", "{"],
    ["｝", "}"],
    ["￥", "\\"],
    ["＾", "^"],
  ];

  characters.forEach(([from, to]) => {
    text = text.replaceAll(from, to);
  });

  return text;
}

export function formatTime(time) {
  const [m, s] = time.split(":").map(Number);

  return (m * 60 + s) * 1000;
}

export function omitUndefined(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * @param {string} string
 * @returns {string}
 */
export function trim(string) {
  return string.replace(/ {2,}/g, " ").trim();
}
