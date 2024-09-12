 /**
 * Utility class for calculating string similarities
 */

class stringSimilarityUtil { 
 /**
   * This function calculates how much the first string is similar to the second string
   * @param {string} a - First String
   * @param {string} b - Second String
   * @param {string[]} gameNameNumbers - All the numbers in <a> string, used for an additional check
   * @param {boolean} similarityMatchCase - If the similarity should be case-sensitive (true) or ignore case (false)
   * @returns {number} - Return the similarity between the two strings (0.0-1.0)
   */
  static similar(a, b, gameNameNumbers, similarityMatchCase) {
    if (a == null || b == null) {
      return 0;
    }
    // Check if we want a case-sensitive compare or not
    let similarity;
    if (similarityMatchCase) {
      similarity = this.sequenceMatcher(a, b);
    } else {
      similarity = this.sequenceMatcher(
        a.toLowerCase(),
        b.toLowerCase()
      );
    }
    if (gameNameNumbers != null && gameNameNumbers.length > 0) {
      // additional check about numbers in the string
      let numberFound = false;
      const cleaned = b.replace(/[^\s\w]/g, "");
      for (const word of cleaned.split(" ")) {
        // check for every word
        if (/^\d+$/.test(word)) {
          // if is a digit
          for (const numberEntry of gameNameNumbers) {
            // compare it with numbers in the begin string
            if (String(numberEntry) === String(word)) {
              numberFound = true;
              break;
            }
          }
        }
      }
      if (!numberFound) {
        // number in the given string not in this one, reduce prob
        similarity -= 0.1;
      }
    }
    return similarity;
  }

  /**
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  static sequenceMatcher(a, b) {
    if (a === b) return 1;
    if (a.length > b.length) [a, b] = [b, a];
    const m = a.length;
    const n = b.length;
    const matrix = Array(m + 1)
      .fill()
      .map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1] + 1;
        } else {
          matrix[i][j] = Math.max(matrix[i][j - 1], matrix[i - 1][j]);
        }
      }
    }
    return (2.0 * matrix[m][n]) / (m + n);
  }
}

module.exports = stringSimilarityUtil;