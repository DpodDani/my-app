const fs = require('fs');
const readline = require('readline');
const stream = require('stream');
const Promise = require('bluebird');

const streamOptions = {
	start: 0,
	end: 100
};

// TODO: implement Promises
const processFile = new Promise(function(resolve, reject) {

	const instream = fs.createReadStream(__dirname + '/../public/files/Mar01', streamOptions);
    const outstream = new stream;
    const readLine = readline.createInterface(instream, outstream);

    console.log("Inside processing file");

    let arrayOfLines = [];

    readLine.on('line', (line) => {
		arrayOfLines.push(line);
    });

    readLine.on('close', () => {
		console.log("Finished reading file");
		resolve(arrayOfLines);
    });

});

exports.process = processFile;
