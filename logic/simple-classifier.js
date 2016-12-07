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

// const classify = (line) => {
//
//   let label = 'G';
//   const arrayOfWords = cleanLine(line);
//
//   _.forEach(arrayOfWords, (word) => {
//     if (_.indexOf(negativeWords, _.lowerCase(word)) > -1) {
//       label = 'B';
//       return label;
//     }
//   });
//
//   return label;
//
// };

const classify = (arrayOfLines) => {

  async.each(arrayOfLines, (line, callback) => {
    let label = 'G';
    const arrayOfWords = cleanLine(line);

    _.forEach(arrayOfWords, (word) => {
      if (_.indexOf(negativeWords, _.lowerCase(word)) > -1) {
        label = 'B';
      }
    });
    console.log("Label: " + label);
    callback(label, null);

  }, (result, err) => {
    if (err) {
      console.log('Couldn\'t label log lines');
    } else {
      console.log("Labelling completed");
    }
  });

};

const cleanLine = (line) => {
  return _.split(_.trim(removeMultipleSpaces(line)), ' ', line.length);
}

const removeMultipleSpaces = (line) => {
  return line.replace(/\s+/g, ' ');
};

exports.getClassification = classify;
