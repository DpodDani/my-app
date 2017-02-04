const Util = require('./Util.js');
const Preprocessor = require(Util.PREPROCESSOR);

/**
 *  This is the sentiment classifier that will be used to classify windows within log files.
 *  Prerequisite: Preprocess log file to produce a hashmap of LogNodes, obtain array of Windows and then iterate through the Windows and call the necessary functions from this class.
 *
 */
class NaiveBayes {

  constructor(filePath, options) {
    this.options = (options) ? options : {};
    // preprocessor.populateLogNodeHashmap(Util.MAR01_FILE_PATH, {})
    //   .then ( (logNodeHashmap) => {
    //     return preprocessor.populateLogNodeHashmap(Util.MAR06_FILE_PATH, logNodeHashmap);
    //   })
    //   .then ( (logNodeHashmap) => {
    //     return preprocessor.populateLogNodeHashmap(Util.MAR09_FILE_PATH, logNodeHashmap);
    //   })
    //   .then ( (logNodeHashmap) => {
    //     return preprocessor.populateLogNodeHashmap(Util.MAR11_FILE_PATH, logNodeHashmap);
    //   })
    //   .then( (logNodeHashmap) => {
    //     return preprocessor.applyClassification(logNodeHashmap);
    //   })
    //   .then( (resultAfterClassification) => {
    //     const arrayOfSoftLockups = resultAfterClassification.arrayOfSoftLockups;
    //     const logNodeHashmap = resultAfterClassification.logNodeHashmap;
    //     return preprocessor.findBadWindows(arrayOfSoftLockups, logNodeHashmap);
    //   })
    //   .then ( (arrayOfWindows) => {
    //     console.log(arrayOfWindows.length);
    //   });
    // this.logNodeHashmap = preprocessor.getLogNodeHashmap(filePath);
    const path = Util.MAR01_FILE_PATH;
    Preprocessor({logFilePath : path});

    this.mapOfLabels = {}; // map of all labels that have been learnt
    this.totalFreqOfWindows = {}; // total number of windows mapped to each label
    this.freqOfWindow = {}; // frequency of particular window being mapped to particular label
    this.totalWindows = 0; // total number of windows processed
  }

  initialiseLabel(labelName) {
    if(!this.mapOfLabels[labelName]){
      this.mapOfLabels[labelName] = true; // acknowledges existence of this label
      this.totalFreqOfWindows[labelName] = 0; // set total number of windows mapped to this label
      this.freqOfWindow[labelName] = {}; // KEY = window, VALUE = frequency
      return true;
    }
    return false;
  }

  train(logWindow, label) {
    initialiseLabel(label);
    this.totalFreqOfWindows[label]++; // update total number of windows mapped to a particular label
    this.totalWindows++; // update total number of windows we have seen

  }

}

const test = new NaiveBayes(Util.MAR01_FILE_PATH, {});

module.exports = NaiveBayes;
