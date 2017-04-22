// This will be called in an Async forEach scope
// Will collect features for each logWindow that is passed down into it
class FeatureCollector {

  // This is the Window class
  constructor(logWindow, logWindowId) {
    this.logWindow = logWindow;
    this.sequenceOfLabels = logWindow.getSequence();
    this.logWindowId = logWindowId;
  }

  startCollection() {
    let logWindow = this.logWindow;

    // TODO: Get all subsequences from Window and label them with an "order"
    // Track their length as well
    return new Promise( (resolve, reject) => {
      // calls all the feature collection functions
      const bSubsequencesInfo = this.getSubsequencesInfo('B');
      const gSubsequencesInfo = this.getSubsequencesInfo('G');
      logWindow.setFeature('noOfBs', this.getLabelFreq('B'));
      logWindow.setFeature('noOfGs', this.getLabelFreq('G'));
      logWindow.setFeature('noOfFs', this.getLabelFreq('F'));
      logWindow.setFeature('longestSeqOfBsDistanceFromF', bSubsequencesInfo.longestSeqDistanceFromF);
      logWindow.setFeature('longestSeqOfGsDistanceFromF', gSubsequencesInfo.longestSeqDistanceFromF);
      logWindow.setFeature('closestSeqOfGsToF', gSubsequencesInfo.distanceOfClosestSeq);
      logWindow.setFeature('closestSeqOfBsToF', bSubsequencesInfo.distanceOfClosestSeq);

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

  getSubsequencesInfo(label) {
    const sequenceOfLabels = this.sequenceOfLabels;
    let searchForSequence = true;
    let indexOfMaxSeq = 0;
    let maxLength = 0;
    let currentLength = 0;
    let foundClosestSeq = false;
    let indexOfClosestSeq = 0;

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
          if (currentLength > maxLength){
            maxLength = currentLength;
            indexOfMaxSeq = i - currentLength;
          }
          if (!foundClosestSeq && currentLength > 1) { // TEST THIS
            indexOfClosestSeq = i - currentLength;
            foundClosestSeq = true;
          }
          currentLength = 0;
          searchForSequence = false;
        }
      }
    }

    return {
      "longestSeqDistanceFromF" : (sequenceOfLabels[0] === 'F') ? indexOfMaxSeq : 0,
      "distanceOfClosestSeq" : (sequenceOfLabels[0] === 'F') ? indexOfClosestSeq : 0
    }

    //return (sequenceOfLabels[0] === 'F') ? indexOfMaxSeq : 0;
  }

}

module.exports = FeatureCollector;
