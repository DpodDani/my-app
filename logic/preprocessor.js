const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const async = require('async');

const Util = require('./Util.js'); // contains meta data
const LogNode = require('./LogNode.js'); // used to store meta information for each log line in the log file
const Window = require('./Window.js');
const lineClassifier = require(Util.LINE_CLASSIFIER); // used to assign labels to data that will be used for training classifier
const LOG_NAME = 'PRE: ';

//const filePathTest = Util.FILE_PATH_TEST;
const filePathTest = Util.LOG_FILE_PATH;
let hashMapKeyCounter = 1;
let arrayOfSoftLockups = [];

/** TODO
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

      console.log(LOG_NAME + "Inside processing file.");

      let logNodeHashmap = {}; // will hold all the LogNodes created for each line in the log file

      // Reads in a single line from the log file, creates a LogNode and pushes it to an array containing all the LogNodes
      readLine.on('line', (line) => {
        let timestamp =  getTimeStamp(line);
        let logNode = new LogNode(hashMapKeyCounter, line, timestamp);
        //console.log(logNode);
        logNodeHashmap[hashMapKeyCounter++] = logNode;
      });

      readLine.on('close', () => {
        console.log(LOG_NAME + "Finished reading file.");

        applyClassification(logNodeHashmap)
        .then ( (arrayOfSoftLockups) => {
          //hashmapWithLabels = classificationResult.hashmap;
          // console.log(logNodeHashmap);
          console.log(arrayOfSoftLockups);
          return findBadWindows(arrayOfSoftLockups, logNodeHashmap);
        })
        .then ( (arrayOfWindows) => {
          console.log("arrayOfWindows: ");
          //console.log(arrayOfWindows[175366]);
          //console.log(_.find(arrayOfWindows, (window) => { return window.label === 'B_WINDOW'; }));
        })
        .error ( (err) => {
          console.log(LOG_NAME + err);
        })

        resolve(logNodeHashmap);
      });

      readLine.on('error', (err) => {
        console.log(LOG_NAME + "Error whilst reading log file.");
      })
    });

  });

};

const findBadWindows
 = (arrayOfSoftLockups, logNodeHashmap) => {
  console.log(LOG_NAME + "Beginning search for windows.");
  return new Promise( (resolve, reject) => {
    const numOfSoftLocks = arrayOfSoftLockups.length;
    let arrayOfWindows = [];

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
          arrayOfWindows.push(new Window(mNodeIndex, sequenceOfLabels, windowLabel));
          stopSearch = true;
        } else {
          sequenceOfLabels += sNode.label;
        }
      }
    }
    console.log(LOG_NAME + "Finished search for windows.");
    resolve(arrayOfWindows);
  });
}

const applyClassification = (logNodeHashmap) => {
  console.log(LOG_NAME + "Applying classification to logs.");
  return new Promise ( (resolve, reject) => {
    async.each(logNodeHashmap, getLogClassification, (err) => {
      if (err){
        reject(LOG_NAME + "Error assigning class to log nodes.");
      } else {
        console.log(LOG_NAME + "Successfully assigned class to log nodes.");
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
