const _ = require('lodash');
const Promise = require('bluebird');

const id3DecisionTree = function (trainingData, category, features) {

	// Obtain an array of the unique classifications that the logs can be classified into
	const classifications = _.uniq(_.map(trainingData, category));

	if (classifications.length == 1) {
		console.log("End node! " + classifications[0]);
		return {type: "result", value: classifications[0], name: classifications[0], alias: classifications[0]+randomTag()};
	}

	if (features.length == 0) {
		console.log("Returning most dominant feature!");
		const topClass = mostCommon(_.map(trainingData, category));
		return {type:"result", val: topClass, name: topClass, alias: topClass+randomTag()};
	}

	const bestFeature = maxGain(trainingData, category, features);
	const remainingFeatures = _.without(features, bestFeature);
	const possibleValues = _.uniq(_.map(trainingData, bestFeature));
	console.log("Node for " + JSON.stringify(bestFeature));
	let node = {
		name: bestFeature,
		alias: bestFeature + randomTag()
	};
	node.type = "feature";
	node.values = _.map(possibleValues, function(v) {
		console.log("Creating branch for: " + JSON.stringify(v));
		const newS = _.filter(trainingData, function(x) {return x[bestFeature] == v});
		let childNode = {name: v, alias: v + randomTag(), type: "feature_value"};
		childNode.child = id3DecisionTree(newS, category, remainingFeatures);
		return childNode;
	});

	return node;

}

const mostCommon = function(l) {
	return _.sortBy(l, function(a) {
		return count(a, l);
	}).reverse()[0];
}

const count = function(a, l) {
	return _.filter(l, function(b) {return b === a}).length;
}

//const predict = function(

const randomTag = function() {
	return "_r" + Math.round(Math.random()*100000).toString();
}

// Returns an array of strings consisting in a single line from the log file
const getArrayOfStrings = function(logString) {
	return _.split(logString, ' ', logString.length);
}

// TODO: Complete after completion of entropy()
const infoGain = function(trainingData, category, feature) {
	// Obtain values of a particular feature from every line
	const values = _.uniq(_.map(trainingData, feature));
	const setEntropy = entropy(_.map(trainingData, category));
	const setSize = trainingData.length;
	const entropies = values.map(function(n){
		const subset = _.filter(trainingData, function(x) { return x[feature] === n } );
		return (subset.length/setSize) * entropy(_.map(subset, category));
	});
	const sumOfEntropies = entropies.reduce(function(x, y) { return x + y }, 0);
	return setEntropy - sumOfEntropies;
}

const maxGain = function(trainingData, category, features) {
	console.log("FEATURES: " + features);
	return _.max(features, function(e){ return infoGain(trainingData, category, e); });
}

// Computes probability of an attribute value (from array of all attribute values of all rows)
const valueProb = function(value, arrayOfAllValues) {
	// Counts how many times a particular value appears in all the rows
	const valueOccurrence = _.filter(arrayOfAllValues, function(x) { return x === value });
	const total = arrayOfAllValues.length;
	return valueOccurrence / total;
}

const entropy = function(arrayOfAllValues) {
	const uniqueValues = _.uniq(arrayOfAllValues);
	const probOfUniqueValues = uniqueValues.map(function(x) { return valueProb(x, arrayOfAllValues) });
	// Uses Shannon's entropy
	const entropyOfUniqueValues = probOfUniqueValues.map(function(p) { return -p * Math.log2(p); });
	// Returns the sum of the entropies of the unique values for a particular arrayOfAllValues
	return entropyOfUniqueValues.reduce(function(x, y) { return x + y }, 0);
}

module.exports = id3DecisionTree;
