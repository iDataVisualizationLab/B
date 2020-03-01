class Data_processing {
    constructor (data) {
        this.data = data;   // this.data has the same reference with input parameter: data

        // clear the global variable
        experiment.data = {};
        experiment.dataRaw = {};
        experiment.dataSmooth = {};
        experiment.dataSmoothRaw = {};
        experiment.firstDifference = {};
        experiment.timeInfo = [];
        experiment.instanceInfo = [];
        experiment.variableInfo = [];
    }

    // read to global variables
    read () {
        // read some information of data
        experiment.timeInfo = this.data[0].columns.filter((element,index)=>index!==0);
        experiment.instanceInfo = this.data[1].map(element=>element.name);
        experiment.variableInfo = this.data[2].map(element=>element.name);
        // read data
        let n_timeSeries = this.data[0].length;
        let n_timePoint = this.data[0].columns.length-1;
        let n_instances = this.data[1].length;
        let n_variable = this.data[2].length;
        let mapSeries = [];
        for (let i = 0; i < n_timeSeries; i++) {
            let sampleCode = this.data[0][i]['Series ID'].substr(3,2);
            let variableCode = this.data[0][i]['Series ID'].substr(10,8);
            if (this.data[2].findIndex(element=>element.code===variableCode)!==-1)
                mapSeries.push([sampleCode,variableCode,i]);
        }
        for (let i = 0; i < n_instances; i++) {
            experiment.data[this.data[1][i].name] = {};
            experiment.dataRaw[this.data[1][i].name] = {};
            for (let j = 0; j < n_variable; j++) {
                let sampleCode = this.data[1][i].code;
                let variableCode = this.data[2][j].code;
                let variable = this.data[2][j].name;
                let limit = experiment.limit.findIndex(element=>element===variable);
                if (limit === -1) {
                    let rowMatrix = mapSeries.find(element=>element[0]===sampleCode&&element[1]===variableCode);
                    if (rowMatrix) {
                        let row = rowMatrix[2];
                        let timeSeries = [];
                        for (let t = 0; t < n_timePoint; t++) {
                            timeSeries[t] = isNaN(parseFloat(this.data[0][row][experiment.timeInfo[t]])) ? Infinity : parseFloat(this.data[0][row][experiment.timeInfo[t]]);
                        }
                        experiment.dataRaw[this.data[1][i].name][this.data[2][j].name] = timeSeries;
                        let maxValue = Math.max(...timeSeries.filter(element=>element!==Infinity));
                        let minValue = Math.min(...timeSeries.filter(element=>element!==Infinity));
                        let rangeValue = maxValue - minValue;
                        experiment.data[this.data[1][i].name][this.data[2][j].name] = timeSeries.map(element=>{
                            if (maxValue !== Infinity && minValue !== Infinity) return (element-minValue)/rangeValue;
                            else return Infinity;
                        });
                    }
                }
            }
        }
        return true;
    }

    // smooth data
    smooth (window_size) {
        let n_timePoint = this.data[0].columns.length-1;
        let n_instances = this.data[1].length;
        let n_variable = this.data[2].length;
        experiment.dataSmooth = {};
        experiment.dataSmoothRaw = {};
        for (let i = 0; i < n_instances; i++) {
            let instance = experiment.instanceInfo[i];
            experiment.dataSmooth[instance] = {};
            experiment.dataSmoothRaw[instance] = {};
            for (let v = 0; v < n_variable; v++) {  // generate smooth data
                let variable = experiment.variableInfo[v];
                if (experiment.data[instance][variable]) {
                    experiment.dataSmooth[instance][variable] = [];
                    experiment.dataSmoothRaw[instance][variable] = [];
                    for (let t = 0; t < n_timePoint-window_size; t++) {
                        experiment.dataSmooth[instance][variable][t] = 0;
                        experiment.dataSmoothRaw[instance][variable][t] = 0;
                        for (let s = 0; s < window_size; s++) {
                            experiment.dataSmooth[instance][variable][t] += experiment.data[instance][variable][t+s];
                            experiment.dataSmoothRaw[instance][variable][t] += experiment.dataRaw[instance][variable][t+s];
                        }
                        experiment.dataSmooth[instance][variable][t] /= window_size;
                        experiment.dataSmoothRaw[instance][variable][t] /= window_size;
                    }
                }
            }
        }
        return true;
    }

    // get first difference
    firstDifference () {
        let n_timePoint = this.data[0].columns.length-1;
        let n_instance = this.data[1].length;
        let n_variable = this.data[2].length;
        for (let i = 0; i < n_instance; i++) {
            let instance = experiment.instanceInfo[i];
            experiment.firstDifference[instance] = {};
            for (let j = 0; j < n_variable; j++) {
                let variable = experiment.variableInfo[j];
                experiment.firstDifference[instance][variable] = [];
                if (experiment.data[instance][variable]) {
                    for (let t = 0; t < n_timePoint - 1; t++) {
                        if (experiment.data[instance][variable][t] !== Infinity && experiment.data[instance][variable][t+1] !== Infinity) {
                            experiment.firstDifference[instance][variable][t] = experiment.data[instance][variable][t+1] - experiment.data[instance][variable][t];
                        } else {
                            experiment.firstDifference[instance][variable][t] = Infinity;
                        }
                    }
                }
            }
        }
    }

    // get upper threshold for box-plot rule
    // static upperBoxPlot2D (instance,x_var,y_var,sites) {
    static upperBoxPlot2D (sites) {
        // let n_timePoint = experiment.timeInfo.length;
        // if (experiment.firstDifference) {
        //     let doublySeriesFirstDiff = [];
        //     for (let t = 0; t < n_timePoint - 1; t++) {
        //         if (experiment.firstDifference[instance][x_var][t] !== Infinity && experiment.firstDifference[instance][y_var][t] !== Infinity) {
        //             doublySeriesFirstDiff[t] = Math.sqrt(Math.pow(experiment.firstDifference[instance][x_var][t],2)+Math.pow(experiment.firstDifference[instance][y_var][t],2));
        //         } else {
        //             doublySeriesFirstDiff[t] = Infinity;
        //         }
        //     }
        //     doublySeriesFirstDiff = doublySeriesFirstDiff.filter(element=>element!==Infinity);
        //     doublySeriesFirstDiff.sort((a,b)=>a-b);
        //     let Q3 = doublySeriesFirstDiff[Math.floor((n_timePoint-1)*0.75)];
        //     let Q1 = doublySeriesFirstDiff[Math.floor((n_timePoint-1)*0.25)];
        //     return Q3+1.5*(Q3-Q1);
        // } else return 'No result';

        let n_timePoint = sites.length;
        let firstDiff = [];
        for (let t = 0; t < n_timePoint - 1; t++) {
            firstDiff[t] = Math.sqrt(Math.pow(sites[t+1][0]-sites[t][0],2)+Math.pow(sites[t+1][1]-sites[t][1],2));
        }
        firstDiff.sort((a,b)=>a-b);
        let Q3 = firstDiff[Math.floor((n_timePoint-1)*0.75)];
        let Q1 = firstDiff[Math.floor((n_timePoint-1)*0.25)];
        return Q3+1.5*(Q3-Q1);
    }


}