/**
 * A simple class to collect all game data that are being read from the JSON response
 * It contains just the main data and values for the game, the rest can be read manually from the JSON
 * Consider that some values could be null, such as profileDev, since HLTB sometimes remove/add values
 * Not all completion times will be valid, eg, for single player games there will be no co-op time
 */
class HowLongToBeatEntry {
  constructor() {
    /**
     * How Long To Beat Game ID
     * @type {number}
     */
    this.gameId = -1;

    /**
     * Default Game Name
     * @type {string|null}
     */
    this.gameName = null;

    /**
     * Alias for the same game, as a second name
     * @type {string|null}
     */
    this.gameAlias = null;

    /**
     * The type of entry, usually "game" or "dlc"
     * @type {string|null}
     */
    this.gameType = null;

    /**
     * @type {string|null}
     */
    this.gameImageUrl = null;

    /**
     * Link to How Long To Beat
     * @type {string|null}
     */
    this.gameWebLink = null;

    /**
     * The review score
     * @type {number|null}
     */
    this.reviewScore = null;

    /**
     * The name of the dev
     * @type {string|null}
     */
    this.profileDev = null;

    /**
     * The list of the platforms for the title
     * @type {Array<string>|null}
     */
    this.profilePlatforms = null;

    /**
     * Should contain the release year
     * @type {string|null}
     */
    this.releaseWorld = null;

    /**
     * Similarity between this entry game name and the searched string
     * Calculated as the max similarity between the searched string and gameName & gameAlias
     * @type {number}
     */
    this.similarity = -1;

    /**
     * Full JSON response
     * @type {Object|null}
     */
    this.jsonContent = null;

    /**
     * Main Story completion time in hours
     * @type {number|null}
     */
    this.mainStory = null;

    /**
     * Main + Extra completion time in hours
     * @type {number|null}
     */
    this.mainExtra = null;

    /**
     * Main Completionist completion time in hours
     * @type {number|null}
     */
    this.completionist = null;

    /**
     * All styles completion time in hours
     * @type {number|null}
     */
    this.allStyles = null;
  }
}
module.exports = { HowLongToBeatEntry };
