class Window {

  constructor(nodeId, sequenceOfLabels, noOfGs, noOfBs, noOfFs,label) {
    this.nodeId = nodeId;
    this.sequenceOfLabels = sequenceOfLabels;
    this.noOfGs = noOfGs;
    this.noOfBs = noOfBs;
    this.noOfFs = noOfFs;
    this.label = label;
  }

  getLabelFreq(labelName) {
    switch(labelName){
      case 'B': return this.noOfBs; break;
      case 'G': return this.noOfGs; break;
      case 'F': return this.noOfFs; break;
    }
  }

  getLabelCertainty() {
    if (this.label == 'G_WINDOW') {
      return ((this.noOfGs / (this.noOfGs + this.noOfBs + this.noOfFs)) * 100).toFixed(1) + "%";
    } else if (this.label == 'B_WINDOW') {
      return ((this.noOfBs / (this.noOfGs + this.noOfBs + this.noOfFs)) * 100).toFixed(1) + "%";
    } else {
      return 0;
    }
  }

  getSequence() {
    return this.sequenceOfLabels;
  }

  getNodeId() {
    return this.nodeId;
  }

  getWindowLabel() {
    return this.label;
  }

}

module.exports = Window;
