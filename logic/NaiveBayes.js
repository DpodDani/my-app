const Util = require('./Util.js');
const Preprocessor = require(Util.PREPROCESSOR);
//const log4js = require('log4js');
//log4js.configure( { appenders : [{type:'console',category:'NB'}] } );

let logger;

/**
 *  This is the sentiment classifier that will be used to classify windows within log files.
 *  Prerequisite: Preprocess log file to produce a hashmap of LogNodes, obtain array of Windows and then iterate through the Windows and call the necessary functions from this class.
 *
 */
class NaiveBayes {

  // TODO: Set NaiveBayes option object in route.js
  // TODO: Sequence of labels should represent their Window
  /**
   *  Sets up the necessary hashmaps and frequency tables to perform Naive bayes algorithm.
   *
   *  @param  {Object}  options predefined hashmaps and frequency tables can be passed through this object.
   *
   */
  constructor(options) {
    const log4js = options.logger;
    logger = log4js.getLogger('NB');
    // how many times particular Window has been classed as a particular category
    // is of the form --> {<CATEGORY> : {<WINDOW> : <FREQUENCY>}}
    this.winFreqInCategory = options.winFreqInCategory || {};
    // how many windows have been classed as a particular category
    this.countWinInCategory = options.countWinInCategory || {};
    // how many times has a particular Window been seen
    this.windowFreq = options.windowFreq || {};
    // an hashmap of unique categories
    // the value will be used to determine whether this category has been seen before
    this.mapOfCategories = options.mapOfCategories || [];
    // total number of Windows seen
    this.totalWindows = options.totalWindows || 0;
    logger.trace("Successfully initialised Naive Bayes Classifier");
  }

  /**
   *  Initialises the necessary hashmaps and frequency tables for a particular category.
   *
   *  @param  {String}  categoryName  The name of the category to be initiated.
   *
   */
  initialiseCategory(categoryName) {
    // if this category has not been seen before...
    if (!this.mapOfCategories[categoryName]) {
      logger.trace("Initialising a new category");
      // this particular category has been acknowledged (seen)
      this.mapOfCategories[categoryName] = true;
      // initialise the number of windows mapped to this particular category
      this.countWinInCategory[categoryName] = 0;
      // initialise the hashmap containing frequency of different windows mapped to this particular category
      this.winFreqInCategory[categoryName] = {};
    }
  }

  train(logWindow, category) {
    logger.trace("Training with new information");
    this.initialiseCategory(category);
    this.countWinInCategory[category]++; // update total number of windows mapped to a particular category
    this.totalWindows++; // update total number of windows we have seen
    this.updateFreqTable(logWindow, category); // updates frequency table with new information
    logger.trace("Successfully trained with new information");
  }

  updateFreqTable(logWindow, category) {
    const sequenceOfLabels = logWindow.getSequence();

    // update the number of occurrences of particular window
    if(this.windowFreq[sequenceOfLabels])
      this.windowFreq[sequenceOfLabels]++;
    else
      this.windowFreq[sequenceOfLabels] = 1;
    // updates occurrences of particular Window mapped to particular category
    if (this.winFreqInCategory[category][sequenceOfLabels])
      this.winFreqInCategory[category][sequenceOfLabels]++;
    else
      this.winFreqInCategory[category][sequenceOfLabels] = 1;

    logger.info("Number of occurrences of this window: " + this.windowFreq[sequenceOfLabels]);
    logger.info("Total number of windows processed: " + this.totalWindows);
    logger.info("Number of windows mapped to " + category + ": " + this.countWinInCategory[category]);
    logger.info("Number of times this window has been mapped to " + category + ": " + this.winFreqInCategory[category][sequenceOfLabels]);
  }

  /**
   *  Calculates the probability that a particular LogNode label belongs to a particular category (class)
   *
   *  @param  {LogNode}   logNode    LogNode which represents a line in the log file and, most importanly, contains the label for that log line
   *  @param  {String}    category    Either G_WINDOW or B_WINDOW
   *  @return {Float}     probability that a LogNode label belongs to a particular category
   */
  probOfLogNodeInCategory(logNode, category) {
    // how many times particular LogNode label appears in a Window mapped to this particular category
    const logLabelFreq = this.logLabelFreq[category][logNode.getLabel()] || 0;

    // total number of labels mapped to this particular category
    const totalLabelsInCat = this.labelCount[category];

    // Use Laplace Smoothing equation
    return (logLabelFreq + 1) / (totalLabelsInCat + this.labelVocab);
  }

}

module.exports = NaiveBayes;
