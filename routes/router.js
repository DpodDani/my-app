const express = require('express');
const router = express.Router();
const bayes = require('../logic/naive-bayes');
const processFile = require('../logic/process_file');
const decisionTree = require('../logic/decision_tree.js');

router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/getMessage', function(req, res, next) {
  processFile.process().then(function(data){
	   res.send(data);
  });
});

module.exports = router;
