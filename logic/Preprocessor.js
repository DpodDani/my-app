const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');
const moment = require('moment');
const async = require('async');
const log4js = require('log4js');
log4js.configure( { appenders : [{type:'console',category:'PRE'}] } );
const logUpdate = require('log-update')

const Util = require('./Util.js');
const logger = log4js.getLogger('PRE');
const LogNode = require(Util.LOG_NODE);
const Window = require(Util.WINDOW);
const LineClassifier = require(Util.LINE_CLASSIFIER);

const DEFAULT_WINDOW_SIZE = 2;

// TODO: Continue looking for windows after window size has been reached in between 2 Fs
// TODO: Implement algorithm for classifying windows (by majority of particular label)
// TODO: Construct windows in opposite direction to time flow

class Preprocessor {

  constructor(options) {
    this.logNodeHashmap = options.logNodeHashmap || {}; // stores LogNodes for each log line in log file
    this.arrayOfSoftLockups = options.arrayOfSoftLockups|| []; // stores LogNode IDs where a soft lockup occurred
    this.arrayOfWindows = options.arrayOfWindows || []; // stores Windows generated from the log file(s)
    this.windowSize = options.windowSize || DEFAULT_WINDOW_SIZE;
    this.logFilePath = options.logFilePath || Util.FILE_PATH_TEST;
    this.hashMapKeyCounter = options.counterStart || 1;
    this.arrayOfSoftLockups = options.arrayOfSoftLockups || [];
    this.noOfLogs = options.noOfLogs || 0;
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
          let logNode = lineClassifier.createLogNode(line);
          if (logNode.getLabel() === 'F') this.arrayOfSoftLockups.push(this.hashMapKeyCounter);
          this.logNodeHashmap[this.hashMapKeyCounter++] = logNode;
        });

        readLine.on('close', () => {
          logger.trace("Finished reading file and populating hashmap");
          this.noOfLogs = Object.keys(this.logNodeHashmap).length;
          logger.info("Number of LogNodes: " + this.noOfLogs);
          logger.info("Array of soft lockups: " + this.arrayOfSoftLockups.length);

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
          index,
          result.sequenceOfLabels,
          result.noOfGs,
          result.noOfBs,
          result.noOfFs,
          (result.noOfGs > result.noOfBs) ? 'G_WINDOW' : 'B_WINDOW'
        ));
        index = result.lastNodeIndex;
      }
      logger.info("Number of windows: " + arrayOfWindows.length);
      for (let i = 0; i < arrayOfWindows.length; i++){
        if (arrayOfWindows[i].getWindowLabel() === 'B_WINDOW') console.log("Label certainty: " + arrayOfWindows[i].getLabelCertainty());
      }
      // logger.info("Third window: ");
      // logger.info(arrayOfWindows[3]);
      resolve(arrayOfWindows);
    });

  }

  /**
   *  Iterates through the arrayOfSoftLockups to find windows that caused them. It will also find other windows existing between 2 soft lockups
   *
   *  @return {Array} An array of windows of size windowSize
   */
  collectWindows(startIndex) {

    //logger.trace("Collecting windows of size: " + this.windowSize);

    let startNode = this.logNodeHashmap[startIndex];
    let startTime = startNode.getTimestamp();
    let sequenceOfLabels = '';
    let stopSearch = false;
    let noOfBs = 0;
    let noOfGs = 0;
    let noOfFs = 0;

    for (let index = startIndex; index <= this.noOfLogs && !stopSearch; index++){
      logUpdate("Progress: " + ((index/this.noOfLogs) * 100).toFixed(1) + "%");
      let nextNode = this.logNodeHashmap[index];
      let label = nextNode.getLabel();
      sequenceOfLabels += label;
      switch(label){
        case 'B': noOfBs++; break;
        case 'G': noOfGs++; break;
        case 'F': noOfFs++; break;
      }
      if (nextNode.getTimeDifference(startTime) > this.windowSize) stopSearch = true;
      else startIndex++;
    }

    return {
      "sequenceOfLabels" : sequenceOfLabels,
      "lastNodeIndex" : startIndex,
      "noOfGs" : noOfGs,
      "noOfBs" : noOfBs,
      "noOfFs" : noOfFs
    };
  }

}

pre = new Preprocessor({"logFilePath" : Util.MAR06_FILE_PATH, "windowSize" : 1});
pre.createLogNodeHashmap()
  .then ( (result) => {
    return pre.getArrayOfWindows();
  });

module.exports = Preprocessor;
