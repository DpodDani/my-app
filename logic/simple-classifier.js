const fs = require('fs');
const _ = require('lodash');
const readline = require('readline');
const stream = require('stream');
const async = require('async');
const Util = require('./Util.js');

const negativeWords = [
  'error',
  'failed',
  'error_address'
];

const classify = (line) => {

  let label = 'G';
  const arrayOfWords = cleanLine(line);

  _.forEach(arrayOfWords, (word) => {
    if (_.indexOf(negativeWords, _.lowerCase(word)) > -1) {
      label = 'B';
      return label;
    }
  });

  return label;

};

const cleanLine = (line) => {
  return _.split(_.trim(removeMultipleSpaces(line)), ' ', line.length);
}

const removeMultipleSpaces = (line) => {
  return line.replace(/\s+/g, ' ');
};

exports.getClassification = classify;
