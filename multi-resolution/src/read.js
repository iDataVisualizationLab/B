function writeData_NetScatter(file) {
    tKey.length = 0;    // write time key
    pKey.length = 0;    // write plot key
    iKey.length = 0;    // write vector key
    data.length = 0;    // write data
    data[0] = {};

    for (let p in file) {
        pKey.push(p);
        data[0][p] = {};
        for (let t in file[p]) {
            if (tKey.findIndex(e=>e===t) === -1) tKey.push(t);
            data[0][p][t] = {};
            for (let v in file[p][t]) {
                if (iKey.findIndex(e=>e===v) === -1) iKey.push(v);
                data[0][p][t][v] = [file[p][t][v][0],file[p][t][v][1]];
            }
        }
    }

}