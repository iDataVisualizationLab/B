# INPUT
# data of an instance in uni-variate case: a list
# window size - w
# stride - s

# OUTPUT
# matrix of sliding windows
# each row is a window

import numpy as np
import math


def get_window(data, w, s):
    t = 0   # start index
    e = len(data)   # end index, do not get data at index e
    if (e - (t + w - 1)) % s == 0:
        r_last = int(math.floor((e - (t + w - 1))/s)) - 1
    else:
        r_last = int(math.floor((e - (t + w - 1))/s))
    e_true = r_last*s + t + w
    result = np.zeros((r_last + 1, w))
    for i in range(t, e_true):
        s_row = int(math.ceil((i - (t + w - 1))/s))
        if s_row < 0:
            s_row = 0
        if s_row > r_last:
            s_row = r_last
        e_row = int(math.floor((i - t)/s))
        if e_row > r_last:
            e_row = r_last
        e_row = e_row + 1
        for r in range(s_row, e_row):
            c = i - (t + r*s)
            result[r][c] = data[i]
    return result
