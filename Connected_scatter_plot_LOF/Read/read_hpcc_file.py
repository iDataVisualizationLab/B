# INPUT
# files health reading of HPCC compute nodes
# format: https://www.notion.so/HPCC-Realtime-API-a3870cd2181f4c02bab2f211ed8b496e

# OUTPUT
# a dictionary with attributes:
# # timestamp: list of time step in the data
# # names of compute nodes: dictionaries with the following attributes:
# # # var1: [data in temporal order]
# # # var2: [data in temporal order]


import json


def read(file_name):
    result = {
        'timestamp': [],
    }
    with open(file_name, 'r') as myFile:
        my_data = json.load(myFile)
        for time in my_data['time_stamp']:
            result['timestamp'].append(time)
        for node in my_data['nodes_info']:
            result[node] = {
                'cpu_temp_1': [],
                # 'cpu_temp_2': [],
            }
            for t in my_data['nodes_info'][node]['cpu_inl_temp']:
                if t[0] is not None:
                    result[node]['cpu_temp_1'].append(t[0])
                else:
                    result.pop(node, None)
                    break
                # result[node]['cpu_temp_2'].append(t[1])
    return result
