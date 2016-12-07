const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');

const Util = require('./Util.js');
const classify = require('./simple-classifier.js');

const util = new Util();
const mar01 = util.getLogPaths().Mar01;
const test = util.getLogPaths().test;

const processFile = function() {

    return new Promise(function(resolve, reject) {
		const instream = fs.createReadStream(__dirname + test);
		const outstream = new stream;
		const readLine = readline.createInterface(instream, outstream);

		console.log("Inside processing file");

		let arrayOfLines = [];

		readLine.on('line', (line) => {
			arrayOfLines.push(line);
			console.log(classify.getClassification(line));
		});

		readLine.on('close', () => {
			console.log("Finished reading file");
			resolve(arrayOfLines);
		});

    });

};

exports.process = processFile;
