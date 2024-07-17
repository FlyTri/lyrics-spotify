import QQMusicManager from "./QQMusic.mjs";
import MusixmatchManager from "./Musixmatch.mjs";
import ZingMP3 from "./ZingMP3.mjs";

export default class SourceManager {
  constructor() {
    const qq = new QQMusicManager();
    const musixmatch = new MusixmatchManager();
    const zingmp3 = new ZingMP3();

    this.sources = { qq, musixmatch, zingmp3 };
  }
}
