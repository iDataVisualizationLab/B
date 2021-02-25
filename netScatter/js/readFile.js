// read data from files to the format:
// {instance -> variable -> time series}
class ReadFile {
    constructor() {
    }

    // Series ID: instanceCode_variableCode (type = 'normal')
    // Series ID: defined on bls.gov (type = 'BLS')
    // Series ID, value at t1, value at t2, ...
    // return data in format: {instance -> variable -> time series}
    static IVTFormat(files,type) {
        let data = {};
        // store time information to global variable
        netSP.timeInfo.length = 0;
        if (type === 'death-birth') {
            files[0].columns.splice(0,3);
        } else {
            files[0].columns.splice(0,1);
        }
        netSP.timeInfo = files[0].columns;
        // store instance information to global variable
        // store variable information to global variable
        // store data in structure data -> instance -> variable -> time series
        netSP.instanceInfo.length = 0;
        netSP.variableInfo.length = 0;
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
            let instanceCode = '', variableCode = '';
            switch (type) {
                case 'BLS':
                    instanceCode = seriesID.substr(3,2);
                    variableCode = seriesID.substr(10,8);
                    break;
                case 'normal':
                    instanceCode = seriesID.split('_')[0];
                    variableCode = seriesID.split('_')[1];
                    break;
                case 'death-birth':
                    instanceCode = e['CountryCode'];
                    variableCode = e['Type'];
                    break;
            }
            let instance = netSP.instanceInfo.find(e_=>e_[0]===instanceCode)??'no';
            let variable = netSP.variableInfo.find(e_=>e_[0]===variableCode)??'no';
            if (instance!=='no'&&variable!=='no') {
                netSP.timeInfo.forEach((e_,i_)=>{
                    data[instance[1]][variable[1]][i_] = isNaN(parseFloat(e[e_])) ? 'No value' : parseFloat(e[e_]);
                });
            }
        });
        return data;
    }

}