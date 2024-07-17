import { formatText, formatTime, omitUndefined, trim } from "../utils.mjs";

const METADATA = /^\[(.+?):(.*?)\]$/;

const LRC_LYRIC = /^((?:\[\d{2,}:\d{2}(?:\.\d{2,3})?\])+)(.*)$/;

const QRC_LYRIC = /^\[(\d+),(\d+)\](.*)$/;
const QRC_WORDS = /(.*?)\((\d*),(\d*)\)/g;

export default class Parser {
  /**
   * @param {string} string
   */
  lrc(string) {
    const lines = string.split(/\r?\n/);
    const data = { metadata: [], lyrics: [] };

    lines.forEach((line) => {
      const metadata = METADATA.exec(line);

      if (metadata)
        return data.metadata.push({ key: metadata[0], value: metadata[1] });

      const lyric = LRC_LYRIC.exec(line);

      if (lyric) {
        const times = lyric[1].slice(1, -1).split("][");
        const text = formatText(trim(lyric[2]));

        times.forEach((time) =>
          data.lyrics.push({ text, time: formatTime(time) })
        );
      }
    });

    if (data.lyrics[0].time) data.lyrics.unshift({ time: 0, wait: true });

    return data;
  }
  qrc(string) {
    const lines = trim(string).split(/\r?\n/);
    const data = { metadata: [], lyrics: [] };
    let first = true;
    let checkHeader = true;

    lines.forEach((line) => {
      const metadata = METADATA.exec(line);

      if (metadata)
        return data.metadata.push({ key: metadata[1], value: metadata[2] });

      const lyric = QRC_LYRIC.exec(line);

      if (lyric) {
        const [, start, duration, content] = lyric;

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

          if (i === 0 && before && ws - before.lineEnd >= 3000)
            data.lyrics.push({
              time: before.lineEnd,
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

    if (data.lyrics[0].time) data.lyrics.unshift({ time: 0, wait: true });

    return data;
  }
}
