// This will be called in an Async forEach scope
// Will collect features for each logWindow that is passed down into it
class FeatureCollector {

  // This is the Window class
  constructor(logWindow) {
    this.logWindow = logWindow;
    this.sequenceOfLabels = logWindow.getSequence();
  }

  startCollection() {
    let logWindow = this.logWindow;

    return new Promise( (resolve, reject) => {
      // calls all the feature collection functions
      logWindow.setFeature('noOfBs', this.getLabelFreq('B'));
      logWindow.setFeature('noOfGs', this.getLabelFreq('G'));
      logWindow.setFeature('noOfFs', this.getLabelFreq('F'));
      logWindow.setFeature('longestSeqOfBs', this.getLongestSequence('B'));
      logWindow.setFeature('longestSeqOfGs', this.getLongestSequence('G'));

      resolve(logWindow);
    });

  }

  getLabelFreq(label) {
    const logWindow = this.logWindow;
    const sequenceOfLabels = this.sequenceOfLabels;
    if (sequenceOfLabels.length > 0) {
      switch(label){
        case 'B': return (sequenceOfLabels.match(/B/g)) ? sequenceOfLabels.match(/B/g).length : 0; break;
        case 'G': return (sequenceOfLabels.match(/G/g)) ? sequenceOfLabels.match(/G/g).length : 0; break;
        case 'F': return (sequenceOfLabels.match(/F/g)) ? sequenceOfLabels.match(/F/g).length : 0; break;
      }
    } else {
      return 0;
    }
  }

  getLongestSequence(label) {
    const sequenceOfLabels = this.sequenceOfLabels;
    let searchForSequence = true;
    let maxLength = 0;
    let currentLength = 0;

    for (let i = 0; i < sequenceOfLabels.length; i++){
      if (!searchForSequence){
        if (sequenceOfLabels[i] == label){
          currentLength++;
          searchForSequence = true;
        }
      } else {
        if (sequenceOfLabels[i] == label){
          currentLength++;
        } else {
          if (currentLength > maxLength) maxLength = currentLength;
          currentLength = 0;
          searchForSequence = false;
        }
      }
    }
    return maxLength;
  }

}

module.exports = FeatureCollector;
