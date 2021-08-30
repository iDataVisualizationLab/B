# INPUT
# normalized data in the same structure of OUTPUT of Read
# window size - w
# stride - s

# OUTPUT
# dict of every instance
# for each instance:
# matrix of sliding windows
# each row is a window

import sliding_window_functions as sl


def get_window(data, w, s):
    result = {}
    n_var = 0
    for i in data:
        if i != 'timestamp':
            for v in data[i]:
                n_var += 1
            break
    if n_var == 1:
        for i in data:
            if i != 'timestamp':
                for v in data[i]:
                    result[i] = sl.univariate_series.get_window(data[i][v], w, s)
    return result
