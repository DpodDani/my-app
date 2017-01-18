/**
 *  This class will act as a container for each log line that is read from the log file.
 *
 *  @param  {Integer} id        Unique number used to identify the LogNode object.
 *  @param  {String}  message   The log line read from the log file.
 *  @param  {Moment}  timestamp The timestamp extracted from the log line.
 */
class LogNode {

  constructor(id, message, timestamp) {
    this.id = id;
    this.message = message;
    this.timestamp = timestamp;
  }

  getTimestamp() {
    return this.timestamp;
  }

  getLogMessage() {
    return this.logMessage;
  }

  setLabel(label) {
    this.label = label;
  }

  getLabel() {
    return this.label || null;
  }
}

module.exports = LogNode;
