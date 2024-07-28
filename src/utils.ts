export const NO_RESULT = { type: "NO_RESULT" } as const;

export const INSTRUMENTAL = { type: "INSTRUMENTAL" } as const;

export const DJ = { type: "DJ" } as const;

export function formatText(text: string): string {
  const characters = [
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

export function formatTime(time: string): number {
  const [m, s] = time.split(":").map(Number);

  return (m * 60 + s) * 1000;
}

export function omitUndefined(obj: TextSynced): TextSynced {
  return JSON.parse(JSON.stringify(obj));
}

export function trim(string: string) {
  return string.replace(/ {2,}/g, " ").trim();
}
