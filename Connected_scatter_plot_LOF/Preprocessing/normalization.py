# INPUT
# data from Read package

# OUTPUT
# normalized data with the same structure


from normalization_functions import min_max


def process_data(data):
    result = {}
    for instance in data:
        if instance != 'timestamp':
            result[instance] = {}
            for variable in data[instance]:
                result[instance][variable] = min_max.min_max_normalization(data[instance][variable])
    return result
