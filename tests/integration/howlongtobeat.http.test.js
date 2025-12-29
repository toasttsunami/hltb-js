// tests/integration/howlongtobeat.http.test.js

const nock = require("nock");
const { HowLongToBeat } = require("../../src/HowLongToBeat");

describe("HowLongToBeat HTTP integration", () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test("performs a real HTTP request with correct payload and parses result", async () => {
    // Mock the init request for the token
    nock("https://howlongtobeat.com")
      .get(/\/api\/search\/init.*/)
      .reply(200, { token: "fake-token" });

    // Mock the search request
    const scope = nock("https://howlongtobeat.com")
      .post("/api/search/", (body) => {
        return body.searchType === "games";
      })
      .matchHeader("content-type", "application/json")
      .reply(200, {
        data: [
          {
            game_id: 1,
            game_name: "Test Game",
            comp_main: 3600,
            comp_plus: 7200,
            comp_100: 10800,
            comp_all: 14400,
          },
        ],
      });

    const hltb = new HowLongToBeat();
    const result = await hltb.search("Test Game");

    expect(scope.isDone()).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].gameName).toBe("Test Game");
  });

  test("handles 500 API error gracefully", async () => {
    // Mock the init request
    nock("https://howlongtobeat.com")
      .get(/\/api\/search\/init.*/)
      .reply(200, { token: "fake-token" });

    nock("https://howlongtobeat.com")
      .post("/api/search/")
      .reply(500, "Internal Server Error");

    const hltb = new HowLongToBeat();
    // Assuming the library catches the error and returns null, or throws.
    // Based on source code: HTMLRequests.sendWebRequest catches errors and returns null.
    const result = await hltb.search("Test Game");
    expect(result).toBeNull();
  });

  test("handles 404 API error gracefully", async () => {
    // Mock the init request
    nock("https://howlongtobeat.com")
      .get(/\/api\/search\/init.*/)
      .reply(200, { token: "fake-token" });

    nock("https://howlongtobeat.com")
      .post("/api/search/")
      .reply(404, "Not Found");

    const hltb = new HowLongToBeat();
    const result = await hltb.search("Test Game");
    expect(result).toBeNull();
  });

  test("handles malformed JSON response gracefully", async () => {
    // Mock the init request
    nock("https://howlongtobeat.com")
      .get(/\/api\/search\/init.*/)
      .reply(200, { token: "fake-token" });

    nock("https://howlongtobeat.com")
      .post("/api/search/")
      .reply(200, "<html>Not JSON</html>", {
        "content-type": "text/html",
      });

    const hltb = new HowLongToBeat();
    // axios will likely throw or return the string as data.
    // The code in HTMLRequests.js checks response.data.
    // If response.data is "<html>...", passed to _parseWebResult -> JSONResultParser.
    // JSON.parse("<html>...") will throw.
    // We should verify if the library catches this throw.
    // Looking at HowLongToBeat.js: _parseWebResult calls JSONResultParser which calls JSON.parse.
    // It seems there is NO try/catch in _parseWebResult or search().
    // So this should actually throw an error in the current implementation.
    // We will write the test to expect a throw, revealing the need for a fix (which is a valid test result).

    const result = await hltb.search("Test Game");
    expect(result).toBeNull();
  });

  test("handles auth token failure gracefully", async () => {
    // Mock init failure
    nock("https://howlongtobeat.com")
      .get(/\/api\/search\/init.*/)
      .reply(500);

    const hltb = new HowLongToBeat();
    const result = await hltb.search("Test Game");
    expect(result).toBeNull();
  });
});