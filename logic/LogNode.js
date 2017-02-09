const moment = require('moment');

/**
 *  This class will act as a container for each log line that is read from the log file.
 *
 *  @param  {Integer}   lineNo   The line number of the log message in the log file.
 *  @param  {String}    message   The log line read from the log file.
 *  @param  {Moment}    timestamp The timestamp extracted from the log line.
 *  @param  {Integer}   jobId     The number representing the process job ID
 *  @param  {Character} label     The sentiment of a particular log line.
 */
class LogNode {

  constructor(lineNo, message, timestamp, jobId, label) {
    this.lineNo = lineNo;
    this.message = message;
    this.timestamp = timestamp;
    this.jobId = jobId;
    this.label = label;
  }

  getLineNo() {
    return this.lineNo;
  }

  getTimestamp() {
    return this.timestamp;
  }

  getMessage() {
    return this.message;
  }

  getJobId() {
    return this.jobId;
  }

  getLabel() {
    return this.label || null;
  }

  getTimeDifference(logNode) {
      return moment.duration(this.timestamp.diff(logNode.getTimestamp())).asHours();
  }

}

module.exports = LogNode;
