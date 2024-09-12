const { HowLongToBeatEntry } = require("./HowLongToBeatEntry.js");
const stringSimilarityUtil = require('./stringSimilarityUtil.js')
/**
 * This class parses the JSON code received from HowLongToBeat
 */
class JSONResultParser {
  // Used for both images and game links
  static IMAGE_URL_PREFIX = "https://howlongtobeat.com/games/";
  static GAME_URL_PREFIX = "https://howlongtobeat.com/game/";

  /**
   * @param {string} inputGameName
   * @param {string} inputGameUrl
   * @param {number} minSimilarity
   * @param {number|null} inputGameId
   * @param {boolean} inputsimilarityMatchCase
   */
  constructor(
    inputGameName,
    inputGameUrl,
    minSimilarity,
    inputGameId = null,
    inputsimilarityMatchCase = true
  ) {
    // Init instance variables
    this.results = [];
    this.minimumSimilarity = minSimilarity;
    this.similarityMatchCase = inputsimilarityMatchCase;
    this.gameId = inputGameId;
    this.baseGameUrl = inputGameUrl;
    // Init object
    this.gameName = inputGameName;
    this.gameNameNumbers = inputGameName
      .split(" ")
      .filter((word) => /^\d+$/.test(word));
      // filters the numbers present in the input name
  }

  /**
   * @param {string} inputJsonResult - self explanatory
   */
  parseJSONResult(inputJsonResult) {
    const responseResult = JSON.parse(inputJsonResult);
    for (const game of responseResult.data) {
      const newGameEntry = this.parseJsonElement(game);
      // We have a gameId, so we are searching by id, add it only if the id is equal
      if (
        this.gameId !== null &&
        String(newGameEntry.gameId) !== String(this.gameId)
      ) {
        continue;
      }
      // Minimum Similarity is 0 so just add it straight away
      else if (this.minimumSimilarity === 0.0) {
        this.results.push(newGameEntry);
      }
      // Add it if it respects the minimum similarity
      else if (newGameEntry.similarity >= this.minimumSimilarity) {
        this.results.push(newGameEntry);
      }
    }
  }

  /**
   * @param {Object} inputGameElement
   * @returns {HowLongToBeatEntry}
   */
  parseJsonElement(inputGameElement) {
    const currentEntry = new HowLongToBeatEntry();
    // Compute base fields
    currentEntry.gameId = inputGameElement.game_id;
    currentEntry.gameName = inputGameElement.game_name;
    currentEntry.gameAlias = inputGameElement.game_alias;
    currentEntry.gameType = inputGameElement.game_type;
    if ("game_image" in inputGameElement) {
      currentEntry.gameImageUrl =
        JSONResultParser.IMAGE_URL_PREFIX + inputGameElement.game_image;
    }
    currentEntry.gameWebLink =
      JSONResultParser.GAME_URL_PREFIX + currentEntry.gameId;
    currentEntry.reviewScore = inputGameElement.review_score;
    currentEntry.profileDev = inputGameElement.profile_dev;
    if ("profile_platform" in inputGameElement) {
      currentEntry.profilePlatforms =
        inputGameElement.profile_platform.split(", ");
    }
    currentEntry.releaseWorld = inputGameElement.release_world;
    // Add full JSON content to the entry
    currentEntry.jsonContent = inputGameElement;
    // Add a few times elements as help for the user
    // Calculate only if value is not null
    if ("comp_main" in inputGameElement) {
      currentEntry.mainStory = Number(
        (inputGameElement.comp_main / 3600).toFixed(2)
      );
    }
    if ("comp_plus" in inputGameElement) {
      currentEntry.mainExtra = Number(
        (inputGameElement.comp_plus / 3600).toFixed(2)
      );
    }
    if ("comp_100" in inputGameElement) {
      currentEntry.completionist = Number(
        (inputGameElement.comp_100 / 3600).toFixed(2)
      );
    }
    if ("comp_all" in inputGameElement) {
      currentEntry.allStyles = Number(
        (inputGameElement.comp_all / 3600).toFixed(2)
      );
    }
    // Compute Similarity
    const gameNameSimilarity = stringSimilarityUtil.similar(
      this.gameName,
      currentEntry.gameName,
      this.gameNameNumbers,
      this.similarityMatchCase
    );
    const gameAliasSimilarity = stringSimilarityUtil.similar(
      this.gameName,
      currentEntry.gameAlias,
      this.gameNameNumbers,
      this.similarityMatchCase
    );
    currentEntry.similarity = Math.max(gameNameSimilarity, gameAliasSimilarity);
    return currentEntry;
  }
}

module.exports = { JSONResultParser };
