// read data from files to the format:
// {instance -> variable -> time series}
class ReadFile {
    constructor() {
    }

    // bls structure of time series data
    // main data
    // Series ID, value at t1, value at t2, value at t3, ...
    // Series ID is defined in bls.gov
    // instance information
    // code,name
    // variable information
    // code,name
    // return data in format: data = {instance -> variable -> time series}
    static BLSType(files) {
        let data = {};
        // store time information to global variable
        netSP.timeInfo = [];
        files[0].columns.splice(0,1);
        netSP.timeInfo = files[0].columns;
        // store instance information to global variable
        // store variable information to global variable
        // store data in structure data -> instance -> variable -> time series
        netSP.instanceInfo = [];
        netSP.variableInfo = [];
        files[1].forEach((e,i)=>{
            netSP.instanceInfo.push([e.code,e.name]);
            data[e.name] = {};
            files[2].forEach(e_=>{
                if (!i) netSP.variableInfo.push([e_.code,e_.name]);
                data[e.name][e_.name] = [];
            });
        });
        files[0].forEach(e=>{
            let seriesID = e['Series ID'];
            let instanceCode = seriesID.substr(3,2);
            let variableCode = seriesID.substr(10,8);
            let instance = netSP.instanceInfo.find(e_=>e_[0]===instanceCode)[1];
            let variable = netSP.variableInfo.find(e_=>e_[0]===variableCode)[1];
            netSP.timeInfo.forEach((e_,i_)=>{
                data[instance][variable][i_] = isNaN(parseFloat(e[e_])) ? 'No value' : parseFloat(e[e_]);
            });
        });
        return data;
    }

}