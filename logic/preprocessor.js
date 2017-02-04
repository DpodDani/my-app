const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const async = require('async');
const log4js = require('log4js');

// LOGGER CONFIGURATION
log4js.configure({
  appenders : [
    { type : 'console', category : 'PRE' },
    { type : 'console', category : 'L_CLASSIFIER'}
  ]
});

// JS IMPORTS AND UTILITY INITIALISATIONS
const Util = require('./Util.js'); // contains meta data
const logger = log4js.getLogger('PRE');
const LogNode = require('./LogNode.js'); // used to store meta information for each log line in the log file
const Window = require('./Window.js');
const lineClassifier = require(Util.LINE_CLASSIFIER); // used to assign labels to data that will be used for training classifier
const filePathTest = Util.MAR01_FILE_PATH;

/**
*  Reads logs from a specified log file and returns a hashmap containing LogNode instances for each line of log in the log file..
*
*  @param  {String} logFilePath The path to the log file to be processed
*  @return {Object} A hashmap containing LogNode objects for each line in the log file
*/
const populateLogNodeHashmap = (logFilePath, logNodeHashmap) => {

  return new Promise( (resolve, reject) => {

    fs.stat(logFilePath, (err) => {
      if (err) throw new Error(LOG_NAME + "File cannot be found at specified log file path");

      const instream = fs.createReadStream(logFilePath);
      const outstream = new stream;
      const readLine = readline.createInterface(instream, outstream);

      //let logNodeHashmap = {}; // will hold all the LogNodes created for each line in the log file
      let hashMapKeyCounter = Object.keys(logNodeHashmap).length + 1;
      let arrayOfSoftLockups = [];

      logger.trace("Entering preprocessing module");

      // Reads in a single line from the log file, creates a LogNode and pushes it to an array containing all the LogNodes
      readLine.on('line', (line) => {
        let timestamp =  getTimeStamp(line);
        let jobId = getJobId(line);
        let logNode = new LogNode(hashMapKeyCounter, line, timestamp, jobId, '');
        logNodeHashmap[hashMapKeyCounter++] = logNode;
      });

      readLine.on('close', () => {
        logger.trace("Finished reading from log file");
        logger.info("Number of lines read: " + Object.keys(logNodeHashmap).length);

        // applyClassification(logNodeHashmap, arrayOfSoftLockups)
        // .then ( (arrayOfSoftLockups) => {
        //   logger.info("Length of array of softlock ups: " + arrayOfSoftLockups.length);
        //
        //   // for (let i = 0; i < arrayOfSoftLockups.length; i++){
        //   //   console.log(logNodeHashmap[arrayOfSoftLockups[i]].message);
        //   // }
        //   return findBadWindows(arrayOfSoftLockups, logNodeHashmap);
        // })
        // .then ( (arrayOfWindows) => {
        //   logger.info("Length of array of windows: " + arrayOfWindows.length);
        //   for (let i = 0; i < arrayOfWindows.length; i++){
        //     console.log(arrayOfWindows[i]);
        //   }
        // })

        resolve(logNodeHashmap);
      });

      readLine.on('error', (err) => {
        logger.error("Error whilst reading log file.");
      })
    });

  });

};

const applyClassification = (logNodeHashmap) => {
  logger.trace("Applying classification to logs.");
  return new Promise ( (resolve, reject) => {

    arrayOfSoftLockups = [];

    async.each(logNodeHashmap, (logNode, callback) => {
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
    }, (err) => {
      if (err){
        logger.error("Error assigning class to log nodes");
      } else {
        logger.trace("Successfully assigned class to log nodes");
        resolve({"arrayOfSoftLockups" : arrayOfSoftLockups, "logNodeHashmap" : logNodeHashmap});
      }
    });

  });
}

const findBadWindows
 = (arrayOfSoftLockups, logNodeHashmap) => {
  logger.trace("Beginning search for windows");
  return new Promise( (resolve, reject) => {
    const numOfSoftLocks = arrayOfSoftLockups.length;
    logger.info("Number of Softlockups: " + numOfSoftLocks);
    let arrayOfWindows = [];

    // Iterates through all log nodes that experienced a soft lockup
    for (let x = numOfSoftLocks - 1; x >= 0; x--){
      let mNodeIndex = arrayOfSoftLockups[x];
      let fNode = logNodeHashmap[mNodeIndex];
      let fNodeTS = fNode.getTimestamp();
      let sequenceOfLabels = ''; // Does not include the F label
      let stopSearch = false;

      //logger.info(fNode.getJobId());

      // Iterates through all log nodes in the hashmap
      for (let y = mNodeIndex - 1; (y >= 0) && (!stopSearch); y--){
        let sNode = logNodeHashmap[y];
        let sNodeTS = sNode.getTimestamp();
        let timeDiff = moment.duration(fNodeTS.diff(sNodeTS)).asHours();

        //if (sNode.getLabel() === 'F') logger.info(sNode.getJobId());

        if (timeDiff > 2){
          let lastNodeOfWindow = logNodeHashmap[y+1];
          let windowLabel = (lastNodeOfWindow.getLabel() === 'G') ? 'G_WINDOW' : 'B_WINDOW';
          let logWindow = new Window(mNodeIndex, sequenceOfLabels, windowLabel);
          if (windowLabel === 'B_WINDOW') arrayOfWindows.push(logWindow);
          stopSearch = true; // no need to search continue loop once 3 hour window is exceeded
        } else {
          if (sNode.getLabel() === 'F' && fNode.getJobId() === sNode.getJobId()){
            //logger.trace("Same lockup found!");
            sequenceOfLabels = '';
            x--;
          } else {
            sequenceOfLabels += sNode.getLabel();
          }
        }
      }
    }
    logger.trace("Finished search for windows");
    resolve(arrayOfWindows);
  });
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

const getJobId = (line) => {
  const jobId = line.match(/^\d+/);
  return jobId[0];
}

//populateLogNodeHashmap(filePathTest);
const main = (logFile) => {
  populateLogNodeHashmap(logFile, {})
    .then( (logNodeHashmap) => {
      return applyClassification(logNodeHashmap);
    })
    .then( (resultAfterClassification) => {
      const arrayOfSoftLockups = resultAfterClassification.arrayOfSoftLockups;
      const logNodeHashmap = resultAfterClassification.logNodeHashmap;
      return findBadWindows(arrayOfSoftLockups, logNodeHashmap);
    })
    .then ( (arrayOfWindows) => {
      console.log(arrayOfWindows.length);
    });
}

populateLogNodeHashmap(Util.MAR01_FILE_PATH, {});

exports.populateLogNodeHashmap = populateLogNodeHashmap;
exports.applyClassification = applyClassification;
exports.findBadWindows = findBadWindows;
exports.startProcessing = main;
