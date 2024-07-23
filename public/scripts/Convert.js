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
  return new Promise((resolve) => {
    const dicPath = "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict";
    const originalOpen = XMLHttpRequest.prototype.open;
    let count = 0;

    XMLHttpRequest.prototype.open = function (method, url, async) {
      if (url.startsWith(dicPath.replace("https://", "https:/"))) {
        this.onreadystatechange = () => {
          if (this.readyState === 4 && this.status === 200) {
            document.querySelector(
              ".loading-status"
            ).textContent = `Building dictionary (${++count + 1}/12)`;
          }
        };

        originalOpen.call(
          this,
          method,
          url.replace("https:/", "https://"),
          async
        );
      } else {
        originalOpen.call(this, method, url, async);
      }
    };

    kuromoji.builder({ dicPath }).build((error, tokenizer) => {
      if (error) {
        document.querySelector(
          ".loading-status"
        ).textContent = `Build failed: ${error}`;

        resolve(false);
      } else {
        analyzer = tokenizer;

        resolve(true);
      }

      XMLHttpRequest.prototype.open = originalOpen;
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
  let language;

  if (JAPANESE.test(raw)) {
    language = "ja";
  } else if (CHINESE.test(raw)) {
    language = "zh";
  } else if (KOREAN.test(raw)) {
    language = "ko";
  }

  if (!language)
    return showMessage("Không thể phát hiện ngôn ngữ", null, "error");
  showMessage(`Ngôn ngữ gốc: ${lang[language]}`);

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
          p.textContent = kuroshiroConverter(
            await analyzer.tokenize(element.textContent)
          );
          break;
        case "zh":
          p.textContent = pinyinPro.pinyin(element.textContent, {
            seperator: "-",
          });
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
