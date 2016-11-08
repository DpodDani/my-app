const express = require('express');
const router = express.Router();
const bayes = require('../logic/naive-bayes');

router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/getMessage', function(req, res, next) {
    const message = bayes.getJson();
    res.send(message);
});

module.exports = router;
