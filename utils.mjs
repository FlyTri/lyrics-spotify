import { isJapanese, toRomaji, tokenize } from "wanakana";
import { pinyin } from "pinyin-pro";
import aromanize from "aromanize";

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
  if (!text) return "";

  const characters = [
    ["（", "("],
    ["）", ")"],
    ["【", "["],
    ["】", "]"],
    ["。", ". "],
    ["；", "; "],
    ["：", ": "],
    ["？", "? "],
    ["！", "! "],
    ["、", ", "],
    ["，", ", "],
    ["‘", "'"],
    ["”", '"'],
    ["＇", "'"],
    ["〜", "~"],
    ["·", "•"],
    ["・", "•"],
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
  ];

  characters.forEach(([from, to]) => {
    text = text.replaceAll(from, to);
  });

  const words = tokenize(text);
  const Chinese = /\p{Script=Han}/u;
  const Korean = /\p{Script=Hangul}/u;

  return words
    .map((word) => {
      if (Chinese.test(word)) return pinyin(word);
      if (Korean.test(word)) return aromanize.romanize(word);
      if (isJapanese(word)) return toRomaji(word);

      return word;
    })
    .join("");
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
