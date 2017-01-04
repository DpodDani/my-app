const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');
const _ = require('lodash');
const moment = require('moment');
const async = require('async');

const Util = require('./Util.js');
const LogNode = require('./LogNode.js');
const lineClassifier = require('./line-classifier.js');
const LOG_NAME = 'PRE: ';

const util = new Util();
const mar01 = util.getLogPaths().Mar01;
const test = util.getLogPaths().test;
let counter = 1;

/** TODO
 *  Reads logs from a specified log file and returns an Object containing the training data that can be used to train a classifier.
 *
 *  @param  {String}
 *  @return {Object} Object
 */
const preprocessor = (logFilePath) => {

    return new Promise(function(resolve, reject) {
		const instream = fs.createReadStream(__dirname + logFilePath);
		const outstream = new stream;
		const readLine = readline.createInterface(instream, outstream);

		console.log("Inside processing file");

		let arrayOfLogNodes = {};

    // Reads in a single line from the log file, creates a LogNode and pushes it to an array containing all the LogNodes
		readLine.on('line', (line) => {
      let timestamp =  getTimeStamp(line);
      let logNode = new LogNode(counter++, line, timestamp);
      //console.log(logNode);
			arrayOfLogNodes[counter++] = logNode;
		});

		readLine.on('close', () => {
			console.log("Finished reading file");

      async.each(arrayOfLogNodes, getClassification, function(err){
          if (err){
            console.log(LOG_NAME + "Error assigning class to log nodes");
          } else {
            console.log(LOG_NAME + "Successfully assigned class to log nodes");
          }
      });



			resolve(arrayOfLogNodes);
		});

    });

};

const getClassification = (logNode, callback) => {
  if (lineClassifier.getClassification(logNode)) callback();
  else callback('Error');
}

const getArrayOfWindows = (logNode) => {



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

preprocessor(test);

exports.preprocess = preprocessor;
