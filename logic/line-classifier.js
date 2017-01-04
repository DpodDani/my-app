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

  _.forEach(arrayOfWords, (word) => {
    _.forEach(negativeWords, (negativeWord) => {
      if (word.toLowerCase().includes(negativeWord)){
        label = 'B';
      }
    });
    // if (_.indexOf(negativeWords, _.lowerCase(word)) > -1) {
    //   label = 'B';
    // }
  });
  //console.log("Label: " + label);
  logNode.label = label;
  return true;
};

const cleanLine = (line) => {
  return _.split(_.trim(removeMultipleSpaces(line)), ' ', line.length);
}

const removeMultipleSpaces = (line) => {
  return line.replace(/\s+/g, ' ');
};

exports.getClassification = classify;
