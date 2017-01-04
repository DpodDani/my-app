class LogNode {
  constructor(id, message, timestamp) {
    this.id = id;
    this.message = message;
    this.timestamp = timestamp;
  }

  getTimestamp() {
    return this.timestamp;
  }

  getId() {
    return this.id;
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