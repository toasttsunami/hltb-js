const cheerio = require("cheerio");
const axios = require("axios");
const UserAgent = require("user-agents");
const fs = require("fs");

class SearchInformations {
  constructor(scriptContent) {
    this.apiKey = this.extractApiFromScript(scriptContent);
    this.searchUrl = this.extractSearchUrlScript(scriptContent);
    if (HTMLRequests.BASE_URL.endsWith("/") && this.searchUrl) {
      this.searchUrl = this.searchUrl.replace(/^\//, "");
    }
  }

  extractApiFromScript(scriptContent) {
    const userIdApiKeyPattern = /users\s*:\s*{\s*id\s*:\s*"([^"]+)"/;
    let matches = scriptContent.match(userIdApiKeyPattern);
    if (matches) {
      return matches[1];
    }
    const apiRegex = /"\/api\/\w+\/"(?:\.concat\("([^"]+)"\))+/g;
    const apiMatch = scriptContent.match(apiRegex);

    if (apiMatch) {
      const concatRegex = /\.concat\("([^"]+)"\)/g;
      const values = [...scriptContent.matchAll(concatRegex)].map(
        (match) => match[1]
      );
      console.log(values.join(""));

      return values.join("");
    }

    return null;
  }

  extractSearchUrlScript(scriptContent) {
    const pattern =
      /fetch\(\s*["'](\/api\/[^"']*)["']((?:\s*\.concat\(\s*["']([^"']*)["']\s*\))*)\s*,/g;
    let matches = [...scriptContent.matchAll(pattern)];

    for (let match of matches) {
      const endpoint = match[1];
      const concatCalls = match[2];
      const concatStrings = [
        ...concatCalls.matchAll(/\.concat\(\s*["']([^"']*)["']\s*\)/g),
      ].map((m) => m[1]);
      const concatenatedStr = concatStrings.join("");

      if (concatenatedStr === this.apiKey) {
        return endpoint;
      }
    }

    return null;
  }
}

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
  static SEARCH_URL = HTMLRequests.BASE_URL + "api/s/";
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
    let searchInfoData = await HTMLRequests.sendWebsiteRequestGetCode(false);
    if (!searchInfoData?.apiKey) {
      searchInfoData = await HTMLRequests.sendWebsiteRequestGetCode(true);
    }

    if (searchInfoData?.searchUrl) {
      HTMLRequests.SEARCH_URL =
        HTMLRequests.BASE_URL + searchInfoData.searchUrl;
    }

    const searchUrlWithKey = HTMLRequests.SEARCH_URL + searchInfoData.apiKey;
    const payload = HTMLRequests.getSearchRequestData(
      gameName,
      searchModifiers,
      page,
      null
    );
    console.log(searchUrlWithKey);

    try {
      const response = await axios.post(searchUrlWithKey, payload, {
        headers,
        timeout: 60000,
      });
      if (response.status === 200) {
        return response.data;
      }
    } catch (error) {
      // Try to call with the standard url adding the api key to the user
      try {
        const payloadWithUser = HTMLRequests.getSearchRequestData(
          gameName,
          searchModifiers,
          page,
          searchInfoData
        );
        const response = await axios.post(
          HTMLRequests.SEARCH_URL,
          payloadWithUser,
          {
            headers,
            timeout: 60000,
          }
        );
        if (response.status === 200) {
          return response.data;
        }
      } catch (error) {
        console.error("Error in sendWebRequest:", error);
      }
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

  static async sendWebsiteRequestGetCode(parseAllScripts) {
    const headers = HTMLRequests.getTitleRequestHeaders();
    try {
      const response = await axios.get(HTMLRequests.BASE_URL, {
        headers,
        timeout: 60000,
      });

      if (response.status === 200 && response.data) {
        const $ = cheerio.load(response.data);
        const scripts = $("script[src]")
          .map((_, el) => $(el).attr("src"))
          .get();
        const matchingScripts = parseAllScripts
          ? scripts
          : scripts.filter((src) => src.includes("_app-"));
        for (const scriptUrl of matchingScripts) {
          const fullScriptUrl = new URL(scriptUrl, HTMLRequests.BASE_URL).href;
          const scriptResponse = await axios.get(fullScriptUrl, {
            headers,
            timeout: 60000,
          });
          // const data = JSON.stringify(scriptResponse, null, 2);
          // Write to a text file
          fs.appendFileSync("output.txt", scriptResponse.data, "utf8");

          if (scriptResponse.status === 200 && scriptResponse.data) {
            const searchInfo = new SearchInformations(
              String(scriptResponse.data)
            );
            console.log("url = ", SearchInformations.searchUrl);
            console.log("apikey = ", SearchInformations.apiKey);

            if (searchInfo.apiKey) {
              return searchInfo;
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

module.exports = { HTMLRequests, SearchModifiers, SearchInformations };
