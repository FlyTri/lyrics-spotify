import axios from "axios";

export default class Spotify {
  /**
   *
   * @param {string} SP_DC
   */
  constructor(SP_DC) {
    this.colorURL = "https://api-partner.spotify.com/pathfinder/v1/query";
    this.accessTokenURL = "https://open.spotify.com/get_access_token";

    this.SP_DC = SP_DC;
    this.accessToken = null;
    this.accessTokenExpirationTimestampMs = null;

    this.getNewAccessToken();
  }
  /**
   *
   * @returns {Promise<boolean>}
   */
  async getNewAccessToken() {
    return axios
      .get(this.accessTokenURL, {
        params: {
          reason: "transport",
          productType: "web_player",
        },
        headers: {
          "App-Platform": "WebPlayer",
          "Content-Type": "text/html; charset=utf-8",
          cookie: "sp_dc=" + this.SP_DC,
        },
      })
      .then((response) => {
        const { accessToken, accessTokenExpirationTimestampMs } = response.data;

        if (accessToken.isAnonymous) {
          console.log("Invalid SP_DC cookie was provided");
          return false;
        }

        console.log("Successfully refreshed Spotify token");
        this.accessToken = accessToken;
        this.accessTokenExpirationTimestampMs =
          accessTokenExpirationTimestampMs;

        return true;
      })
      .catch(() => false);
  }
  /**
   *
   * @param {string} id
   * @returns {Promise<null | {text: string, background: string}>}
   */
  async getColors(id) {
    if (!this.accessToken) return;
    if (this.accessTokenExpirationTimestampMs < Date.now())
      await this.getNewAccessToken().then((success) => {
        if (!success) {
          this.accessToken = null;
          this.accessTokenExpirationTimestampMs = null;
        }
      });
    if (!this.accessToken) return null;

    return axios
      .get(this.colorURL.replace("id", id), {
        params: {
          operationName: "fetchExtractedColors",
          variables: `{"uris":["spotify:image:${id}"]}`,
          extensions:
            '{"persistedQuery":{"version":1,"sha256Hash":"86bdf61bb598ee07dc85d6c3456d9c88eb94f33178509ddc9b33fc9710aa9e9c"}}',
        },
        headers: {
          "App-Platform": "WebPlayer",
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
      .then((response) => {
        const { extractedColors } = response.data.data;
        const { colorLight, colorDark } = extractedColors[0];
        const readableLight = this.isReadable(colorLight.hex);
        const readableDark = this.isReadable(colorLight.hex);

        let background = readableLight ? colorLight : colorDark;
        if (readableDark && readableLight) background = colorLight;
        if (!readableDark && !readableLight)
          return { message: "Không có màu nào phù hợp" };

        return {
          background: background.hex,
          text: "#000",
          translated: this.convertIntToRGB(
            Number.parseInt(background.hex.replace("#", ""), 16),
            4
          ),
        };
      })
      .catch(() => "Không thể tìm màu của bài hát");
  }
  /**
   *
   * @param {number} int
   * @returns
   */
  convertIntToRGB(colorInt, div = 1) {
    const { r, g, b } = {
      r: Math.round(((colorInt >> 16) & 0xff) / div),
      g: Math.round(((colorInt >> 8) & 0xff) / div),
      b: Math.round((colorInt & 0xff) / div),
    };
    return `rgb(${r}, ${g}, ${b})`;
  }
  /**
   *
   * @param {string} hex
   * @returns
   */
  convertHexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  /**
   *
   * @param {number} r
   * @param {number} g
   * @param {number} b
   * @returns {number}
   */
  getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
  /**
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  getContrastRatio(a, b) {
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
  /**
   *
   * @param {string} background
   * @returns {boolean}
   */
  isReadable(background) {
    const { r, g, b } = this.convertHexToRGB(background);
    const luminanceBackground = this.getLuminance(r, g, b);
    const luminanceBlack = 0;
    const luminanceWhite = 1;

    return (
      this.getContrastRatio(luminanceBackground, luminanceBlack) >= 4.5 &&
      this.getContrastRatio(luminanceBackground, luminanceWhite) >= 4.5
    );
  }
}
