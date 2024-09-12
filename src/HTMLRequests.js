const cheerio = require("cheerio");
const axios = require("axios");
const UserAgent = require("user-agents");

const SearchModifiers = {
  NONE: "",
  // ISOLATE_DLC shows only DLC in the search result
  ISOLATE_DLC: "only_dlc",
  // HIDE_DLC hide DLCs in the search result
  HIDE_DLC: "hide_dlc",
};

class HTMLRequests {
  static BASE_URL = "https://howlongtobeat.com/";
  static REFERER_HEADER = HTMLRequests.BASE_URL;
  static SEARCH_URL = HTMLRequests.BASE_URL + "api/search";
  static GAME_URL = HTMLRequests.BASE_URL + "game";

  static getSearchRequestHeaders() {
    const ua = new UserAgent();
    return {
      "content-type": "application/json",
      accept: "*/*",
      "User-Agent": ua.toString().trim(),
      referer: HTMLRequests.REFERER_HEADER,
    };
  }

  static getSearchRequestData(gameName, searchModifiers, page) {
    return JSON.stringify({
      searchType: "games",
      searchTerms: gameName.split(" "),
      searchPage: page,
      size: 20,
      searchOptions: {
        games: {
          userId: 0,
          platform: "",
          sortCategory: "popular",
          rangeCategory: "main",
          rangeTime: {
            min: 0,
            max: 0,
          },
          gameplay: {
            perspective: "",
            flow: "",
            genre: "",
          },
          modifier: searchModifiers,
        },
        users: {
          sortCategory: "postcount",
        },
        filter: "",
        sort: 0,
        randomizer: 0,
      },
    });
  }

  static async sendWebRequest(
    gameName,
    searchModifiers = SearchModifiers.NONE,
    page = 1
  ) {
    const headers = HTMLRequests.getSearchRequestHeaders();
    const payload = HTMLRequests.getSearchRequestData(
      gameName,
      searchModifiers,
      page
    );
    let apiKeyResult = await HTMLRequests.sendWebsiteRequestGetCode(false);
    if (apiKeyResult === null) {
      apiKeyResult = await HTMLRequests.sendWebsiteRequestGetCode(true);
    }
    const searchUrlWithKey = HTMLRequests.SEARCH_URL + "/" + apiKeyResult;
    try {
      const response = await axios.post(searchUrlWithKey, payload, { headers });
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.error("Error in sendWebRequest:", error);
    }
    return null;
  }

  static cutGameTitle(gameTitle) {
    if (!gameTitle || gameTitle.length === 0) {
      return null;
    }
    const titleMatch = gameTitle.match(/<title>(.*)<\/title>/);
    if (titleMatch) {
      return titleMatch[1].slice(12, -17);
    }
    return null;
  }

  static getTitleRequestParameters(gameId) {
    return {
      id: gameId.toString(),
    };
  }

  static getTitleRequestHeaders() {
    const ua = new UserAgent();
    return {
      "User-Agent": ua.toString(),
      referer: HTMLRequests.REFERER_HEADER,
    };
  }

  static async getGameTitle(gameId) {
    const params = HTMLRequests.getTitleRequestParameters(gameId);
    const headers = HTMLRequests.getTitleRequestHeaders();
    try {
      const response = await axios.get(HTMLRequests.GAME_URL, {
        params,
        headers,
      });
      return HTMLRequests.cutGameTitle(response.data);
    } catch (error) {
      console.error("Error in getGameTitle:", error);
      return null;
    }
  }

  static async sendWebsiteRequestGetCode(parseAllScripts) {
    const headers = HTMLRequests.getTitleRequestHeaders();
    try {
      const response = await axios.get(HTMLRequests.BASE_URL, { headers });
      if (response.status === 200 && response.data) {
        const $ = cheerio.load(response.data);
        const scripts = $("script[src]")
          .map((i, el) => $(el).attr("src"))
          .get();
        const matchingScripts = parseAllScripts
          ? scripts
          : scripts.filter((src) => src.includes("_app-"));
        for (const scriptUrl of matchingScripts) {
          const fullScriptUrl = HTMLRequests.BASE_URL + scriptUrl;
          const scriptResponse = await axios.get(fullScriptUrl, { headers });
          if (scriptResponse.status === 200 && scriptResponse.data) {
            const pattern = /\/api\/search\/".concat\("([a-zA-Z0-9]+)"\)/;
            const match = scriptResponse.data.match(pattern);
            if (match) {
              return match[1];
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in sendWebsiteRequestGetCode:", error);
    }
    return null;
  }
}

module.exports = { HTMLRequests, SearchModifiers };