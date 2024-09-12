// tests/howlongtobeat.test.js

const { HowLongToBeat } = require('../src/HowLongToBeat');
const { HowLongToBeatEntry } = require('../src/HowLongToBeatEntry');
const { HTMLRequests, SearchModifiers } = require('../src/HTMLRequests');
const { JSONResultParser } = require('../src/JSONResultParser');
const stringSimilarityUtil = require('../src/stringSimilarityUtil');

// Mock axios for HTTP requests
jest.mock('axios');

describe('HowLongToBeat', () => {
  let hltb;

  beforeEach(() => {
    hltb = new HowLongToBeat();
  });

  test('search should return null for empty game name', async () => {
    const result = await hltb.search('');
    expect(result).toBeNull();
  });

  test('search should return game results', async () => {
    // Mock the HTMLRequests.sendWebRequest method
    HTMLRequests.sendWebRequest = jest.fn().mockResolvedValue({
      data: [
        {
          game_id: 1,
          game_name: 'Test Game',
          game_alias: 'Alias',
          game_type: 'game',
          game_image: 'test.jpg',
          review_score: 80,
          profile_dev: 'Test Dev',
          profile_platform: 'PC, PS4',
          release_world: '2023',
          comp_main: 3600,
          comp_plus: 7200,
          comp_100: 10800,
          comp_all: 14400
        }
      ]
    });

    const result = await hltb.search('Test Game');
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(HowLongToBeatEntry);
    expect(result[0].gameName).toBe('Test Game');
  });

  test('searchFromId should return null for invalid id', async () => {
    const result = await hltb.searchFromId(0);
    expect(result).toBeNull();
  });
});

describe('HowLongToBeatEntry', () => {
  test('should initialize with default values', () => {
    const entry = new HowLongToBeatEntry();
    expect(entry.gameId).toBe(-1);
    expect(entry.gameName).toBeNull();
    expect(entry.gameAlias).toBeNull();
    expect(entry.similarity).toBe(-1);
  });
});

describe('HTMLRequests', () => {
  test('getSearchRequestHeaders should return valid headers', () => {
    const headers = HTMLRequests.getSearchRequestHeaders();
    expect(headers).toHaveProperty('content-type', 'application/json');
    expect(headers).toHaveProperty('accept', '*/*');
    expect(headers).toHaveProperty('User-Agent');
    expect(headers).toHaveProperty('referer', HTMLRequests.REFERER_HEADER);
  });

  test('getSearchRequestData should return valid payload', () => {
    const payload = HTMLRequests.getSearchRequestData('Test Game', SearchModifiers.NONE, 1);
    const parsedPayload = JSON.parse(payload);
    expect(parsedPayload).toHaveProperty('searchType', 'games');
    expect(parsedPayload).toHaveProperty('searchTerms', ['Test', 'Game']);
    expect(parsedPayload).toHaveProperty('searchPage', 1);
  });
});

describe('JSONResultParser', () => {
  test('should parse JSON result correctly', () => {
    const parser = new JSONResultParser('Test Game', 'https://example.com', 0.4);
    const jsonResult = JSON.stringify({
      data: [
        {
          game_id: 1,
          game_name: 'Test Game',
          game_alias: 'Alias',
          game_type: 'game',
          game_image: 'test.jpg',
          review_score: 80,
          profile_dev: 'Test Dev',
          profile_platform: 'PC, PS4',
          release_world: '2023',
          comp_main: 3600,
          comp_plus: 7200,
          comp_100: 10800,
          comp_all: 14400
        }
      ]
    });

    parser.parseJSONResult(jsonResult);
    expect(parser.results).toHaveLength(1);
    expect(parser.results[0]).toBeInstanceOf(HowLongToBeatEntry);
    expect(parser.results[0].gameName).toBe('Test Game');
    expect(parser.results[0].mainStory).toBe(1);
    expect(parser.results[0].mainExtra).toBe(2);
    expect(parser.results[0].completionist).toBe(3);
    expect(parser.results[0].allStyles).toBe(4);
  });
});

describe('stringSimilarityUtil', () => {
  test('similar should return 1 for identical strings', () => {
    const similarity = stringSimilarityUtil.similar('test', 'test', [], true);
    expect(similarity).toBe(1);
  });

  test('similar should return lower value for different strings', () => {
    const similarity = stringSimilarityUtil.similar('test', 'tast', [], true);
    expect(similarity).toBeLessThan(1);
    expect(similarity).toBeGreaterThan(0);
  });

  test('similar should be case-insensitive when specified', () => {
    const similarityCaseSensitive = stringSimilarityUtil.similar('Test', 'test', [], true);
    const similarityCaseInsensitive = stringSimilarityUtil.similar('Test', 'test', [], false);
    expect(similarityCaseSensitive).toBeLessThan(similarityCaseInsensitive);
  });
});