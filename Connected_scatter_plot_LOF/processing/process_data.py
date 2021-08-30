# INPUT
# file_name
# k: number of neighbors
# threshold: LOF >= threshold <=> outlier
# limit: least number of consecutive outliers to be considered as anomaly
# w: window size
# s: stride
# si: start index
# ei: end index


# OUTPUT
# data for visualization:
# # DR result in temporal order + LOF of each point
# # Time series of each point/instance
# # metrics result


import Read
import Preprocessing as Pr
import Dimension_reduction as Dr
import Computations as Comp


def run(file_name, k, threshold, limit, w, s):
    # read data
    data = Read.read_hpcc_file.read(file_name)

    # normalize data
    norm_data = Pr.normalization.process_data(data)

    # get sliding windows
    w_data = Pr.sliding_window.get_window(norm_data, w, s)

    # apply dimension reduction to get connected scatter plot
    dr_result = Dr.my_PCA.get_pca(w_data)

    # compute metrics
    plots = Comp.metrics.compute_all_plots(dr_result, k, threshold, limit)

    # return data
    return {
        'data': data,
        'dr': dr_result,
        'metrics': plots,
    }
