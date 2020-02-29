class Visual_feature_2D {
    constructor (smooth) {
        this.smooth = smooth;
    }

    // compute loop
    Loop () {
        let n_instances = experiment.instanceInfo.length;
        let n_variable = experiment.variableInfo.length;
        let n_timePoint = experiment.timeInfo.length;
        for (let i = 0; i < n_instances; i++) {
            let instance = experiment.instanceInfo[i];
            experiment.loop[instance] = [];
            for (let x = 0; x < n_variable - 1; x++) {      // find loop
                let x_let = experiment.variableInfo[x];
                if (experiment.data[instance][x_let]) {
                    for (let y = x+1; y < n_variable; y++) {
                        let y_let = experiment.variableInfo[y];
                        if (experiment.data[instance][y_let]) {
                            if (this.smooth) {
                                let loopLength = [];
                                let loopNum = 0;
                                for (let t = 0; t < n_timePoint - experiment.sliding - 2; t++) {
                                    let x1 = experiment.dataSmooth[instance][x_let][t], y1 = experiment.dataSmooth[instance][y_let][t];
                                    let x2 = experiment.dataSmooth[instance][x_let][t+1], y2 = experiment.dataSmooth[instance][y_let][t+1];
                                    if (x1 !== Infinity && x2 !== Infinity && y1 !== Infinity && y2 !== Infinity) {
                                        for (let tt = t+2; tt < n_timePoint - experiment.sliding; tt++) {
                                            let x3 = experiment.dataSmooth[instance][x_let][tt], y3 = experiment.dataSmooth[instance][y_let][tt];
                                            let x4 = experiment.dataSmooth[instance][x_let][tt+1], y4 = experiment.dataSmooth[instance][y_let][tt+1];
                                            if (x3 !== Infinity && y3 !== Infinity && x4 !== Infinity && y4 !== Infinity) {
                                                if ( Visual_feature_2D.checkIntersection(x1,y1,x2,y2,x3,y3,x4,y4)) {
                                                    if (tt-t>=12) {
                                                        let sites = [];
                                                        for (let j = t; j <= tt; j++) {
                                                            sites[j-t] = [experiment.dataSmooth[instance][x_let][j],experiment.dataSmooth[instance][y_let][j]];
                                                        }
                                                        let convex_score = Visual_feature_2D.convex_score(instance,x_let,y_let,sites);
                                                        let concave_area = hulls.concaveHullArea(hulls.concaveHull(experiment.alpha,sites));
                                                        let convex_area = hulls.convexHullArea(hulls.convexHull(sites));
                                                        let my_area = Visual_feature_2D.area(sites);
                                                        if (convex_score >= 0.5) {
                                                            loopLength[loopNum] = [t,tt,convex_score,concave_area,convex_area,my_area];
                                                            loopNum += 1;
                                                        }
                                                    }
                                                    t = tt;          // do not consider loops inside a loop
                                                    tt = n_timePoint - experiment.sliding - 1;
                                                }
                                            }
                                        }
                                    }
                                }
                                experiment.loop[instance].push([x_let,y_let,loopLength]);
                            } else {
                                let loopLength = [];
                                let loopNum = 0;
                                for (let t = 0; t < n_timePoint - experiment.sliding - 2; t++) {
                                    let x1 = experiment.data[instance][x_let][t], y1 = experiment.data[instance][y_let][t];
                                    let x2 = experiment.data[instance][x_let][t+1], y2 = experiment.data[instance][y_let][t+1];
                                    if (x1 !== Infinity && y1 !== Infinity && x2 !== Infinity && y2 !== Infinity) {
                                        for (let tt = t+2; tt < n_timePoint - experiment.sliding; tt++) {
                                            let x3 = experiment.data[instance][x_let][tt], y3 = experiment.data[instance][y_let][tt];
                                            let x4 = experiment.data[instance][x_let][tt+1], y4 = experiment.data[instance][y_let][tt+1];
                                            if (x3 !== Infinity && y3 !== Infinity && x4 !== Infinity && y4 !== Infinity) {
                                                if ( Visual_feature_2D.checkIntersection(x1,y1,x2,y2,x3,y3,x4,y4)) {
                                                    if (tt-t>=12) {
                                                        let sites = [];
                                                        for (let j = t; j <= tt; j++) {
                                                            sites[j-t] = [experiment.data[instance][x_let][j],experiment.data[instance][y_let][j]];
                                                        }
                                                        let convex_score = Visual_feature_2D.convex_score(instance,x_let,y_let,sites);
                                                        let concave_area = hulls.concaveHullArea(hulls.concaveHull(experiment.alpha,sites));
                                                        let convex_area = hulls.convexHullArea(hulls.convexHull(sites));
                                                        let my_area = Visual_feature_2D.area(sites);
                                                        if (convex_score >= 0.5) {
                                                            loopLength[loopNum] = [t,tt,convex_score,concave_area,convex_area,my_area];
                                                            loopNum += 1;
                                                        }
                                                    }
                                                    t = tt;          // do not consider loops inside a loop
                                                    tt = n_timePoint - experiment.sliding - 1;
                                                }
                                            }
                                        }
                                    }
                                }
                                experiment.loop[instance].push([x_let,y_let,loopLength]);
                            }
                        }
                    }
                }
            }
        }
    }

    static checkIntersection(x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_) {
        let v1x = x2_ - x1_;
        let v1y = y2_ - y1_;
        let v2x = x4_ - x3_;
        let v2y = y4_ - y3_;
        let v23x = x3_ - x2_;
        let v23y = y3_ - y2_;
        let v24x = x4_ - x2_;
        let v24y = y4_ - y2_;
        let v41x = x1_ - x4_;
        let v41y = y1_ - y4_;
        let checkV1 = (v1x * v23y - v1y * v23x) * (v1x * v24y - v1y * v24x);
        let checkV2 = (v2x * v41y - v2y * v41x) * (v2y * v24x - v2x * v24y);
        return (checkV1 < 0) && (checkV2 < 0);
    }

    // compute convex score
    static convex_score (instance, x_let, y_let, sites) {
        // let convex = hulls.convexHull(sites);
        // let convexArea = hulls.convexHullArea(convex);
        // let threshold = Data_processing.upperBoxPlot2D(instance,x_let,y_let);
        // // let alpha = (typeof (threshold) === "number") ? 1/threshold : 10;
        // let alpha = 20;
        // let concave = hulls.concaveHull(alpha,sites);
        // let concaveArea = hulls.concaveHullArea(concave);
        // return concaveArea/convexArea;

        // count number of angle less than pi/2
        let loopSize = sites.length;
        let convex_score = 0;
        for (let i = 0; i < loopSize - 2; i++) {
            if (Visual_feature_2D.computeCosine(sites[i][0],sites[i][1],sites[i+1][0],sites[i+1][1],sites[i+2][0],sites[i+2][1]) > 0) {
                convex_score += 1;
            }
        }
        return convex_score/loopSize;

        // check ratio of convex hulls and loop size
        // let loopSize = sites.length;
        // let convex = hulls.convexHull(sites);
        // return convex.length/loopSize;
    }

    static computeCosine(x1_, y1_, x2_, y2_, x3_, y3_) {
        let v1x = x2_ - x1_;
        let v1y = y2_ - y1_;
        let v2x = x3_ - x2_;
        let v2y = y3_ - y2_;
        let dotProduct = v1x * v2x + v1y * v2y;
        let v1 = Math.sqrt(v1x * v1x + v1y * v1y);
        let v2 = Math.sqrt(v2x * v2x + v2y * v2y);
        let cosine;
        if (v1*v2 !== 0) {
            cosine = dotProduct / (v1 * v2);
        } else
            cosine = 0;
        return cosine;
    }

    // check whether a point is inside a triangle or not
    static checkInsideTriangle(xPoint, yPoint, x1_, y1_, x2_, y2_, x3_, y3_) {
        let x0 = xPoint;
        let y0 = yPoint;
        let x1 = x1_;
        let y1 = y1_;
        let x2 = x2_;
        let y2 = y2_;
        let x3 = x3_;
        let y3 = y3_;
        let checkLine = ((x2-x1)/(x3-x1) === (y2-y1)/(y3-y1));
        if (!checkLine) {
            let xOA = x1 - x0;
            let yOA = y1 - y0;
            let xOB = x2 - x0;
            let yOB = y2 - y0;
            let xOC = x3 - x0;
            let yOC = y3 - y0;
            let xAB = x2 - x1;
            let yAB = y2 - y1;
            let xBC = x3 - x2;
            let yBC = y3 - y2;
            let xCA = x1 - x3;
            let yCA = y1 - y3;
            let check1 = xOA * yAB - yOA * xAB;
            let check2 = xOB * yBC - yOB * xBC;
            let check3 = xOC * yCA - yOC * xCA;
            return (check1 > 0 && check2 > 0 && check3 > 0) || (check1 < 0 && check2 < 0 && check3 < 0);
        } else return false;
    }

    // compute area
    static area (sites) {
        let n_bin = 40;
        let binSize = 1/n_bin;
        let cellArray = [];
        for (let i = 0; i < n_bin; i++) {
            cellArray[i] = [];
            for (let j = 0; j < n_bin; j++) {
                cellArray[i][j] = 0;
            }
        }
        let x_max = Math.max(...sites.map(element=>element[0]));
        let x_min = Math.min(...sites.map(element=>element[0]));
        let y_max = Math.max(...sites.map(element=>element[1]));
        let y_min = Math.min(...sites.map(element=>element[1]));
        let xMax = Math.ceil(x_max/binSize);
        let xMin = Math.floor((x_min/binSize));
        let yMax = Math.ceil(y_max/binSize);
        let yMin = Math.floor(y_min/binSize);
        // compute near edges
        // for (let t = 0; t < sites.length-2; t++) {
        //     for (let i = xMin; i <= xMax; i++) {
        //         for (let j = yMin; j <= yMax; j++) {
        //             let xCell = i*binSize+binSize/2;
        //             let yCell = j*binSize+binSize/2;
        //             if (Visual_feature_2D.checkInsideTriangle(xCell,yCell,sites[t][0],sites[t][1],sites[t+1][0],sites[t+1][1],sites[t+2][0],sites[t+2][1])) {
        //                 cellArray[i][j] = 1;
        //             }
        //         }
        //     }
        // }
        // compute from center
        let xCenter = d3.mean(sites.map(element=>element[0]));
        let yCenter = d3.mean(sites.map(element=>element[1]));
        for (let t = 0; t < sites.length-1; t++) {
            for (let i = xMin; i <= xMax; i++) {
                for (let j = yMin; j <= yMax; j++) {
                    let xCell = i*binSize+binSize/2;
                    let yCell = j*binSize+binSize/2;
                    if (Visual_feature_2D.checkInsideTriangle(xCell,yCell,xCenter,yCenter,sites[t][0],sites[t][1],sites[t+1][0],sites[t+1][1])) {
                        cellArray[i][j] = 1;
                    }
                }
            }
        }
        let countBin = 0;
        for (let i = xMin; i < xMax; i++) {
            for (let j = yMin; j < yMax; j++) {
                if (cellArray[i][j] === 1) countBin += 1;
            }
        }
        return countBin*binSize*binSize;
    }

}