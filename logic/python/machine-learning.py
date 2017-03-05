#!/usr/bin/env python

import pandas as pd
import numpy as np
import os
from sklearn import preprocessing#, tree, svm, naive_bayes
from sklearn import model_selection
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.model_selection import cross_val_score

dirname = os.path.dirname(os.path.abspath(__file__))

# TODO: Large standard deviation could be due to inbalance

def main():
    log_windows = pd.read_csv(dirname + '/window_attr.csv', header = 0)

    # Obtain labels and delete it from log window DataFrame
    window_labels = log_windows['label']
    del log_windows['label']

    # Standardise the data
    scalar = preprocessing.StandardScaler().fit(log_windows)
    scaled_windows = scalar.transform(log_windows)

    # PREPARE MODEL
    models = []
    models.append(('DT', DecisionTreeClassifier()))
    models.append(('NB', GaussianNB()))
    models.append(('SVM', SVC()))

    # EVALUATE EACH MODEL IN TURN
    seed = 7
    results = []
    names = []
    scoring = 'roc_auc'
    for name, model in models:
        kfold = model_selection.KFold(n_splits=10, random_state=seed)
        cv_results = model_selection.cross_val_score(model, log_windows, window_labels, cv=kfold, scoring=scoring)
        results.append(cv_results)
        names.append(name)
        msg = "%s: %f (%f)" % (name, cv_results.mean(), cv_results.std())
    	print(msg)

    fig = plt.figure()
    fig.suptitle('Algorithm Comparison')
    ax = fig.add_subplot(111)
    plt.boxplot(results)
    ax.set_xticklabels(names)
    plt.show()

    # Fitting the model
    # clf.fit(scaled_windows, window_labels)
    #
    # # Cross validation score
    # scores = cross_val_score(clf, log_windows, window_labels, cv=10)
    # print ('Scores: ', scores)
    # print("Accuracy: %0.2f (+/- %0.2f)" % (scores.mean(), scores.std() * 2))

    # 1056,592,1,1244,325
    # 29315,120543,0,0,0
    # 865,905,0,0,0
    # 1512,1602,0,0,0
    # 2085,1411,0,0,0
    # 1126,3562,0,0,0
    # 512,450,0,0,0
    # 550,521,0,0,0
    # 767,441,0,0,0
    # 831,707,0,0,0
    # 205,148,1,5,98
    # 900,918,0,0,0
    # 1010,1011,0,0,0
    # 529,405,0,0,0
    # 16604,91071,1,13185,1235
    # 6248,51401,0,0,0

    # Obtaining attributes from training dataset (for testing)
    # index = 19
    # b = log_windows['noOfBs']
    # noOfBs = b[index]
    # g = log_windows['noOfGs']
    # noOfGs = g[index]
    # f = log_windows['noOfFs']
    # noOfFs = f[index]
    # b2 = log_windows['longestSeqOfBs']
    # longestSeqOfBs = b2[index]
    # g2 = log_windows['longestSeqOfGs']
    # longestSeqOfGs = g2[index]

    # # Predicting the class of a sample
    # new_values = [[1056,592,1,1244,325]]
    # scaled_new_values = scalar.transform(new_values)
    # result = clf.predict(scaled_new_values)
    #
    # print log_windows['noOfBs'].describe(), "\n"
    # print "Unscaled new values: ", new_values
    # print "Scaled new values: ", (scaled_new_values, "\n")
    # print ("Result: ", result)

if __name__ == "__main__":
    main()
