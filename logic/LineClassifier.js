const moment = require('moment');
const Util = require('./Util.js');
const LogNode = require(Util.LOG_NODE);

class LineClassifier {

  constructor() {
    this.negativeWords = [
      'error',
      'fail',
      'segfault',
      'overflow',
      'lost'
    ];
  }

  createLogNode(line, lineNo) {
    let label = 'G';
    const timestamp = this.getTimestamp(line);
    const jobId = this.getJobId(line);
    const message = line.toLowerCase();
    const negativeWords = this.negativeWords;

    for (let i = 0; i < negativeWords.length; i++){
      let negativeWord = negativeWords[i];
      if (message.includes(negativeWord)) label = 'B';
    }
    if (message.includes("soft lockup")) label = 'F';

    return new LogNode(lineNo, line, timestamp, jobId, label);
  }

  getTimestamp(line) {
    const timestamp = line.match(/[A-Z][a-z]{2}\s\d+\s\d{2}:\d{2}:\d{2}/);
    if (timestamp !== null) return moment(timestamp[0], "MMM D HH:mm:ss");
    else return null;
  }

  getJobId(line) {
    const jobId = line.match(/^\d+/);
    return jobId[0];
  }

}

module.exports = LineClassifier;
