import pandas as pd
import numpy as np
import os
from sklearn import preprocessing, tree

dirname = os.path.dirname(os.path.abspath(__file__))
clf = tree.DecisionTreeClassifier()

def main():
    log_windows = pd.read_csv(dirname + '/window_attr.csv', header = 0)
    # Standardise the data
    scalar_windows = preprocessing.StandardScaler().fit(log_windows)
    scaled_windows = scalar_windows.transform(log_windows)

    # Obtain labels and delete it from log window DataFrame
    window_labels = log_windows['label']
    del log_windows['label']

    # Fitting the model
    clf.fit(log_windows, window_labels)

    # Obtaining attributes from training dataset (for testing)
    index = 11
    b = log_windows['noOfBs']
    noOfBs = b[index]
    g = log_windows['noOfGs']
    noOfGs = g[index]
    f = log_windows['noOfFs']
    noOfFs = f[index]

    # Predicting the class of a sample
    result = clf.predict( [ [ noOfBs, 1234567687, 0 ] ] )

    print log_windows['noOfBs'].describe(), "\n"

    print ("Result: ", result)

if __name__ == "__main__":
    main()
