const express = require('express');
const router = express.Router();
const bayes = require('../logic/naive-bayes');
const processFile = require('../logic/process_file');

router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/getMessage', function(req, res, next) {
    const message = bayes.getJson();
    processFile.process.then(function(data){
		res.send(data);
	});
});

module.exports = router;
