const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');
const moment = require('moment');
const ml = require('machine_learning');
const json2csv = require('json2csv');

const log4js = require('log4js');
log4js.configure(
  {
    appenders : [
      {type:'console',category:'PRE'},
      {type:'console',category:'NB'}
    ]
  }
);
const logUpdate = require('log-update')

const Util = require('./Util.js');
const logger = log4js.getLogger('PRE');
const LogNode = require(Util.LOG_NODE);
const Window = require(Util.WINDOW);
const LineClassifier = require(Util.LINE_CLASSIFIER);
// const NaiveBayes = require(Util.NAIVEBAYES);

const DEFAULT_WINDOW_SIZE = 2;

// TODO: Implement algorithm for classifying windows (by majority of particular label)

class Preprocessor {

  constructor(options) {
    this.logNodeHashmap = options.logNodeHashmap || {}; // stores LogNodes for each log line in log file
    logger.error("Size of lognodehashmap: " + Object.keys(this.logNodeHashmap).length);
    this.arrayOfSoftLockups = options.arrayOfSoftLockups|| []; // stores LogNode IDs where a soft lockup occurred
    this.arrayOfWindows = options.arrayOfWindows || []; // stores Windows generated from the log file(s)
    this.windowSize = options.windowSize || DEFAULT_WINDOW_SIZE;
    this.logFilePath = options.logFilePath || Util.FILE_PATH_TEST;
    this.hashMapKeyCounter = options.counterStart || 1;
    this.arrayOfSoftLockups = options.arrayOfSoftLockups || [];
    this.noOfLogs = options.noOfLogs || 0;
    logger.trace("Successfully initialised Preprocessor");
  }

  /**
   *  Reads from a log file and creates a LogNode for each log line, which are then stored inside a hashmap.
   *
   *  @return {Promise}  Returns a Promise which resolves the hashmap of LogNodes
   */
  createLogNodeHashmap() {

    return new Promise( (resolve, reject) => {

      const logFilePath = this.logFilePath;

      fs.stat(logFilePath, (err) => {
        if (err) logger.err("Could not read file");
        else logger.trace("Creating LogNode hashmap");

        const instream = fs.createReadStream(logFilePath);
        const outstream = new stream;
        const readLine = readline.createInterface(instream, outstream);
        const lineClassifier = new LineClassifier();

        // Creates an LogNode for the log line being read from the log file
        // Line labelling is handled by the line classifier
        readLine.on('line', (line) => {
          let logNode = lineClassifier.createLogNode(line, this.hashMapKeyCounter);
          if (logNode.getLabel() === 'F') this.arrayOfSoftLockups.push(this.hashMapKeyCounter);
          this.logNodeHashmap[this.hashMapKeyCounter++] = logNode;
        });

        readLine.on('close', () => {
          logger.trace("Finished reading file and populating hashmap");
          this.noOfLogs = Object.keys(this.logNodeHashmap).length;
          logger.info("Number of LogNodes: " + this.noOfLogs);
          logger.info("Array of soft lockups: " + this.arrayOfSoftLockups.length);
          logger.trace("Reversing hashmap");
          logger.trace("Hashmap has been reversed");

          // // displays the timestamps of the soft lockups
          // for (let x = 0; x < this.arrayOfSoftLockups.length; x++){
          //   console.log(this.logNodeHashmap[this.arrayOfSoftLockups[x]].getTimestamp());
          // }

          resolve(this.logNodeHashmap);
        });

      });

    });
  }

  /**
   *  Iterates through the hashmap and "extracts" windows of LogNodes.
   *
   *  @return {Array}
   */
  getArrayOfWindows() {

    logger.trace("Now obtaining windows of size: " + this.windowSize + " hours");

    let arrayOfWindows = [];
    const windowSize = this.windowSize;

    return new Promise( (resolve, reject) => {

      for (let index = 1; index <= this.noOfLogs; index++){
        let result = this.collectWindows(index);
        arrayOfWindows.push(new Window(
          result.startIndex,
          result.sequenceOfLabels,
          result.noOfGs,
          result.noOfBs,
          result.noOfFs,
          (result.noOfGs > result.noOfBs) ? 'G_WINDOW' : 'B_WINDOW'
        ));
        index = result.lastNodeIndex;
      }
      logger.info("Number of windows: " + arrayOfWindows.length);

      this.arrayOfWindows = arrayOfWindows;
      resolve(arrayOfWindows);
    });

  }

  /**
   *  Iterates through the hashmap from the starting index provided in the argument and returns a single window of size specified by the windowSize variable.
   *
   *  @return {Integer} The starting index of the window
   */
  collectWindows(startIndex) {

    //logger.trace("Collecting windows of size: " + this.windowSize);

    let startNode = this.logNodeHashmap[startIndex];
    let startTime = startNode.getTimestamp();
    let newStart = startIndex; // used in case an F appears and readjusts the starting point of the window
    let sequenceOfLabels = startNode.getLabel();
    let secondarySequence = ''; // once an F is encountered, any further occurrences of Fs will result in some deletion from the sequence of labels
    let stopSearch = false;
    let noOfBs = 0;
    let noOfGs = 0;
    let noOfFs = 0;
    let seenF = false;

    for (let index = startIndex; index <= this.noOfLogs && !stopSearch; index++){
      logUpdate("Progress: " + ((index/this.noOfLogs) * 100).toFixed(1) + "%");
      let nextNode = this.logNodeHashmap[index];
      let label = nextNode.getLabel();

      if (startNode.getTimeDifference(nextNode) > this.windowSize) {
        stopSearch = true;
      } else {
        if (seenF) secondarySequence += label;
        else sequenceOfLabels += label;
        if (label === 'F') {
          // if an F appears (and has NOT been previously seen), the window algorithm restarts at the F node and begins to look for a Window from this point onwards
          if (!seenF){
            sequenceOfLabels = label;
            startNode = nextNode;
            newStart = index;
          }
          secondarySequence = '';
          seenF = true;
        }
        startIndex++;
      }
    }

    sequenceOfLabels += secondarySequence;
    noOfBs = (sequenceOfLabels.match(/B/g)) ? sequenceOfLabels.match(/B/g).length : 0;
    noOfGs = (sequenceOfLabels.match(/G/g)) ? sequenceOfLabels.match(/G/g).length : 0;
    noOfFs = (sequenceOfLabels.match(/F/g)) ? sequenceOfLabels.match(/F/g).length : 0;

    return {
      "startIndex" : newStart,
      "sequenceOfLabels" : sequenceOfLabels,
      "lastNodeIndex" : startIndex,
      "noOfGs" : noOfGs,
      "noOfBs" : noOfBs,
      "noOfFs" : noOfFs
    };
  }

  reverseHashmap() {
    let keys = Object.keys(this.logNodeHashmap);
    let rKeys = keys.reverse();
    let rHashmap = {};
    let counter = 1;

    for (let key in rKeys){
      let index = rKeys[key];
      rHashmap[counter++] = this.logNodeHashmap[index];
    }

    this.logNodeHashmap = rHashmap;
  }

  classifyWindows() {
    return new Promise( (resolve, reject) => {
      const arrayOfWindows = this.arrayOfWindows;

      for (let i = 0; i < arrayOfWindows.length; i++){
        arrayOfWindows[i] = this.getWindowClass(arrayOfWindows[i]);
      }

      this.arrayOfWindows = arrayOfWindows;
      resolve(arrayOfWindows);
    });
  }

  getWindowClass(logWindow) {
    const THRESHOLD = 0.8;
    const noOfBs = logWindow.getLabelFreq('B');
    const noOfGs = logWindow.getLabelFreq('G');
    const noOfFs = logWindow.getLabelFreq('F');
    const windowLabel = ((noOfGs > THRESHOLD * noOfBs) && (noOfFs < 1)) ? 'G_WINDOW' : 'B_WINDOW';
    logWindow.setLabel(windowLabel);
    return logWindow;
  }

  getTrainingData() {
    let TRAINING_DATA = [];
    let LABELS = [];
    for (let i = 0; i < this.arrayOfWindows.length; i++){
      let DATA = [
        this.arrayOfWindows[i].getLabelFreq('B'),
        this.arrayOfWindows[i].getLabelFreq('G'),
        this.arrayOfWindows[i].getLabelFreq('F')
      ];
      TRAINING_DATA.push(DATA);
      LABELS.push(this.arrayOfWindows[i].getLabel());
    }
    return {
      "data" : TRAINING_DATA,
      "result" : LABELS
    };
  }

  printArrayOfWindows() {
    const arrayOfWindows = this.arrayOfWindows;
    for (let i = 0; i < arrayOfWindows.length; i++){
      let noOfFs = arrayOfWindows[i].getLabelFreq('F');
      let noOfBs = arrayOfWindows[i].getLabelFreq('B');
      let noOfGs = arrayOfWindows[i].getLabelFreq('G');
      let startLine = arrayOfWindows[i].getStartId();
      let windowLabel = arrayOfWindows[i].getLabel();
      logger.info("Window containing: (" + noOfFs + ") Fs, (" + noOfGs + ") Gs, (" + noOfBs + ") Bs, labelled: " + windowLabel);
    }
  }

  saveWindowsToCSV() {
    const arrayOfJsonWindows = this.getJsonOfWindows();
    const csv = json2csv({
      data : arrayOfJsonWindows.arrayOfJsonWindows,
      fields : arrayOfJsonWindows.attributeColumns
    });

    fs.writeFileSync("python/window_attr.csv", csv, 'utf8')
    logger.trace("CSV written to file in Python folder");
  }

  getJsonOfWindows() {
    const arrayOfWindows = this.arrayOfWindows;
    const attributeColumns = ['noOfBs', 'noOfGs', 'noOfFs', 'label'];
    const arrayOfJsonWindows = [];

    for (let i = 0; i < arrayOfWindows.length; i++){
      arrayOfJsonWindows.push({
        "noOfBs" : arrayOfWindows[i].getLabelFreq('B'),
        "noOfGs" : arrayOfWindows[i].getLabelFreq('G'),
        "noOfFs" : arrayOfWindows[i].getLabelFreq('F'),
        "label" : (arrayOfWindows[i].getLabel() === 'G_WINDOW') ? 1 : 0
      });
    }
    return {
      "attributeColumns" : attributeColumns,
      "arrayOfJsonWindows" : arrayOfJsonWindows
    };
  }

}


pre = new Preprocessor({"logFilePath" : Util.MAR01_FILE_PATH, "windowSize" : 2});

pre.createLogNodeHashmap()
  .then ( (result) => {
    pre2 = new Preprocessor({"logFilePath" : Util.MAR06_FILE_PATH, "windowSize" : 2, "counterStart" : Object.keys(result).length + 1, "logNodeHashmap" : result});
    return pre2.createLogNodeHashmap();
  })
  .then ( (result2) => {
    pre3 = new Preprocessor({"logFilePath" : Util.MAR09_FILE_PATH, "windowSize" : 2, "counterStart" : Object.keys(result2).length + 1, "logNodeHashmap" : result2});
    return pre3.createLogNodeHashmap();
  })
  .then ( (result3) => {
    pre4 = new Preprocessor({"logFilePath" : Util.MAR11_FILE_PATH, "windowSize" : 2, "counterStart" : Object.keys(result3).length + 1, "logNodeHashmap" : result3});
    return pre4.createLogNodeHashmap();
  })
  .then ( (result4) => {
    pre4.reverseHashmap();
    return pre4.getArrayOfWindows();
  })
  .then ( (arrayOfWindows) => {
    return pre4.classifyWindows();
  })
  .then ( (arrayOfClassifiedWindows) => {

    pre4.saveWindowsToCSV(); // outputs attributes of all windows to a CSV file (which will then be read in by a Python file)

  });

module.exports = Preprocessor;
