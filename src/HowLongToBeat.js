const { html } = require("cheerio");
const { HTMLRequests, SearchModifiers } = require("./HTMLRequests.js");
const { JSONResultParser } = require("./JSONResultParser.js");

class HowLongToBeat {
  // main class containing search and searchById funtions

  /**
   * Constructor with optional parameters
   * @param {number} minSimilarity - Minimum similarity to use to filter the results with the found name,
   * 0 will return all the results; 1 means perfectly equal and should not be used; default is 0.4
   */
  constructor(minSimilarity = 0.4) {
    this.minimumSimilarity = minSimilarity;
  }

  /**
   * Function that searches the game using a async request
   * @param {string} gameName - The original game name received as input
   * @param {SearchModifiers} searchModifiers - The "Modifiers" list in "Search Options", allow to show/isolate/hide DLCs
   * @param {boolean} similarityMatchCase - If the similarity check between names should be case-sensitive (default true)
   * @returns {Array|null} A list of possible games (or null in case of wrong parameter or failed request)
   */
  async search(
    gameName,
    searchModifiers = SearchModifiers.NONE,
    similarityMatchCase = true
  ) {
    if (!gameName || gameName.length === 0) {
      return null;
    }
    const htmlResult = await HTMLRequests.sendWebRequest(
      gameName,
      searchModifiers
    );
    if (htmlResult !== null) {
      return this._parseWebResult(
        gameName,
        htmlResult,
        null,
        similarityMatchCase
      );
    }
    return null;
  }

  /**
   * To re-use code, it extracts the game name and searches game by name, picking only the game with the same id
   * Remember that this function uses 2 requests: one to get the game title and one to get game data
   * @param {number} gameId - The game id to get data
   * @returns {Object|null} The game data (single HowLongToBeatEntry object) or null in case of error
   */
  async searchFromId(gameId) {
    if (!gameId || gameId === 0) {
      return null;
    }
    const gameTitle = await HTMLRequests.getGameTitle(gameId);
    if (gameTitle !== null) {
      const htmlResult = await HTMLRequests.sendWebRequest(gameTitle);
      if (htmlResult !== null) {
        const resultList = this._parseWebResult(gameTitle, htmlResult, gameId);
        if (!resultList || resultList.length === 0 || resultList.length > 1) {
          return null;
        }
        return resultList[0];
      }
    }
    return null;
  }

  /**
   * Function that calls the HTML parser to get the data
   * @param {string} gameName - The original game name received as input
   * @param {string} htmlResult - The HTML received from the request
   * @param {number|null} gameId - The game id to search
   * @param {boolean} similarityMatchCase - If the similarity check between names should be case-sensitive (default true)
   * @returns {Array} A list of possible games
   * @private
   */
  _parseWebResult(
    gameName,
    htmlResult,
    gameId = null,
    similarityMatchCase = true
  ) {
    let parser;
    if (gameId === null) {
      // If search is by name, then gameId will be null
      parser = new JSONResultParser(
        gameName,
        HTMLRequests.GAME_URL,
        this.minimumSimilarity,
        gameId,
        similarityMatchCase
      );
    } else {
      // If the search is by id, ignore class minimumSimilarity and set it to 0.0, as when searching by Id we will only get one result if matches
      // Also ignore similarityMatchCase and leave default value
      parser = new JSONResultParser(
        gameName,
        HTMLRequests.GAME_URL,
        0.0,
        gameId
      );
    }
    parser.parseJSONResult(JSON.stringify(htmlResult));
    return parser.results;
  }
}
module.exports = { HowLongToBeat };
