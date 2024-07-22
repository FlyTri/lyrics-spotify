const CHINESE = /\p{Script=Han}/u;
const JAPANESE = /\p{Script=Hiragana}|\p{Script=Katakana}/u;
const KOREAN = /\p{Script=Hangul}/u;
const CHECK =
  /(\p{Script=Hangul}|\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana})/u;
const IGNORE =
  /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?° àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳỵỷỹýÀÁÃẠẢĂẮẰẲẴẶÂẤẦẨẪẬÈÉẸẺẼÊỀẾỂỄỆĐÌÍĨỈỊÒÓÕỌỎÔỐỒỔỖỘƠỚỜỞỠỢÙÚŨỤỦƯỨỪỬỮỰỲỴỶỸÝ]*$/;

const lang = { ja: "Tiếng Nhật", ko: "Tiếng Hàn", zh: "Tiếng Trung" };

let analyzer;

async function initKuromoji() {
  return new Promise((resolve, reject) => {
    const dicPath = "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict";
    const originalOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function (method, url, async) {
      if (url.startsWith(dicPath)) {
        url = url.replace("https:/", "https://");
      }
      originalOpen.call(this, method, url, async);
    };

    kuromoji.builder({ dicPath }).build((error, tokenizer) => {
      if (error) {
        console.error(error);
        $(".loading-status").textContent = `Build failed: ${error}`;
        return reject(error);
      }

      analyzer = tokenizer;
      XMLHttpRequest.prototype.open = originalOpen;
      resolve(true);
    });
  });
}

async function convert() {
  const enable = localStorage.getItem("convert") === "1";

  if (!enable) {
    $All(".roma").forEach((element) => element.remove());
    return;
  }

  const raw = lyrics.data.map((obj) => obj.text).join("");
  const language = JAPANESE.test(raw)
    ? "ja"
    : CHINESE.test(raw)
    ? "zh"
    : KOREAN.test(raw)
    ? "ko"
    : null;

  if (language) {
    showMessage(`Ngôn ngữ gốc: ${lang[language]}`);
  }

  await Promise.all(
    [...$All(".lyrics")].map(async (element) => {
      if (!element.textContent || IGNORE.test(element.textContent)) return;

      const p = document.createElement("p");
      p.classList.add("roma");

      switch (language) {
        case "ko":
          p.textContent = HangulConverter(element.textContent);
          break;
        case "ja":
          const tokens = await analyzer.tokenize(element.textContent);

          p.textContent = kuroshiroConverter(tokens);
          break;
        case "zh":
          p.textContent = pinyinPro.pinyin(element.textContent);
          break;
      }

      element.append(p);
    })
  );

  scrollToCenter($(".highlight"), false);
}

function needConvert() {
  return CHECK.test(
    JSON.stringify(lyrics.data.map((obj) => obj.text).join(""))
  );
}
