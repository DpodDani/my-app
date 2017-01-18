const fs = require('fs');
const _ = require('lodash');
const readline = require('readline');
const stream = require('stream');
const async = require('async');
const Util = require('./Util.js');

const negativeWords = [
  'error',
  'failed',
];


// TODO: Swap forEach for async.each
const classify = (logNode) => {
  let label = 'G';
  const arrayOfWords = cleanLine(logNode.message);
  //const test = logNode.message.replace(/\s+/g, ' ');

  _.forEach(arrayOfWords, (word) => {
    _.forEach(negativeWords, (negativeWord) => {
      if (word.toLowerCase().includes(negativeWord)){
        label = 'B';
      }
      if (word.toLowerCase().includes("lockup")) label = 'F'
    });
    // if (_.indexOf(negativeWords, _.lowerCase(word)) > -1) {
    //   label = 'B';
    // }
  });
  //console.log("Label: " + label);
  logNode.label = label;
  if (label === 'F') return {"error" : false, "nodeId" : logNode.id};
  else return {'error' : false, "nodeId" : null};
};

const cleanLine = (line) => {
  return _.split(_.trim(removeMultipleSpaces(line)), ' ', line.length);
}

const removeMultipleSpaces = (line) => {
  return line.replace(/\s+/g, ' ');
};

exports.classifyLogLine = classify;
