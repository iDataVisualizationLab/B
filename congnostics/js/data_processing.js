class Data_processing {
    constructor (data) {
        this.data = data;   // this.data has the same reference with input parameter: data
    }

    // read to global variables
    read () {
        // read some information of data
        experiment.timeInfo = [];
        experiment.instanceInfo = [];
        experiment.variableInfo = [];
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
            let n_variable = this.data[0][i]['Series ID'].substr(10,8);
            mapSeries[i] = [sampleCode,n_variable,i];
        }
        for (let i = 0; i < n_instances; i++) {
            experiment.data[this.data[1][i].name] = {};
            experiment.dataRaw[this.data[1][i].name] = {};
            for (let j = 0; j < n_variable; j++) {
                let sampleCode = this.data[1][i].code;
                let n_variable = this.data[2][j].code;
                let rowMatrix = mapSeries.find(element=>element[0]===sampleCode&&element[1]===n_variable);
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



}