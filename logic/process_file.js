const fs = require('fs');
const readline = require('readline');
const stream = require('stream');

const streamOptions = {};

// TODO: implement Promises
const processFile = function() {

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
	return arrayOfLines;
    });

    return "";

}

exports.process = processFile;
