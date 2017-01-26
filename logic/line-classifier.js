const fs = require('fs');
const _ = require('lodash');
const readline = require('readline');
const stream = require('stream');
const async = require('async');
const Util = require('./Util.js');
const log4js = require('log4js');
log4js.configure({
  appenders : [
    { type : 'console', category : 'L_CLASSIFIER' }
  ]
});
const logger = log4js.getLogger('L_CLASSIFIER');

const negativeWords = [
  'error',
  'failed',
  'error_exit'
];

const newClassify = (logNode) => {
  let label = 'G';
  let message = logNode.message;

  for (let i = 0; i < negativeWords.length; i++){
    let negativeWord = negativeWords[i];
    if (message.includes(negativeWord)) label = 'B';
  }
  if (message.includes("soft lockup")) label = 'F';

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

exports.classifyLogLine = newClassify;
