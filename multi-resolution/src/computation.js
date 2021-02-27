function computations () {
    score.length = 0;
    for (let i = 0; i < ds.length; i++) {
        score[i] = [];
        for (let t = ds[i]; t < tKey.length; t++) {
            let vectors = buildPlot(t,ds[i]);
            score[i].push(computeMetric(vectors));
        }
    }
}

function computeMetric (vectors) {
    switch (selectedMetric) {
        case "Outlying vector":
            return outlyingVector(vectors);
            break;
        case 'Outlying length':
            return outlyingLength(vectors);
            break;
        case 'Outlying angle':
            return outlyingAngle(vectors);
            break;
        case 'Correlation':
            return correlation(vectors);
            break;
        case 'Entropy':
            return entropy(vectors);
            break;
        case 'Intersection':
            return intersection(vectors);
            break;
        case 'Translation':
            return translation(vectors);
            break;
        case 'Homogeneous':
            return homogeneous(vectors);
            break;
    }
}

function buildPlot (tIndex,res) {
    let vectors = [];
    let xMax = -Infinity, yMax = -Infinity;
    let xMin = Infinity, yMin = Infinity;
    if (selectedData === 'employment') {
        for (let v = 0; v < iKey.length; v++) {
            if (data[0][selectedPlot]) {
                if (data[0][selectedPlot][tKey[tIndex-res]] && data[0][selectedPlot][tKey[tIndex]]) {
                    if (data[0][selectedPlot][tKey[tIndex-res]][iKey[v]] && data[0][selectedPlot][tKey[tIndex]][iKey[v]]) {
                        xMax = (xMax < data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][0]) ? data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][0] : xMax;
                        xMax = (xMax < data[0][selectedPlot][tKey[tIndex]][iKey[v]][0]) ? data[0][selectedPlot][tKey[tIndex]][iKey[v]][0] : xMax;
                        yMax = (yMax < data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][1]) ? data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][1] : yMax;
                        yMax = (yMax < data[0][selectedPlot][tKey[tIndex]][iKey[v]][1]) ? data[0][selectedPlot][tKey[tIndex]][iKey[v]][1] : yMax;
                        xMin = (xMin > data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][0]) ? data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][0] : xMin;
                        xMin = (xMin > data[0][selectedPlot][tKey[tIndex]][iKey[v]][0]) ? data[0][selectedPlot][tKey[tIndex]][iKey[v]][0] : xMin;
                        yMin = (yMin > data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][1]) ? data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][1] : yMin;
                        yMin = (yMin > data[0][selectedPlot][tKey[tIndex]][iKey[v]][1]) ? data[0][selectedPlot][tKey[tIndex]][iKey[v]][1] : yMin;
                    }
                }
            }
        }
        for (let v = 0; v < iKey.length; v++) {
            if (data[0][selectedPlot]) {
                if (data[0][selectedPlot][tKey[tIndex-res]] && data[0][selectedPlot][tKey[tIndex]]) {
                    if (data[0][selectedPlot][tKey[tIndex-res]][iKey[v]] && data[0][selectedPlot][tKey[tIndex]][iKey[v]]) {
                        let x0 = (data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][0]-xMin)/(xMax-xMin);
                        let y0 = (data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][1]-yMin)/(yMax-yMin);
                        let x1 = (data[0][selectedPlot][tKey[tIndex]][iKey[v]][0]-xMin)/(xMax-xMin);
                        let y1 = (data[0][selectedPlot][tKey[tIndex]][iKey[v]][1]-yMin)/(yMax-yMin);
                        vectors.push([x0,y0,x1,y1,v]);
                    }
                }
            }
        }
    } else {
        for (let v = 0; v < iKey.length; v++) {
            if (data[0][selectedPlot]) {
                if (data[0][selectedPlot][tKey[tIndex-res]] && data[0][selectedPlot][tKey[tIndex]]) {
                    if (data[0][selectedPlot][tKey[tIndex-res]][iKey[v]] && data[0][selectedPlot][tKey[tIndex]][iKey[v]]) {
                        if (selectedData === 'HPCC') {
                            let x0 = data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][0]/100;
                            let y0 = data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][1]/100;
                            let x1 = data[0][selectedPlot][tKey[tIndex]][iKey[v]][0]/100;
                            let y1 = data[0][selectedPlot][tKey[tIndex]][iKey[v]][1]/100;
                            vectors.push([x0,y0,x1,y1,v]);
                        } else {
                            let x0 = data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][0];
                            let y0 = data[0][selectedPlot][tKey[tIndex-res]][iKey[v]][1];
                            let x1 = data[0][selectedPlot][tKey[tIndex]][iKey[v]][0];
                            let y1 = data[0][selectedPlot][tKey[tIndex]][iKey[v]][1];
                            vectors.push([x0,y0,x1,y1,v]);
                        }
                    }
                }
            }
        }
    }
    return vectors;
}

function outlyingVector (vectors) {
    let myVectors = vectors.map(e=>[e[0],e[1],e[2],e[3]]);
    let MST = Prim(myVectors);
    let wArr = MST.map(e=>e[2]);
    wArr.sort(function (a,b){return a-b});
    let q1 = wArr[Math.floor(wArr.length*0.25)];
    let q3 = wArr[Math.floor(wArr.length*0.75)];
    let q2 = wArr[Math.floor(wArr.length*0.5)];
    let li = q3 + 1.5*(q3-q1);
    let so = 0;
    let s = 0;
    for (let i = 0; i < MST.length; i++) {
        s += Math.abs(MST[i][2]-q2);
        if (MST[i][2] > li) {
        //     let check0 = false, check1 = false;          // check vertex of degree 1
        //     for (let j = 0; j < MST.length; j++) {
        //         if (j !== i) {
        //             if (MST[j][0] === MST[i][0] || MST[j][1] === MST[i][0]) check0 = true;
        //             if (MST[j][0] === MST[i][1] || MST[j][1] === MST[i][1]) check1 = true;
        //             if (check0 && check1) break;
        //         }
        //     }
        //     if (!check0 || !check1) so += Math.abs(MST[i][2]-q2);
            so += Math.abs(MST[i][2]-q2);
        }
    }
    return (s) ? so/s : 0;
}

function outlyingLength (vectors) {
    let dArr = [];
    for (let i = 0; i < vectors.length; i++) {
        dArr[i] = Math.sqrt(Math.pow(vectors[i][2]-vectors[i][0],2)+Math.pow(vectors[i][3]-vectors[i][1],2));
    }
    dArr.sort(function (a,b){return a-b});
    let q1 = dArr[Math.floor(dArr.length*0.25)];
    let q2 = dArr[Math.floor(dArr.length*0.5)];
    let q3 = dArr[Math.floor(dArr.length*0.75)];
    let li = q3 + 1.5*(q3-q1);
    let s = 0, so = 0;
    for (let i = 0; i < dArr.length; i++) {
        s += Math.abs(dArr[i]-q2);
        if (dArr[i] > li) so += Math.abs(dArr[i]-q2);
    }
    return (s) ? so/s : 0;
}

function outlyingAngle (vectors) {
    let aArr = [];
    for (let i = 0; i < vectors.length; i++) {
        let x0 = vectors[i][0];
        let y0 = vectors[i][1];
        let x1 = vectors[i][2];
        let y1 = vectors[i][3];
        if (x0 !== x1 || y0 !== y1) aArr.push(Math.atan2(y1-y0,x1-x0));
    }
    aArr.sort(function (a,b){return a-b});
    let q1 = aArr[Math.floor(aArr.length*0.25)];
    let q2 = aArr[Math.floor(aArr.length*0.5)];
    let q3 = aArr[Math.floor(aArr.length*0.75)];
    let uli = q3 + 1.5*(q3-q1);
    let lli = q1 - 1.5*(q3-q1);
    let s = 0, so = 0;
    for (let i = 0; i < aArr.length; i++) {
        s += Math.abs(aArr[i]-q2);
        if (aArr[i] < lli || aArr[i] > uli) so += Math.abs(aArr[i]-q2);
    }
    return s ? so/s : 0;
}

function correlation (vectors) {
    let s = 0;
    for (let i = 0; i < vectors.length; i++) {
        let x = vectors[i][2] - vectors[i][0];
        let y = vectors[i][3] - vectors[i][1];
        if (x*y > 0) s += 1;
    }
    return 2*Math.abs(s/vectors.length-0.5);
}

function entropy (vectors) {
    let p = [0,0,0,0];
    for (let i = 0; i < vectors.length; i++) {
        let x = vectors[i][2] - vectors[i][0];
        let y = vectors[i][3] - vectors[i][1];
        if (x > 0 && y >= 0) p[0] += 1/vectors.length;
        if (x <= 0 && y > 0) p[1] += 1/vectors.length;
        if (x < 0 && y <= 0) p[2] += 1/vectors.length;
        if (x >= 0 && y < 0) p[3] += 1/vectors.length;
    }
    let result = 0;
    for (let i = 0; i < 4; i++) {
        if (p[i]!==0) result += p[i]*Math.log2(p[i]);
    }
    return -0.5*result;
}

function intersection (vectors) {
    let n = 0;
    for (let i = 0; i < vectors.length-1; i++) {
        for (let j = i+1; j < vectors.length; j++) {
            let check = checkLineSegmentCrossing(vectors[i][0],vectors[i][1],vectors[i][2],vectors[i][3],vectors[j][0],vectors[j][1],vectors[j][2],vectors[j][3]);
            if (check) n += 1;
        }
    }
    return 1 - Math.exp(-n/vectors.length);
}

function translation (vectors) {
    let c1 = [0,0], c2 = [0,0];
    let g1 = [];
    for (let i = 0; i < vectors.length; i++) {
        c1[0] += vectors[i][0]/vectors.length;
        c1[1] += vectors[i][1]/vectors.length;
        c2[0] += vectors[i][2]/vectors.length;
        c2[1] += vectors[i][3]/vectors.length;
        g1[i] = [vectors[i][0],vectors[i][1]];
    }
    let MST = Prim(g1);
    MST.sort(function (a,b){return a[2]-b[2]});
    let q1 = MST[Math.floor(MST.length*0.25)][2];
    let q3 = MST[Math.floor(MST.length*0.75)][2];
    let li = q3+1.5*(q3-q1);
    let index = MST.findIndex(e=>e[2]>li);
    let ol = [];
    if (index !== -1) {
        // get outlier - vertex of degree 1
        for (let i = index; i < MST.length; i++) {
            let count0 = 0;
            let count1 = 0;
            for (let j = 0; j < MST.length; j++) {
                if (MST[i][0] === MST[j][0] || MST[i][0] === MST[j][1]) count0 += 1;
                if (MST[i][1] === MST[j][0] || MST[i][1] === MST[j][1]) count1 += 1;
            }
            if (count0===1) ol.push(MST[i][0]);
            if (count1===1) ol.push(MST[i][1]);
        }
        let r = 0;
        for (let i = 0; i < g1.length; i++) {
            let check = false;
            if (ol.length > 0) {
                for (let j = 0; j < ol.length; j++) {
                    check = i === ol[j];
                    if (check) break;
                }
            }
            if (!check) {
                let d = Math.sqrt((c1[0]-g1[i][0])*(c1[0]-g1[i][0])+(c1[1]-g1[i][1])*(c1[1]-g1[i][1]));
                r = (d > r) ? d : r;
            }
        }
        let dd = Math.sqrt((c1[0]-c2[0])*(c1[0]-c2[0])+(c1[1]-c2[1])*(c1[1]-c2[1]));
        let result = r>0 ? dd/r : 0;
        return result > 1 ? 1 : result;
    } else {
        let r = 0;
        for (let i = 0; i < g1.length; i++) {
            let d = Math.sqrt((c1[0]-g1[i][0])*(c1[0]-g1[i][0])+(c1[1]-g1[i][1])*(c1[1]-g1[i][1]));
            r = (d > r) ? d : r;
        }
        let dd = Math.sqrt((c1[0]-c2[0])*(c1[0]-c2[0])+(c1[1]-c2[1])*(c1[1]-c2[1]));
        let result = r>0 ? dd/r : 0;
        return result > 1 ? 1 : result;
    };
}

function homogeneous (vectors) {
    let d = [], muy = 0;
    for (let i = 0; i < vectors.length; i++) {
        d[i] = Math.sqrt(vectors[i][0]*vectors[i][0]+vectors[i][1]*vectors[i][1]+vectors[i][2]*vectors[i][2]+vectors[i][3]*vectors[i][3]);
        muy += d[i];
    }
    muy = muy/vectors.length;
    let s = 0;
    for (let i = 0; i < vectors.length; i++) {
        s += (d[i]-muy)*(d[i]-muy);
    }
    return 1-2*Math.sqrt(s/vectors.length);
}