// tests/unit/hltb-js.test.js

const { HowLongToBeat } = require("../../src/HowLongToBeat");
const { HowLongToBeatEntry } = require("../../src/HowLongToBeatEntry");
const { HTMLRequests, SearchModifiers } = require("../../src/HTMLRequests");
const { JSONResultParser } = require("../../src/JSONResultParser");
const stringSimilarityUtil = require("../../src/stringSimilarityUtil");

// Mock axios for HTTP requests
jest.mock("axios");
const axios = require("axios");

describe("HowLongToBeat", () => {
  let hltb;

  beforeEach(() => {
    hltb = new HowLongToBeat();
    jest.clearAllMocks();
  });

  test("search should return null for empty game name", async () => {
    const result = await hltb.search("");
    expect(result).toBeNull();
  });

  test("search should return game results", async () => {
    HTMLRequests.sendWebRequest = jest.fn().mockResolvedValue({
      data: [
        {
          game_id: 1,
          game_name: "Test Game",
          game_alias: "Alias",
          game_type: "game",
          game_image: "test.jpg",
          review_score: 80,
          profile_dev: "Test Dev",
          profile_platform: "PC, PS4",
          release_world: "2023",
          comp_main: 3600,
          comp_plus: 7200,
          comp_100: 10800,
          comp_all: 14400,
        },
      ],
    });

    const result = await hltb.search("Test Game");
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(HowLongToBeatEntry);
    expect(result[0].gameName).toBe("Test Game");
  });

  test("searchFromId should return null for invalid id", async () => {
    const result = await hltb.searchFromId(0);
    expect(result).toBeNull();
  });

  test("searchFromId should return correct entry for valid flow", async () => {
    // Mock getGameTitle to return a name
    const titleSpy = jest
      .spyOn(HTMLRequests, "getGameTitle")
      .mockResolvedValue("Elden Ring");

    // Mock sendWebRequest to return data including that game
    const searchSpy = jest
      .spyOn(HTMLRequests, "sendWebRequest")
      .mockResolvedValue({
        data: [
          {
            game_id: 100,
            game_name: "Elden Ring",
            comp_main: 50000,
          },
          {
            game_id: 101,
            game_name: "Elden Ring 2",
            comp_main: 50000,
          },
        ],
      });

    const result = await hltb.searchFromId(100);

    expect(titleSpy).toHaveBeenCalledWith(100);
    expect(searchSpy).toHaveBeenCalledWith("Elden Ring");
    expect(result).toBeInstanceOf(HowLongToBeatEntry);
    expect(result.gameId).toBe(100);
    expect(result.gameName).toBe("Elden Ring");
  });

  test("searchFromId should return null if ID lookup returns name but search mismatch", async () => {
    jest.spyOn(HTMLRequests, "getGameTitle").mockResolvedValue("Old Game");
    jest.spyOn(HTMLRequests, "sendWebRequest").mockResolvedValue({
      data: [
        {
          game_id: 999,
          game_name: "Old Game Remastered", // Different ID
        },
      ],
    });

    // We search for ID 500, get "Old Game", search "Old Game", get ID 999.
    // 500 != 999, so it should return null.
    const result = await hltb.searchFromId(500);
    expect(result).toBeNull();
  });
});

describe("HowLongToBeatEntry", () => {
  test("should initialize with default values", () => {
    const entry = new HowLongToBeatEntry();
    expect(entry.gameId).toBe(-1);
    expect(entry.gameName).toBeNull();
    expect(entry.gameAlias).toBeNull();
    expect(entry.similarity).toBe(-1);
  });
});

describe("HTMLRequests", () => {
  test("getSearchRequestHeaders should return valid headers", () => {
    const headers = HTMLRequests.getSearchRequestHeaders();
    expect(headers).toHaveProperty("content-type", "application/json");
    expect(headers).toHaveProperty("accept", "*/*");
    expect(headers).toHaveProperty("User-Agent");
    expect(headers).toHaveProperty("referer", HTMLRequests.REFERER_HEADER);
  });

  test("getSearchRequestData should return valid payload", () => {
    const payload = HTMLRequests.getSearchRequestData(
      "Test Game",
      SearchModifiers.NONE,
      1,
    );
    const parsedPayload = JSON.parse(payload);
    expect(parsedPayload).toHaveProperty("searchType", "games");
    expect(parsedPayload).toHaveProperty("searchTerms", ["Test", "Game"]);
    expect(parsedPayload).toHaveProperty("searchPage", 1);
  });

  test("cutGameTitle should extract title correctly", () => {
    const mockHtml =
      "<html><head><title>How Long is Test Game? - HowLongToBeat</title></head><body></body></html>";
    const title = HTMLRequests.cutGameTitle(mockHtml);
    // Method slices 12 chars from start ("How Long is ") and 17 from end ("? - HowLongToBeat")
    expect(title).toBe("Test Game");
  });

  test("cutGameTitle should handle empty or null source", () => {
    expect(HTMLRequests.cutGameTitle(null)).toBeNull();
    expect(HTMLRequests.cutGameTitle("")).toBeNull();
  });
});

describe("JSONResultParser", () => {
  test("should parse JSON result correctly", () => {
    const parser = new JSONResultParser(
      "Test Game",
      "https://example.com",
      0.4,
    );
    const jsonResult = JSON.stringify({
      data: [
        {
          game_id: 1,
          game_name: "Test Game",
          game_alias: "Alias",
          game_type: "game",
          game_image: "test.jpg",
          review_score: 80,
          profile_dev: "Test Dev",
          profile_platform: "PC, PS4",
          release_world: "2023",
          comp_main: 3600,
          comp_plus: 7200,
          comp_100: 10800,
          comp_all: 14400,
        },
      ],
    });

    parser.parseJSONResult(jsonResult);
    expect(parser.results).toHaveLength(1);
    expect(parser.results[0]).toBeInstanceOf(HowLongToBeatEntry);
    expect(parser.results[0].gameName).toBe("Test Game");
    expect(parser.results[0].mainStory).toBe(1);
    expect(parser.results[0].mainExtra).toBe(2);
    expect(parser.results[0].completionist).toBe(3);
    expect(parser.results[0].allStyles).toBe(4);
  });

  test("should handle missing or null fields gracefully", () => {
    const parser = new JSONResultParser("Incomplete Game", "", 0.0);
    const jsonResult = JSON.stringify({
      data: [
        {
          game_id: 2,
          game_name: "Incomplete Game",
          // Missing time fields
          game_type: "game",
        },
      ],
    });

    parser.parseJSONResult(jsonResult);
    const result = parser.results[0];
    expect(result.gameName).toBe("Incomplete Game");
    // Fields not present should remain null (or undefined/0 based on class default, currently class doesn't init them)
    // The parser checks `if ("comp_main" in ...)` so they shouldn't be set on the object if missing.
    expect(result.mainStory).toBeNull();
  });

  test("should handle type mismatches in time fields", () => {
    const parser = new JSONResultParser("Stringy Game", "", 0.0);
    // Passing strings that look like numbers
    const jsonResult = JSON.stringify({
      data: [
        {
          game_id: 3,
          game_name: "Stringy Game",
          comp_main: "3600", // String
        },
      ],
    });

    parser.parseJSONResult(jsonResult);
    const result = parser.results[0];
    // The parser wraps in Number(), so "3600" / 3600 = 1.
    expect(result.mainStory).toBe(1);
  });

  test("should handle empty data array", () => {
    const parser = new JSONResultParser("Ghost Game", "", 0.0);
    const jsonResult = JSON.stringify({
      data: [],
    });

    parser.parseJSONResult(jsonResult);
    expect(parser.results).toHaveLength(0);
  });
});

describe("stringSimilarityUtil", () => {
  test("similar should return 1 for identical strings", () => {
    const similarity = stringSimilarityUtil.similar("test", "test", [], true);
    expect(similarity).toBe(1);
  });

  test("similar should return lower value for different strings", () => {
    const similarity = stringSimilarityUtil.similar("test", "tast", [], true);
    expect(similarity).toBeLessThan(1);
    expect(similarity).toBeGreaterThan(0);
  });

  test("similar should be case-insensitive when specified", () => {
    const similarityCaseSensitive = stringSimilarityUtil.similar(
      "Test",
      "test",
      [],
      true,
    );
    const similarityCaseInsensitive = stringSimilarityUtil.similar(
      "Test",
      "test",
      [],
      false,
    );
    expect(similarityCaseSensitive).toBeLessThan(similarityCaseInsensitive);
  });

  test("should apply penalty for number mismatch", () => {
    // "FIFA 22" vs "FIFA 23"
    // The algorithm has logic: if numbers in the string don't match input numbers, apply penalty.
    const title = "FIFA 22";
    const candidateSame = "FIFA 22";
    const candidateDiff = "FIFA 23";
    const numbers = ["22"];

    const scoreSame = stringSimilarityUtil.similar(
      title,
      candidateSame,
      numbers,
      true,
    );
    const scoreDiff = stringSimilarityUtil.similar(
      title,
      candidateDiff,
      numbers,
      true,
    );

    // ScoreDiff should be significantly lower because of the number mismatch penalty
    expect(scoreSame).toBe(1);
    expect(scoreDiff).toBeLessThan(0.9);
  });

  test("should handle special characters", () => {
    // "God of War: Ragnarök" vs "God of War"
    // This checks if the tokenizer splits or handles the colon/special chars reasonably
    const title = "God of War: Ragnarök";
    const candidate = "God of War";

    const score = stringSimilarityUtil.similar(title, candidate, [], true);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});