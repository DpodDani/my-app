const express = require('express');
const router = express.Router();
const bayes = require('../logic/naive-bayes');
const processFile = require('../logic/process_file');

router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/getMessage', function(req, res, next) {
    const message = bayes.getJson();
    const array = processFile.process();
    console.log(array);
    res.send(array);
});

module.exports = router;
