const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const async = require('async');
const log4js = require('log4js');

const Util = require('./Util.js'); // contains meta data
log4js.configure({
  appenders : [
    { type : 'console', category : 'PRE' }
  ]
});
const logger = log4js.getLogger('PRE');
const LogNode = require('./LogNode.js'); // used to store meta information for each log line in the log file
const Window = require('./Window.js');
const lineClassifier = require(Util.LINE_CLASSIFIER); // used to assign labels to data that will be used for training classifier
const filePathTest = Util.LOG_FILE_PATH;

// GLOBAL VARIABLES
let hashMapKeyCounter = 1;
let arrayOfSoftLockups = [];

/**
*  Reads logs from a specified log file and returns an Object containing the training data that can be used to train a classifier.
*
*  @param  {String}
*  @return {Object} Object
*/
const preprocessor = (logFilePath) => {

  return new Promise( (resolve, reject) => {

    fs.stat(logFilePath, (err) => {
      if (err) throw new Error(LOG_NAME + "File cannot be found at specified log file path");

      const instream = fs.createReadStream(logFilePath);
      const outstream = new stream;
      const readLine = readline.createInterface(instream, outstream);

      logger.trace("Entering preprocessing module.");

      let logNodeHashmap = {}; // will hold all the LogNodes created for each line in the log file
      let arrayOfWindows = [];

      // Reads in a single line from the log file, creates a LogNode and pushes it to an array containing all the LogNodes
      readLine.on('line', (line) => {
        let timestamp =  getTimeStamp(line);
        let logNode = new LogNode(hashMapKeyCounter, line, timestamp);
        //console.log(logNode);
        logNodeHashmap[hashMapKeyCounter++] = logNode;
      });

      readLine.on('close', () => {
        logger.trace("Finished reading from log file.");
        logger.info("Number of lines read: " + Object.keys(logNodeHashmap).length);

        applyClassification(logNodeHashmap)
        .then ( (arrayOfSoftLockups) => {
          //hashmapWithLabels = classificationResult.hashmap;
          // console.log(logNodeHashmap);
          console.log(arrayOfSoftLockups);
          return findBadWindows(arrayOfSoftLockups, logNodeHashmap, arrayOfWindows);
        })
        .then ( (arrayOfWindows) => {
          logger.info("arrayOfWindows: ");
          console.log(arrayOfWindows);
          //console.log(arrayOfWindows[175366]);
          //console.log(_.find(arrayOfWindows, (window) => { return window.label === 'B_WINDOW'; }));
        })
        .error ( (err) => {
          //console.log(LOG_NAME + err);
        })

        resolve(logNodeHashmap);
      });

      readLine.on('error', (err) => {
        logger.error("Error whilst reading log file.");
      })
    });

  });

};

const findBadWindows
 = (arrayOfSoftLockups, logNodeHashmap, arrayOfWindows) => {
  //console.log(LOG_NAME + "Beginning search for windows.");
  return new Promise( (resolve, reject) => {
    const numOfSoftLocks = arrayOfSoftLockups.length;

    // TODO: Maybe use async here to speed things up
    for (let x = numOfSoftLocks - 1; x >= 0; x--){
      let mNodeIndex = arrayOfSoftLockups[x];
      let fNode = logNodeHashmap[mNodeIndex];
      let fNodeTS = fNode.timestamp;
      let sequenceOfLabels = fNode.label;
      let stopSearch = false;

      for (let y = mNodeIndex - 1; (y >= 1) && (!stopSearch); y--){
        let sNode = logNodeHashmap[y];
        let sNodeTS = sNode.timestamp;
        let timeDiff = moment.duration(fNodeTS.diff(sNodeTS)).asHours();
        if (timeDiff > 3){
          let lastNodeOfWindow = logNodeHashmap[y+1];
          let windowLabel = (lastNodeOfWindow.label === 'G') ? 'G_WINDOW' : 'B_WINDOW';
          let logWindow = new Window(mNodeIndex, sequenceOfLabels, windowLabel);
          arrayOfWindows.push(logWindow);
          stopSearch = true;
          //if (windowLabel == 'B_WINDOW') console.log(LOG_NAME + "BAD WINDOW");
          //console.log(logWindow);
        } else {
          sequenceOfLabels += sNode.label;
        }
      }
    }
    //console.log(LOG_NAME + "Finished search for windows.");
    resolve(arrayOfWindows);
  });
}

const applyClassification = (logNodeHashmap) => {
  logger.trace("Applying classification to logs.");
  return new Promise ( (resolve, reject) => {
    async.each(logNodeHashmap, getLogClassification, (err) => {
      if (err){
        logger.error("Error assigning class to log nodes.");
      } else {
        logger.trace("Successfully assigned class to log nodes.");
        resolve(arrayOfSoftLockups);
      }
    });
  });
}

const getLogClassification = (logNode, callback) => {
  setTimeout( () => {
    const result = lineClassifier.classifyLogLine(logNode);
    const softLockupNodeId = result.nodeId;
    const error = result.error;
    if (!error){
      if (softLockupNodeId)
        arrayOfSoftLockups.push(softLockupNodeId);
      callback();
    } else {
      callback('Error');
    }
  }, 1000);
}

/**
*  Takes an input log string and extracts the date and time.
*  Expected format is: MMM D(D) HH:mm:ss
*  It handles single and double digit days
*
*  @param {String} line  Full log message
*  @return {Moment} Returns the datetime as a moment object (or null if there is no date or there is an incorrect format)
*
*/
const getTimeStamp = (line) => {
  const timestamp = line.match(/[A-Z][a-z]{2}\s\d+\s\d{2}:\d{2}:\d{2}/);
  if (timestamp !== null) return moment(timestamp[0], "MMM D HH:mm:ss");
  else return null;
}

preprocessor(filePathTest);

exports.preprocess = preprocessor;
