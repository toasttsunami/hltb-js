const cheerio = require("cheerio");
const axios = require("axios");
const UserAgent = require("user-agents");

const SearchModifiers = {
  NONE: "",
  ISOLATE_DLC: "only_dlc",
  ISOLATE_MODS: "only_mods",
  ISOLATE_HACKS: "only_hacks",
  HIDE_DLC: "hide_dlc",
};

class HTMLRequests {
  static BASE_URL = "https://howlongtobeat.com/";
  static REFERER_HEADER = HTMLRequests.BASE_URL;
  static SEARCH_URL = HTMLRequests.BASE_URL + "api/search/";
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

  static getSearchRequestData(gameName, searchModifiers, page, searchInfo) {
    const payload = {
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
            difficulty: "",
          },
          rangeYear: {
            min: "",
            max: "",
          },
          modifier: searchModifiers,
        },
        users: {
          sortCategory: "postcount",
        },
        lists: {
          sortCategory: "follows",
        },
        filter: "",
        sort: 0,
        randomizer: 0,
      },
      useCache: true,
    };

    // If api_key is passed add it to the dict
    if (searchInfo?.apiKey) {
      payload.searchOptions.users.id = searchInfo.apiKey;
    }

    return JSON.stringify(payload);
  }

  static async sendWebRequest(
    gameName,
    searchModifiers = SearchModifiers.NONE,
    page = 1
  ) {
    const headers = HTMLRequests.getSearchRequestHeaders();
    let searchInfoData = await HTMLRequests.sendWebsiteRequestGetCode();

    const apiKey = searchInfoData?.apiKey;
    if (!apiKey) {
      console.error("Failed to retrieve auth token from init endpoint");
      return null;
    }

    headers["x-auth-token"] = apiKey;

    const payload = HTMLRequests.getSearchRequestData(
      gameName,
      searchModifiers,
      page,
      null
    );

    try {
      const response = await axios.post(HTMLRequests.SEARCH_URL, payload, {
        headers,
        timeout: 60000,
      });
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      console.error("Error in sendWebRequest:", error);
    }
    return null;
  }

  static cutGameTitle(pageSource) {
    if (!pageSource || pageSource.length === 0) {
      return null;
    }

    const $ = cheerio.load(pageSource);
    const titleTag = $("title");
    const titleText = titleTag.text();

    // The position of start and end of this method may change if the website change
    return titleText.slice(12, -17).trim();
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
        timeout: 60000,
      });
      return HTMLRequests.cutGameTitle(response.data);
    } catch (error) {
      console.error("Error in getGameTitle:", error);
      return null;
    }
  }

  static async sendWebsiteRequestGetCode() {
    const headers = HTMLRequests.getTitleRequestHeaders();
    try {
      // Fetch auth token from init endpoint
      const initUrl = `${HTMLRequests.SEARCH_URL}init?t=${Date.now()}`;
      const response = await axios.get(initUrl, {
        headers,
        timeout: 60000,
      });

      if (response && response.status === 200 && response.data && response.data.token) {
        return {
          apiKey: response.data.token,
        };
      }
    } catch (error) {
      console.error("Error in sendWebsiteRequestGetCode:", error);
    }
    return null;
  }
}

module.exports = { HTMLRequests, SearchModifiers };
