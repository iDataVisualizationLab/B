/*
INPUT:
file data of various structures

OUTPUT:
data for plots: state -> pair of variables -> array of points in temporal order
*/

function plot_data (file) {
    let result = {};
    let data = {};

    let timeArray = file[0].columns;
    timeArray.splice(0,1);
    let stateArray = file[1].map(e=>e.name);
    let sectorArray = file[2].map(e=>e.name);

    for (let s = 0; s < stateArray.length; s++) {
        result[stateArray[s]] = {};
        data[stateArray[s]] = {};
        for (let i = 0; i < sectorArray.length-1; i++) {
            data[stateArray[s]][sectorArray[i]] = [];
            for (let j = i+1; j < sectorArray.length; j++) {
                result[stateArray[s]][sectorArray[i] + ' vs. ' + sectorArray[j]] = [];
                if (i === sectorArray.length-2 && j === sectorArray.length-1) data[stateArray[s]][sectorArray[j]] = [];
            }
        }
    }

    for (let i = 0; i < file[0].length; i++) {
        let id = file[0][i]['Series ID'];
        let stateCode = id.substring(3,5);
        let sectorCode = id.substring(10,18);
        let state = file[1].find(e=>e.code === stateCode).name;
        let sector = file[2].find(e=>e.code === sectorCode).name;
        for (let t = 0; t < timeArray.length; t++) {
            data[state][sector][t] = isNaN(parseFloat(file[0][i][timeArray[t]])) ? undefined : parseFloat(file[0][i][timeArray[t]]);
        }
    }

    for (let s = 0; s < stateArray.length; s++) {
        let state = stateArray[s];
        for (let i = 0; i < sectorArray.length-1; i++) {
            let x_variable = sectorArray[i];
            for (let j = i+1; j < sectorArray.length; j++) {
                let y_variable = sectorArray[j];
                for (let t = 0; t < timeArray.length; t++) {
                    let x = data[state][x_variable][t];
                    let y = data[state][y_variable][t];
                    if (x !== undefined && y !== undefined) {
                        result[state][x_variable+' vs. '+y_variable][t] = [x,y];
                    } else {
                        result[state][x_variable+' vs. '+y_variable][t] = null;
                    }
                }
            }
        }
    }

    return result;
}