class ComputeMetrics {
    constructor() {
    }

    // Mean
    // plotData is array of data point
    // each data point is an object {name: ... , value: ...}
    static MeanValue (plotData) {
        let meanValue = 0;
        for (let i = 0; i < plotData.length; i++) {
            meanValue += plotData[i].value/plotData.length;
        }
        return meanValue;
    }

    // Standard deviation
    // plotData is array of data point
    // each data point is an object {name: ..., value: ...}
    static StandardDeviation (plotData) {
        let sd = 0;
        let meanValue = 0;
        for (let i = 0; i < plotData.length; i++) {
            meanValue += plotData[i].value/plotData.length;
        }
        for (let i = 0; i < plotData.length; i++) {
            sd += Math.pow(plotData[i].value-meanValue,2)/plotData.length;
        }
        sd = Math.sqrt(sd);
        return sd;
    }

    // Outlying
    // Use box-plot rule to determine outliers
    // score = absolute deviation from q2 for outliers/ absolute deviation from q2 for all
    // plotData is array of data point
    // each data point is an object {name: ..., value: ...}
    // isUpperOnly = true: only use upper limit of box-plot rule
    // isUpperOnly = false: use both limits of box-plot rule
    static Outlying (plotData,isUpperOnly) {
        let outlying = {
          score: 0,
          outliers: [],
        };
        if (plotData.length > 0) {
            let array = plotData.map(e=>e.value).sort((a,b)=>a-b);
            let L = array.length;
            let q1 = array[Math.floor(L*0.25)];
            let q2 = array[Math.floor(L*0.5)];
            let q3 = array[Math.floor(L*0.75)];
            let upperLimit = q3+1.5*(q3-q1);
            let lowerLimit = q1-1.5*(q3-q1);
            let totalAD, outlierAD;
            if (isUpperOnly) {
                totalAD = 0;
                outlierAD = 0;
                plotData.forEach(e=>{
                    totalAD += Math.abs(e.value-q2);
                    if (e.value > upperLimit) {
                        outlierAD += Math.abs(e.value-q2);
                        outlying.outliers.push(e.name);
                    }
                });
            } else {
                totalAD = 0;
                outlierAD = 0;
                plotData.forEach(e=>{
                    totalAD += Math.abs(e.value-q2);
                    if (e.value > upperLimit || e.value < lowerLimit) {
                        outlierAD += Math.abs(e.value-q2);
                        outlying.outliers.push(e.name);
                    }
                });
            }
            outlying.score = (totalAD !== 0) ? outlierAD/totalAD : 0;
        }
        return outlying;
    }
}