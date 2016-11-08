const bayes = require('bayes');

const classifier = bayes();

classifier.learn('amazing, awesome movie!!', 'positive');
classifier.learn('Sweet, this is incredible, amazing, perfect, great!!', 'positive');

classifier.learn('terrible, shitty, Damn, sucks!', 'negative');

const stateJson = classifier.categorize('terrible, shitty, amazing');

exports.getJson = function() {
    return stateJson;
}
