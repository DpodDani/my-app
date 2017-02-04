const moment = require('moment');

/**
 *  This class will act as a container for each log line that is read from the log file.
 *
 *  @param  {Integer} id        Unique number used to identify the LogNode object.
 *  @param  {String}  message   The log line read from the log file.
 *  @param  {Moment}  timestamp The timestamp extracted from the log line.
 */
class LogNode {

  constructor(message, timestamp, jobId, label) {
    this.message = message;
    this.timestamp = timestamp;
    this.jobId = jobId;
    this.label = label;
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

  getTimeDifference(logNodeTS) {
      return moment.duration(this.timestamp.diff(logNodeTS)).asHours();
  }

}

module.exports = LogNode;
