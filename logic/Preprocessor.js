const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');
const moment = require('moment');
const async = require('async');
const log4js = require('log4js');
log4js.configure( { appenders : [{type:'console',category:'PRE'}] } );

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
          logger.info("Number of LogNodes: " + Object.keys(this.logNodeHashmap).length);
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

    return new Promise( (resolve, reject) => {
      const windowSize = this.windowSize; // in hours
      const noOfSoftLockups = this.arrayOfSoftLockups.length;
      const noOfLogNodes = Object.keys(this.logNodeHashmap).length;

      logger.trace("Getting array of windows of size: " + windowSize + " hours");

      for (let arrayIndex = 0; arrayIndex < noOfSoftLockups; arrayIndex++){
        let primaryIndex = this.arrayOfSoftLockups[arrayIndex];
        let primaryNode = this.logNodeHashmap[primaryIndex];
        // logger.info("Primary index: " + primaryIndex);
        // logger.info("Primary node: " + primaryNode);
        let primaryTime = primaryNode.getTimestamp();
        let sequenceOfLabels = ''; // Does not include the F label
        let stopSearch = false;

        for (let secondaryIndex = primaryIndex + 1; (secondaryIndex <= noOfLogNodes) && (!stopSearch); secondaryIndex++){
          let secondaryNode = this.logNodeHashmap[secondaryIndex];
          let secondaryTime = secondaryNode.getTimestamp();
          let timeDiff = moment.duration(secondaryTime.diff(primaryTime)).asHours();

          if (timeDiff > windowSize){
            // label window
            let logWindow = new Window(primaryIndex, sequenceOfLabels/*, SOME LABEL */)
            this.arrayOfWindows.push(logWindow);
            if (secondaryTime < ) stopSearch = true;
          } else {
            if (secondaryNode.getLabel() === 'F'){
              sequenceOfLabels = '';
              arrayIndex++;
            } else {
              sequenceOfLabels += secondaryNode.getLabel();
            }
          }

        }

      }
      logger.trace("Windows found: " + this.arrayOfWindows.length);
      logger.info(this.arrayOfWindows);
      resolve(this.arrayOfWindows);
    });

  }

}

pre = new Preprocessor({"logFilePath" : Util.MAR11_FILE_PATH, "windowSize" : 0.3});
pre.createLogNodeHashmap()
  .then ( (result) => {
    return pre.getArrayOfWindows();
  });

module.exports = Preprocessor;
