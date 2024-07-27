import { formatText, formatTime, omitUndefined, trim } from "../utils";

const METADATA = /^\[(.+?):(.*?)\]$/;

const LRC_LYRIC = /^((?:\[\d{2,}:\d{2}(?:\.\d{2,3})?\])+)(.*)$/;

const QRC_LYRIC = /^\[(\d+),(\d+)\](.*)$/;
const QRC_WORDS = /(.*?)\((\d*),(\d*)\)/g;

export function lrc(string: string) {
  const lines = trim(string).split(/\r?\n/);
  const data: LRC = { type: "LINE_SYNCED", metadata: [], lyrics: [] };

  lines.forEach((line) => {
    const metadata = METADATA.exec(line);

    if (metadata)
      return data.metadata.push({ key: metadata[0], value: metadata[1] });

    const lyric = LRC_LYRIC.exec(line);

    if (lyric) {
      const times = lyric[1].slice(1, -1).split("][");
      const text = formatText(lyric[2]).trim();

      times.forEach((time) =>
        data.lyrics.push({ text, time: formatTime(time) })
      );
    }
  });

  const last = data.lyrics[data.lyrics.length - 1];

  if (data.lyrics[0].time) data.lyrics.unshift({ time: 0, wait: true });
  if ("text" in last && !last.text) data.lyrics.pop();

  return data;
}

export function qrc(string: string) {
  const lines = trim(string).split(/\r?\n/);
  const data: QRC = { type: "TEXT_SYNCED", metadata: [], lyrics: [] };
  let first = true;
  let checkHeader = true;

  lines.forEach((line) => {
    const metadata = METADATA.exec(line);

    if (metadata)
      return data.metadata.push({ key: metadata[1], value: metadata[2] });

    const lyric = QRC_LYRIC.exec(line);

    if (lyric) {
      const [, start, duration, content] = lyric;

      if (!content) return;
      if (checkHeader) {
        if (first) {
          first = false;

          return;
        }
        if (content.includes(":") || content.includes("：")) return;

        checkHeader = false;
      }

      const words = [...content.matchAll(QRC_WORDS)];

      words.forEach(([, text, ws], i) => {
        if (!text) return;

        const space = words[i + 1]?.[1] === " " ? " " : "";
        const before = data.lyrics.findLast((obj) => obj.new);

        if (
          i === 0 &&
          before &&
          "lineEnd" in before &&
          +ws - before.lineEnd! >= 3000
        )
          data.lyrics.push({
            time: before.lineEnd!,
            wait: true,
            new: true,
          });

        data.lyrics.push(
          omitUndefined({
            text: formatText(text) + space,
            time: +ws,
            new: i === 0 || undefined,
            lineEnd: i === 0 ? +start + +duration : undefined,
          })
        );
      });
    }
  });

  const last = data.lyrics[data.lyrics.length - 1];

  if (data.lyrics[0].time) data.lyrics.unshift({ time: 0, wait: true });
  if ("text" in last && !last.text) data.lyrics.pop();

  return data;
}

export function plain(string: string) {
  const splitted = string.split(/\r?\n/);
  const parsed = splitted.map((text) => ({
    text: formatText(text) || "",
  }));

  if (!parsed[parsed.length - 1].text) parsed.pop();

  return { type: "NOT_SYNCED", metadata: [], lyrics: parsed } as Plain;
}
