import _ from "lodash";
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
 *
 * @param {string} text
 * @returns {string}
 */
export function formatText(text) {
  if (!text) return "";
  if (/^\s+$/.test(text)) return " ";

  text = replaceSpecialCharacters(text);

  const words = tokenize(text);
  const Chinese = /\p{Script=Han}/u;
  const Korean = /\p{Script=Hangul}/u;

  return _.chain(words)
    .map((word) => {
      if (isJapanese(word)) word = toRomaji(word);
      if (Chinese.test(word)) word = pinyin(word);
      if (Korean.test(word)) word = aromanize.romanize(word);
      return word;
    })
    .join("")
    .value();
}

export function replaceSpecialCharacters(text) {
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

  _.each(characters, ([from, to]) => {
    text = text.replaceAll(from, to);
  });

  return text;
}
