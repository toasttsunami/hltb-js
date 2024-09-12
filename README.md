#  howlongtobeat-js

A simple project that provides a Node.js API for interacting with the HowLongToBeat website, allowing you to search for games and retrieve information about their completion times.

Heavily inspired by [ScrappyCocco's HowLongToBeat Python API](https://github.com/ScrappyCocco/HowLongToBeat-PythonAPI) and [ckatzorke's howlongtobeat javascript API](https://github.com/ckatzorke/howlongtobeat).

This project was made due to the lack of activity by ckatzorke on their repo, whose api i was utilizing in another project, but it broke due to changed made by HowLongToBeat. 

## Features

- Search for games by name
- Retrieve game information by ID
- Parse and process JSON results from HowLongToBeat
- Calculate string similarities for improved search results
- Customizable search options, including DLC filtering

## Installation

### Clone the repository:

To use this API in your project, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/toasttsunami/hltb-js.git
   ```

2. Install the dependencies:
   ```
   cd hltb-js
   npm install
   ```

3. Import the `HowLongToBeat` class in your project:
   ```javascript
   const { HowLongToBeat } = require('./path/to/HowLongToBeat.js');
   ```

### Install from npm

Alternatively, you can install the `howlongtobeat-js` package directly from npm:

1. Install the package:
    ```
    npm install howlongtobeat-js
    ```

2. Import howlongtobeat-js into your project:
    ```javascript
    const { HowLongToBeat } = require('howlongtobeat-js')
    ```  

## Usage

### Searching for a game

```javascript
const { HowLongToBeat } = require('./HowLongToBeat.js');

const hltb = new HowLongToBeat();

async function searchGame(gameName) {
  try {
    const results = await hltb.search(gameName);
    console.log(results);
  } catch (error) {
    console.error('Error searching for game:', error);
  }
}

searchGame('Dark Souls');
```

### Retrieving game information by ID

```javascript
async function getGameById(gameId) {
  try {
    const game = await hltb.searchFromId(gameId);
    console.log(game);
  } catch (error) {
    console.error('Error retrieving game by ID:', error);
  }
}

getGameById(2224);
```

## API Reference

### `HowLongToBeat` class

The main class for interacting with the HowLongToBeat API.

#### Constructor

- `constructor(minSimilarity = 0.4)`: Creates a new instance of the HowLongToBeat class.
  - `minSimilarity`: Minimum similarity threshold for filtering search results (default: 0.4).

#### Methods

- `async search(gameName, searchModifiers = SearchModifiers.NONE, similarityMatchCase = true)`: Searches for games by name.
  - `gameName`: The name of the game to search for.
  - `searchModifiers`: Search modifiers for filtering results (e.g., including/excluding DLC).
  - `similarityMatchCase`: Whether to perform case-sensitive similarity matching.

- `async searchFromId(gameId)`: Retrieves game information by its HowLongToBeat ID.
  - `gameId`: The unique identifier of the game on HowLongToBeat.

### `SearchModifiers`

An enumeration of search modifiers:

- `NONE`: No modifiers applied.
- `ISOLATE_DLC`: Show only DLC in the search results.
- `HIDE_DLC`: Hide DLCs in the search results.

### `HowLongToBeatEntry` class

Represents a single game entry returned from the API.

#### Properties

- `gameId`: HowLongToBeat game ID.
- `gameName`: Default game name.
- `gameAlias`: Alternative name for the game.
- `gameType`: Type of entry (e.g., "game" or "dlc").
- `gameImageUrl`: URL of the game's image.
- `gameWebLink`: Link to the game's HowLongToBeat page.
- `reviewScore`: User review score.
- `profileDev`: Developer name.
- `profilePlatforms`: List of platforms the game is available on.
- `releaseWorld`: Release year.
- `similarity`: Similarity score between the search query and the game name.
- `mainStory`: Main story completion time (in hours).
- `mainExtra`: Main story + extras completion time (in hours).
- `completionist`: Completionist run time (in hours).
- `allStyles`: Average of all playstyles (in hours).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open-source and available under the [MIT License](LICENSE).

## Acknowledgements

This project is not officially affiliated with HowLongToBeat. It is a third-party API implementation for educational and personal use.