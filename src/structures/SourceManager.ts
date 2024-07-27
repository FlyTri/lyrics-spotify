import QQMusicManager from "./QQMusic";
import MusixmatchManager from "./Musixmatch";
import ZingMP3 from "./ZingMP3";

const qq = new QQMusicManager();
const musixmatch = new MusixmatchManager();
const zingmp3 = new ZingMP3();

export const sources = { qq, musixmatch, zingmp3 };
