# INPUT
# numpy matrix
# each row: coordinates of point in 2d space
# k: number of neighbors
# threshold: LOF >= threshold <=> outlier
# limit: least number of consecutive outliers to be considered as anomaly
# epsilon: LOF <= 1 + epsilon <=> in a cluster


# OUTPUT
# visual metrics

from sklearn.neighbors import LocalOutlierFactor
from numpy import where


def get_scores(data, k=5, threshold=1.5, limit=10, epsilon=0):
    result = {
        'anomaly': 0,
        'clumpy': 0,
        'lof': [],
    }
    # compute LOF for each point
    clf = LocalOutlierFactor(n_neighbors=k)
    clf.fit(data)
    lof = - clf.negative_outlier_factor_
    result['lof'] = lof
    # compute anomaly score
    anomaly = []
    sequence = []
    for i in range(len(lof)):
        if lof[i] >= threshold:
            sequence.append(lof[i])
            if i == len(lof) - 1:
                if len(sequence) >= limit:
                    for j in range(len(sequence)):
                        anomaly.append(sequence[j])
        else:
            if len(sequence) >= limit:
                for j in range(len(sequence)):
                    anomaly.append(sequence[j])
            sequence = []
    result['anomaly'] = sum(anomaly) / sum(lof)
    # compute anomaly score
    anomaly = []
    sequence = []
    for i in range(len(lof)):
        if lof[i] >= threshold:
            sequence.append(lof[i])
            if i == len(lof) - 1:
                if len(sequence) >= limit:
                    for j in range(len(sequence)):
                        anomaly.append(sequence[j])
        else:
            if len(sequence) >= limit:
                for j in range(len(sequence)):
                    anomaly.append(sequence[j])
            sequence = []
    result['anomaly'] = sum(anomaly) / sum(lof)
    # compute clumpy score
    in_cluster = where(lof <= 1 + epsilon)[0]
    result['clumpy'] = len(in_cluster) / len(lof)
    return result

# INPUT
# dict of every instance
# for each instance:
# PCA result in 2d space - list of point in temporal order
# PCA result is a dict of: 'variance_ratio' and 'transformation'

# OUTPUT
# dict of every instance
# for each instance:
# metrics and lof


def compute_all_plots(data, k=5, threshold=1.5, limit=10, epsilon=0):
    result = {}
    for i in data:
        result[i] = get_scores(data[i]['transformation'], k, threshold, limit, epsilon)
    return result
