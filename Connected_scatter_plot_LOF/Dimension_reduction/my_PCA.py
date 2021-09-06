# INPUT
# matrix of numpy 2d array
# each row: coordinates of a point

# OUTPUT
# matrix of input in the 2d space


from sklearn.decomposition import PCA


def get_2d(data):
    pca = PCA(n_components=2)
    pca.fit(data)
    return {
        'variance_ratio': pca.explained_variance_ratio_,
        'transformation': pca.transform(data)
    }

# INPUT
# dict of every instance
# for each instance:
# matrix of sliding windows
# each row is a window

# OUTPUT
# dict of every instance
# for each instance:
# PCA result in 2d space:
# 'transformation': list of point in temporal order
# 'variance_ratio': for justifying the two components


def get_pca(data):
    result = {}
    for i in data:
        pca = get_2d(data[i])
        result[i] = {
            'variance_ratio': pca['variance_ratio'],
            'transformation': pca['transformation'],
        }
    return result
