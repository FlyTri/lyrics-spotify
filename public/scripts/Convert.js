const kuroshiro = new Kuroshiro.default();
const CHINESE = /\p{Script=Han}/u;
const JAPANESE = /\p{Script=Hiragana}|\p{Script=Katakana}/u;
const KOREAN = /\p{Script=Hangul}/u;
const CHECK =
  /\p{Script=Hangul}|\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}/u;
const IGNORE =
  /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?° àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳỵỷỹýÀÁÃẠẢĂẮẰẲẴẶÂẤẦẨẪẬÈÉẸẺẼÊỀẾỂỄỆĐÌÍĨỈỊÒÓÕỌỎÔỐỒỔỖỘƠỚỜỞỠỢÙÚŨỤỦƯỨỪỬỮỰỲỴỶỸÝ]*$/;

const lang = { ja: "Tiếng Nhật", ko: "Tiếng Hàn", zh: "Tiếng Trung" };
const kromanData = {
  ga: 0xac00,
  hih: 0xd7a3,
  headi: 588,
  bodyi: 28,
  taili: 1,
  headj: [
    "g",
    "gg",
    "n",
    "d",
    "dd",
    "r",
    "m",
    "b",
    "bb",
    "s",
    "ss",
    "",
    "j",
    "jj",
    "c",
    "k",
    "t",
    "p",
    "h",
  ],
  bodyj: [
    "a",
    "ae",
    "ya",
    "yae",
    "eo",
    "e",
    "yeo",
    "ye",
    "o",
    "wa",
    "wae",
    "oe",
    "yo",
    "u",
    "weo",
    "we",
    "wi",
    "yu",
    "eu",
    "eui",
    "i",
  ],
  tailj: [
    "",
    "g",
    "gg",
    "gs",
    "n",
    "nj",
    "nh",
    "d",
    "r",
    "rk",
    "rm",
    "rb",
    "rs",
    "rt",
    "rp",
    "rh",
    "m",
    "b",
    "bs",
    "s",
    "ss",
    "ng",
    "j",
    "c",
    "k",
    "t",
    "p",
    "h",
  ],
};

async function initKuroshiro() {
  await kuroshiro.init(
    new KuromojiAnalyzer({
      dictPath: "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/",
    })
  );
}

function HangulConverter(text) {
  if (!KOREAN.test(text)) return text;

  return text.split("").reduce((romanized, char) => {
    const charCode = char.charCodeAt(0);

    if (charCode >= kromanData.ga && charCode <= kromanData.hih) {
      const head = Math.floor((charCode - kromanData.ga) / kromanData.headi);
      const headl = Math.floor((charCode - kromanData.ga) % kromanData.headi);
      const body = Math.floor(headl / kromanData.bodyi);
      const tail = Math.floor(headl % kromanData.bodyi);

      return (
        romanized +
        " " +
        kromanData.headj[head] +
        kromanData.bodyj[body] +
        kromanData.tailj[tail]
      );
    }
    return romanized + char;
  }, "");
}

async function convert() {
  const enable = localStorage.getItem("convert") === "1";

  if (!enable) $All(".roma").forEach((element) => element.remove());
  else {
    const raw = lyrics.data.map((obj) => obj.text).join("");
    let language;

    if (JAPANESE.test(raw)) language = "ja";
    else if (CHINESE.test(raw)) language = "zh";
    else if (KOREAN.test(raw)) language = "ko";

    showMessage(`Ngôn ngữ gốc: ${lang[language]}`);

    await Promise.all(
      [...$All(".lyrics")].map(async (element) => {
        if (!element.textContent || IGNORE.test(element.textContent)) return;

        const p = document.createElement("p");

        p.classList.add("roma");

        switch (language) {
          case "ko": {
            p.textContent = HangulConverter(element.textContent);
            break;
          }
          case "ja": {
            p.textContent = await kuroshiro.convert(element.textContent, {
              to: "romaji",
              mode: "spaced",
            });
            break;
          }
          case "zh": {
            p.textContent = pinyinPro.pinyin(element.textContent);
            break;
          }
        }
        element.append(p);
      })
    );
  }

  scrollToCenter($(".highlight"), false);
}

function needConvert(object) {
  return CHECK.test(JSON.stringify(object));
}
