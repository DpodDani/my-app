/**
 *  A utility class that will contain meta data for the application.
 *  @constructor
 */
class Util {

  constructor () {
    // empty for now
  }

  getLogPaths() {
    return {
      "Mar01" : "/../public/files/Mar01",
      "test" : "/../public/files/test.txt"
    };
  }

  getNegativeArray () {
    return [
      "error",
      "failed",
      
    ];
  }

}

module.exports = Util;
