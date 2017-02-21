class Window {

  constructor(startId, sequenceOfLabels) {
    this.startId = startId; // the key (in the logNodeHashmap) of the Log at the beginning of this Window
    this.sequenceOfLabels = sequenceOfLabels; // the sequence of Log labels
    this.label = ''; // the label for this Window
    this.featureHashmap = {}; // the map of features for this Window
  }

  // returns the sequence of Log labels inside this Window
  getSequence() {
    return this.sequenceOfLabels;
  }

  // returns the key (in the logNodeHashmap) of the Log at the beginning of this Window
  getStartId() {
    return this.startId;
  }

  // returns the label for this Window
  getLabel() {
    return this.label;
  }

  // sets the label for this Window
  setLabel(label) {
    this.label = label;
  }

  // stores a feature and its value in the feature hashmap
  setFeature(featureName, featureValue) {
    this.featureHashmap[featureName] = featureValue;
  }

  // gets the value of a feature from the feature hashmap
  getFeature(featureName) {
    return this.featureHashmap[featureName] || 0;
  }

}

module.exports = Window;
