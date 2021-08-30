# INPUT
# a list of numbers

# OUTPUT
# a list of normalized numbers in unit range


def min_max_normalization(data):
    result = []
    my_max = float('-inf')
    my_min = float('inf')
    for d in data:
        if type(d) == int or type(d) == float:
            if d > my_max:
                my_max = d
            if d < my_min:
                my_min = d
    my_range = my_max - my_min
    if my_range != 0:
        for i in range(len(data)):
            if type(data[i]) == int or type(data[i]) == float:
                result.append((data[i] - my_min)/my_range)
    return result
