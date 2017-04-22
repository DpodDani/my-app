const Util = require('./Util.js');
const Promise = require('bluebird');

class WindowClassifier {

  constructor(logWindow) {
    this.logWindow = logWindow;
  }

  getClassification() {

    return new Promise ( (resolve, reject) => {
      let logWindow = this.logWindow;
      const THRESHOLD = 0.8;

      // Obtain Window features
      const noOfBs = logWindow.getFeature('noOfBs');
      const noOfGs = logWindow.getFeature('noOfGs');
      const noOfFs = logWindow.getFeature('noOfFs');

      // Use features to decide upon the label (classification)
      const windowLabel = ((noOfGs > THRESHOLD * noOfBs) && (noOfFs < 1)) ? 'G_WINDOW' : 'B_WINDOW';

      // Set the label
      logWindow.setLabel(windowLabel);
      resolve(logWindow);
    });

  }

}

module.exports = WindowClassifier;
