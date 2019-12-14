/////////////////////
/////////////////////
// DECLARE VARIABLES
/////////////////////
////////////////////

let measures = [];  // measures[index][sample][x-var,y-var,value], value = -1 means no data
let nummeasure = 12;
let measurename = [
    'Outlying',
    'Skinny',
    'Skewed',
    'Clumpy',
    'Sparse',
    'Striated',
    'Trend',
    'Constant',
    "Intersections",
    "Loop",
    'Cross-correlation',
    'Length',
];
let measureObj = {
    'Outlying':0,
    'Skinny':1,
    'Skewed':2,
    'Clumpy':3,
    'Sparse':4,
    'Striated':5,
    'Trend':6,
    'Constant':7,
    "Intersections":8,
    "Loop":9,
    'Cross-correlation':10,
    'Length':11
};

// VARIABLES FOR STORING DATA
let data = []; // data[sample][variable][time step] for raw data
let mapsample0 = new Map(); // code -> data sample name
let mapsample1 = new Map(); // data sample name -> index in data[data sample]
let mapsample2 = new Map(); // index -> data sample name
let mapvar0 = new Map();  // code -> variable name
let mapvar1 = new Map();  // variable name -> index in data[variable]
let mapvar2 = new Map(); // index -> variable name
let timedata =[];

// VARIABLES FOR CALCULATIONS
let numcell = 40;
let cellsize = 1/numcell;
let cellval = [];
let minloop = 0;
let maxloop = 48;
let lag = 48;
let selecteddata = 4;

// VARIABLES FOR CONTROLLING
let needupdate = false;
// let needcalculation = true; //TO DO
let needcalculation = true;

// VARIABLES FOR VISUALIZATION
let displayplot = [];   // displayplot[measure index][0->numplot-1:lowest, numplot->2numplot-1: middle, 2numplot->3numplot-1: highest][sample, x-var, y-var,value,index]
let width = 2000;
let height = 4000;
let numColumn = 64;
let columnSize = width/numColumn;
let numplot = 5;
let newnumplot = 0;
let selectedmeasure = 0;
let choose = false;   // for selections
let type = [0,0,0,0,0,0,1,1,1,1,1,2];   // for type of measures in selection button
let checkfilter = [];
let valfilter = [];
for (var i = 0; i < nummeasure; i++) {
    checkfilter[i] = false;
    valfilter[i] = [0,1];
}
// radar control
// var MetricController = radarController();



////////////////////////////////
////////////////////////////////
// UI CODE
///////////////////////////////
///////////////////////////////

$( document ).ready(function() {
    try {
        $('.collapsible').collapsible();
        $('.modal').modal();
        $('.dropdown-trigger').dropdown();
        $('.tabs').tabs();
        $('.sidenav').sidenav();
        discovery('#sideNavbtn');
        openNav();
        d3.select("#DarkTheme").on("click", switchTheme);

        // generate measurement list
        let mc = d3.select('#measureControl').selectAll('.measureControl')
            .data(measurename)
            .enter().append('div').attr('class', 'measureControl row valign-wrapper')
            .attr('disabled','disabled');

        let mc_labelr = mc.append('label').attr('class', 'col s2');
        mc_labelr.append('input').attr('type', 'radio').attr('name', 'orderMeasure').attr('class', 'with-gap')
            .attr('checked',d=>selectedmeasure===measureObj[d]?'':null)
            .on('change',function(d){
                selectedmeasure = measureObj[d];
                needupdate = true;
            });
        mc_labelr.append('span');
        let mc_labeln = mc.append('label').attr('class', 'col s6');
        mc_labeln.append('span').attr('class', 'col measureLabel')
            .style('color',d=>'rgb('+getcolor(measureObj[d]).join(',')+')').style('font-size','medium').style('font-family','Arial')
            .text(d => d);
        let mc_label = mc.append('label').attr('class', 'col s1');
        mc_label.append('input').attr('type', 'checkbox').attr('class', 'filled-in enableCheck')
            .on('change',function(d){
                checkfilter[measureObj[d]] = this.checked;
                d3.select(this.parentNode.parentNode).attr('disabled',this.checked?null:'disabled');
                needupdate = true;
            });
        mc_label.append('span');
        mc.append('div').attr('class','sliderHolder col s3').each(function(){
            noUiSlider.create(this, {
                start: [0, 1],
                connect: true,
                range: {
                    'min': 0,
                    'max': 1
                },
            }).on('change',function(values){
                valfilter[measureObj[d3.select(this.target).datum()]][0] = +(values[0]);
                valfilter[measureObj[d3.select(this.target).datum()]][1] = +(values[1]);
                needupdate = true;
            });
        });

        // Radar control
        // MetricController.graphicopt({width:365,height:365})
        //     .div(d3.select('#RadarController'))
        //     .tablediv(d3.select('#RadarController_Table'))
        //     .axisSchema(serviceFullList)
        //     .onChangeValue(onSchemaUpdate)
        //     .onChangeFilterFunc(onfilterdata)
        //     .init();
        // set event for viz type
        $('input[type=radio][name=viztype]').change(function() {
            updateViztype(this.value);
        });

        d3.select('#majorGroupDisplay_control').on('change',function() {
            radarChartclusteropt.boxplot = $(this).prop('checked');
            cluster_map(cluster_info)
        });
        // data options
        d3.select('#datacom').on('change',function(){
           selecteddata = +this.value;
           needcalculation = true;
           d3.select('.cover').classed('hidden', false);
        });
        // display mode
        // d3.select('#displaymode').on('change',function (){
        //     choose = (+this.value !== 0);
        //     needupdate = true;
        //     console.log('mode = '+this.value);
        // });
    }catch{}
});
function openNav() {
    d3.select("#mySidenav").classed("sideIn",true);
    d3.select("#Maincontent").classed("sideIn",true);
    // _.delay(resetSize, 500);
}

function closeNav() {
    d3.select("#mySidenav").classed("sideIn",false);
    d3.select("#Maincontent").classed("sideIn",false);
    discovery('#sideNavbtn');
    // _.delay(resetSize, 500);
}
function discovery(d){
    d3.select(d).style('left','20px')
        .classed("pulse",true)
        .transition().delay(5000).duration(1000)
        .style('left',null)
    //     .on('end',function() {
    //     // d3.select(d).classed("pulse",false);
    // });

}
function switchTheme(){
    if (this.getAttribute('value')==="light"){
        this.setAttribute('value', "dark");
        this.querySelector('span').textContent = "Light";
        d3.select('body').classed('light',false);
        d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HiperView/images/TTUlogoWhite.png");
        return;
    }
    this.setAttribute('value', "light");
    this.querySelector('span').textContent = "Dark";
    d3.select('body').classed('light',true);
    d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HPCViz/images/TTUlogo.png");
    return;
}
////////////////////////////////
////////////////////////////////
// END OF UI CODE
///////////////////////////////
///////////////////////////////





// ///////////////////////////
////////////////////////////////
// MAIN CODE FOR ANALYZING DATA
///////////////////////////////
//////////////////////////////
function analyzedata() {

    let filename0;
    let filename1;
    let filename2;
    switch (selecteddata) {
        case 0:
           filename0 =  "data/employment.txt";
           filename1 = "data/statecode.txt";
           filename2 = "data/Industrycode.txt";
           break;
        case 1:
            filename0 = "data/HPCC_21Mar2019_7am_4pm.csv";
            filename1 = "data/HPCC_host.tsv";
            filename2 = "data/HPCC_service.tsv";
            break;
        case 2:
            filename0 = "data/RUL_data.txt";
            filename1 = "data/engine_code.txt";
            filename2 = "data/sensor_code.txt";
            break;
        case 3:
            filename0 = "data/stock_data.txt";
            filename1 = "data/year_code.txt";
            filename2 = "data/var_code.txt";
            break;
        case 4:
            filename0 = "data/data.txt";
            filename1 = "data/example_sample_code.txt";
            filename2 = "data/example_variable_code.txt";
            break;
    }

    Promise.all([
        d3.csv(filename0),
        d3.tsv(filename1),
        d3.tsv(filename2),
    ]).then(function (files) {

        data = []; // data[sample][variable][time step] for raw data
        mapsample0.clear(); // code -> data sample name
        mapsample1.clear(); // data sample name -> index in data[data sample]
        mapsample2.clear(); // index -> data sample name
        mapvar0.clear();  // code -> variable name
        mapvar1.clear();  // variable name -> index in data[variable]
        mapvar2.clear(); // index -> variable name
        timedata =[];

///////////////////////////////////////
// READ DATA TO RESTORING VARIABLES
//////////////////////////////////////

        //MAP DATA sample
        files[1].forEach(function (sample, p) {
            if (!mapsample0.get(sample.code)) mapsample0.set(sample.code, sample.name);  // code-string to name-string
            if (!mapsample1.get(sample.name)) mapsample1.set(sample.name, p);  // name-string to index-number
            if (!mapsample2.get(p)) mapsample2.set(p, sample.name);   // index-number to name-string
            data[p] = [];
        });

        // MAP VARIABLES
        files[2].forEach(function (variable, v) {
            if (!mapvar0.get(variable.code)) mapvar0.set(variable.code, variable.name);  // code-string to name-string
            if (!mapvar1.get(variable.name)) mapvar1.set(variable.name, v);  // name-string to index-number
            if (!mapvar2.get(v)) mapvar2.set(v, variable.name);
            data.forEach(function (d) {
                d[v] = [];
            });
        });

        // TIME NAME
        timedata = files[0].columns.filter(function (step) {
            return step !== "Series ID"
        });

        switch (selecteddata) {
            case 0:
                // WRITE DATA TO DATA[]
                data.forEach(function (sample) {
                    sample.forEach(function (variable) {
                        timedata.forEach(function (step, s) {
                            variable[s] = -Infinity;
                        });
                    });
                });
                files[0].forEach(function (line) {
                    var sampleindex = mapsample1.get(mapsample0.get(line["Series ID"].substr(3, 2)));
                    var varindex = mapvar1.get(mapvar0.get(line["Series ID"].substr(10, 8)));
                    timedata.forEach(function (step, s) {
                        if (sampleindex !== 56 && sampleindex !== 72) {
                            data[sampleindex][varindex][s] = isNaN(parseFloat(line[step])) ? -Infinity : parseFloat(line[step]);
                        } else {
                            data[sampleindex][varindex][s] = -Infinity;
                        }
                    });
                });
                break;
            default:
                // WRITE DATA TO DATA[]
                data.forEach(function (sample) {
                    sample.forEach(function (variable) {
                        timedata.forEach(function (step, s) {
                            variable[s] = -Infinity;
                        });
                    });
                });
                files[0].forEach(function (line) {
                    var sampleindex = parseInt(line["Series ID"].split("_")[0]);
                    var varindex = parseInt(line["Series ID"].split("_")[1]);
                    timedata.forEach(function (step, s) {
                        data[sampleindex][varindex][s] = isNaN(parseFloat(line[step])) ? -Infinity : parseFloat(line[step]);
                    });
                });
        }

/////////////////////////
// END OF READING DATA
///////////////////////

///////////////////////
// CALCULATION CODE
/////////////////////

        // CONTROL CALCULATION

        if(selecteddata!==4) normalization();

        calculatemeasures();
        console.log(data);

        // NORMALIZE DATA
        // find min and max of each series -> normalize
        // local normalization
        function normalization() {
            data.forEach(function (sample, p) {
                sample.forEach(function (variable, v) {
                    var svariable = variable.filter(function (d) {return d !== - Infinity});
                    var mymax = Math.max(...svariable);
                    var mymin = Math.min(...svariable);
                    var myrange = mymax - mymin;
                    if (myrange !== 0) {
                        variable.forEach(function (step, s) {
                            data[p][v][s] = (step !== -Infinity) ? (step - mymin) / myrange : -1;
                        });
                    } else {
                        variable.forEach(function (step, s) {
                            data[p][v][s] = -1;
                        });
                    }
                });
            });
            // WRITE DATA TO DRAWDATA[]
            // data.forEach(function (sample,p) {
            //   drawdata[p] = [];
            //   sample.forEach(function (variable,v) {
            //     drawdata[p][v] = variable.filter(function(step){return step >=0});
            //   });
            // });
        }

        // CALCULATE MEASURES FOR TIME SERIES
        function calculatemeasures() {
            for (var i=0; i<nummeasure; i++) {
                measures[i] = [];
            }
            data.forEach(function (sample, p) {

                // Declare measure structures
                for (var i = 0; i < nummeasure; i++) {
                    measures[i][p] = [];
                }
                var index = 0;
                // Each plot
                for (var yvar = 0; yvar < mapvar0.size; yvar++) {
                    for (var xvar = 0; xvar < yvar; xvar++) {

                        // Initialize measure values
                        for (var i = 0; i < nummeasure; i++) {
                            measures[i][p][index] = [xvar, yvar, -1];
                        }

                        // create calculation data
                        var xdata = sample[xvar].map(function (x) {return x});
                        var ydata = sample[yvar].map(function (y) {return y});
                        xdata.forEach(function (x, ix) {ydata[ix] = (x === -1) ? -1 : ydata[ix];});
                        ydata.forEach(function (y, iy) {xdata[iy] = (y === -1) ? -1 : xdata[iy];});
                        xdata = xdata.filter(function (x) {return x >= 0});
                        ydata = ydata.filter(function (y) {return y >= 0});
                        if (xdata.length !== ydata.length)
                            console.log("2 series have different length at: sample = " + p + ", x-var = " + xvar + ", y-var = " + yvar);

                        // CALCULATIONS RELATED LENGTH
                        var edgelength = [];
                        var sumlength = 0;
                        xdata.forEach(function (x, xi) {
                            if (xi) {
                                var xlength = x - xdata[xi - 1];
                                var ylength = ydata[xi] - ydata[xi - 1];
                                edgelength[xi - 1] = Math.sqrt(xlength * xlength + ylength * ylength);
                                sumlength += edgelength[xi - 1];
                            }
                        });
                        var sortlength = edgelength.filter(function (v) {return v >= 0});
                        sortlength.sort(function (b, n) {return b - n});   // ascending

                        // OUTLYING
                        // measures[1][p][index][2] = Math.sqrt(Math.pow(xdata[xdata.length - 1] - xdata[0], 2) + Math.pow(ydata[ydata.length - 1] - ydata[0], 2)) / sumlength;
                        if (xdata.length > 1) {
                            measures[0][p][index][2] = 0;
                            var outlier = [];
                            var sindex = 0;
                            var q1 = sortlength[Math.floor(sortlength.length * 0.25)];
                            var q3 = sortlength[Math.floor(sortlength.length * 0.75)];
                            var upperlimit = q3 + 1.5 * (q3 - q1);
                            edgelength.forEach(function (e, ei) {
                                if (ei === 0) {
                                    if (e > upperlimit) {
                                        outlier[sindex] = ei;
                                        measures[0][p][index][2] += e;
                                        sindex += 1;
                                    }
                                } else if (ei === edgelength.length - 1) {
                                    if (e > upperlimit) {
                                        outlier[sindex] = ei + 1;
                                        measures[0][p][index][2] += e;
                                        sindex += 1;
                                        if (edgelength[ei - 1] > upperlimit) {
                                            outlier[sindex] = ei;
                                            measures[0][p][index][2] += edgelength[ei - 1];
                                            sindex += 1;
                                        }
                                    }
                                } else {
                                    if (e > upperlimit && edgelength[ei - 1] > upperlimit) {
                                        outlier[sindex] = ei;
                                        if (outlier[sindex - 1] !== outlier[sindex] - 1) {
                                            measures[0][p][index][2] += e + edgelength[ei - 1];
                                        } else {
                                            measures[0][p][index][2] += e;
                                        }
                                        sindex += 1;
                                    }
                                }
                            });
                            measures[0][p][index][2] /= sumlength;
                            if (measures[0][p][index][2] > 1) measures[0][p][index][2] = 1;
                            var adjust = 0;
                            outlier.forEach(function (v) {
                                xdata.splice(v - adjust, 1);
                                ydata.splice(v - adjust, 1);
                                adjust += 1;
                            });
                        }

                        // CALCULATIONS RELATED LENGTH AFTER REMOVING OUTLIERS
                        var edgelengtha = [];
                        var sumlengtha = 0;
                        var meanx = 0;
                        var meany = 0;
                        xdata.forEach(function (x, xi) {
                            if (xi) {
                                var xlength = x - xdata[xi - 1];
                                var ylength = ydata[xi] - ydata[xi - 1];
                                edgelengtha[xi - 1] = Math.sqrt(xlength * xlength + ylength * ylength);
                                sumlengtha += edgelengtha[xi - 1];
                            }
                            meanx += x;
                            meany += ydata[xi];
                        });
                        meanx /= xdata.length;
                        meany /= ydata.length;
                        var sortlengtha = edgelengtha.map(function (v) {
                            return v
                        });
                        sortlengtha.sort(function (b, n) {
                            return b - n
                        });   // ascending

                        // L-SHAPE
                        if (xdata.length > 1) {
                            measures[7][p][index][2] = 0;
                            var count = 0;
                            xdata.forEach(function (x, xi) {
                                if (xi) {
                                    if (x === xdata[xi - 1] || ydata[xi] === ydata[xi - 1]) count += 1;
                                }
                            });
                            // L-SHAPE
                            measures[7][p][index][2] = count / xdata.length;  // or timedata.length
                        }

                        // CALCULATE SOME MEASURES
                        // do not consider outliers and L-shape plots
                        // The threshold here is 0.6
                        if (xdata.length > 1) {
                            var dir = [0, 0, 0, 0];    // count directions for Trend
                            var countcrossing = 0;  // count #intersections
                            var sumcos = 0;   // sum of cosine of angles
                            // var looparr = [];
                            var looplength = 0;
                            xdata.forEach(function (x, xi) {
                                for (var i = xi + 1; i < xdata.length; i++) {   // for all data after x
                                    // count directions for MONOTONIC TREND
                                    var xx = xdata[i] - x;
                                    var yy = ydata[i] - ydata[xi];
                                    if (xx > 0 && yy > 0) dir[0] += 1;
                                    if (xx < 0 && yy > 0) dir[1] += 1;
                                    if (xx < 0 && yy < 0) dir[2] += 1;
                                    if (xx > 0 && yy < 0) dir[3] += 1;
                                    // check intersections for INTERSECTIONS
                                    if (i > xi + 1 && i < xdata.length - 1 && xi < xdata.length - 3) {
                                        if (checkintersection(x, ydata[xi], xdata[xi + 1], ydata[xi + 1], xdata[i], ydata[i], xdata[i + 1], ydata[i + 1])) {
                                            // looparr[countcrossing] = i-xi;
                                            if ((i - xi) > minloop && (i - xi) < maxloop) {
                                                looplength = (looplength < (i - xi)) ? i - xi : looplength;
                                            }
                                            countcrossing += 1;
                                        }
                                    }
                                }
                                if (xi > 0 && xi < xdata.length - 1) {
                                    // sumcos += Math.abs(calculatecos(xdata[xi - 1], ydata[xi - 1], x, ydata[xi], xdata[xi + 1], ydata[xi + 1]));
                                    sumcos += calculatecos(xdata[xi - 1], ydata[xi - 1], x, ydata[xi], xdata[xi + 1], ydata[xi + 1]);
                                }
                            });
                            // LENGTH
                            measures[11][p][index][2] = sumlengtha / (xdata.length - 1);
                            if (measures[11][p][index][2] > 1) measures[11][p][index][2] = 1;
                            // MONOTONIC TREND
                            measures[6][p][index][2] = (4/3)*Math.max(...dir) / (xdata.length * (xdata.length - 1) / 2)-1/3;
                            // INTERSECTIONS
                            measures[8][p][index][2] = 1 - Math.exp(-countcrossing / (xdata.length - 1));
                            // STRIATED
                            measures[5][p][index][2] = (sumcos / (xdata.length - 2))*0.5+0.5;
                            // STRAIGHT
                            // measures[1][p][index][2] = Math.sqrt(Math.pow(xdata[xdata.length - 1] - xdata[0], 2) + Math.pow(ydata[ydata.length - 1] - ydata[0], 2)) / sumlength;
                            // SKEWED
                            var q10 = sortlengtha[Math.floor(sortlengtha.length * 0.1)];
                            var q50 = sortlengtha[Math.floor(sortlengtha.length * 0.5)];
                            var q90 = sortlengtha[Math.floor(sortlengtha.length * 0.9)];
                            measures[2][p][index][2] = (q90 - q50) / (q90 - q10);
                            // SPARSE
                            measures[4][p][index][2] = q90;

                            // CLUMPY
                            xdata.forEach(function (x, xi) {
                                var countleft = 0;
                                var countright = 0;
                                var maxleft = 0;
                                var maxright = 0;
                                for (var j = xi - 1; j >= 0; j--) {
                                    if (edgelengtha[j] >= edgelengtha[xi]) break;
                                    countleft += 1;
                                    maxleft = (maxleft < edgelengtha[j]) ? edgelengtha[j] : maxleft;
                                }
                                for (j = xi + 1; j < xdata.length; j++) {
                                    if (edgelengtha[j] >= edgelengtha[xi]) break;
                                    countright += 1;
                                    maxright = (maxright < edgelengtha[j]) ? edgelengtha[j] : maxright;
                                }
                                if (countleft > 0 && countright > 0) {
                                    var maxxi = (countright > countleft) ? maxright : maxleft;
                                    maxxi /= edgelengtha[xi];
                                    maxxi = 1 - maxxi;
                                    measures[3][p][index][2] = (measures[3][p][index][2] < maxxi) ? maxxi : measures[3][p][index][2];
                                }
                            });

                            // LOOP
                            // if (measures[8][p][index][2] < 0.1 && measures[10][p][index][2] < 0.01) {
                            //   var windowsize = Math.floor(xdata.length*0.3);
                            //   measures[9][p][index][2] = 0;
                            //   var dist;
                            //   xdata.forEach(function (x,xi) {
                            //     if (xi + windowsize < xdata.length) {
                            //       dist = Math.sqrt(Math.pow(xdata[xi+windowsize]-x,2)+Math.pow(ydata[xi+windowsize]-ydata[xi],2));
                            //       var windowlength = 0;
                            //       for (var i = xi; i < xi + windowsize; i++) {
                            //         windowlength += Math.sqrt(Math.pow(xdata[xi+i]-x,2)+Math.pow(ydata[xi+i]-ydata[xi],2));
                            //       }
                            //       measures[9][p][index][2] = (measures[9][p][index][2] < (1-dist/windowlength)) ? (1-dist/windowlength) : measures[9][p][index][2];
                            //     }
                            //   });
                            // }
                            // if (measures[8][p][index][2] < 0.05) {
                            //   looparr.sort(function (b,n) {return b-n});
                            //   measures[9][p][index][2] = looparr[Math.floor(looparr.length*0.25)]/xdata.length;
                            // }
                            measures[9][p][index][2] = (looplength > 0) ? (looplength-minloop) / (maxloop - minloop) : 0;
                            // measures[9][p][index][2] = (looplength > 0) ? looplength / xdata.length : 0;

                            // CROSS - CORRELATION
                            var maxr = 0;
                            var covxy = 0;
                            var covx = 0;
                            var covy = 0;
                            var sim = 0;
                            var minsim = Infinity;
                            var getLag = lag;
                            for (var i = -lag; i < lag + 1; i++) {
                                if (i <= 0) {
                                    for (var j = 0; j < xdata.length - lag; j++) {
                                        covxy += (xdata[j] - meanx) * (ydata[j - i] - meany);
                                        covx += Math.pow(xdata[j] - meanx, 2);
                                        covy += Math.pow(ydata[j - i] - meany, 2);
                                        sim += Math.abs(xdata[j] - ydata[j - i]);
                                    }
                                    var r = Math.abs(covxy / Math.sqrt(covx * covy));
                                    getLag = (minsim > sim) ? i : getLag;
                                    minsim = (minsim > sim) ? sim : minsim;
                                } else {
                                    for (var j = 0; j < xdata.length - lag; j++) {
                                        covxy += (xdata[j + i] - meanx) * (ydata[j] - meany);
                                        covx += Math.pow(xdata[j + i] - meanx, 2);
                                        covy += Math.pow(ydata[j] - meany, 2);
                                        sim += Math.abs(xdata[j + i] - ydata[j]);
                                    }
                                    var r = Math.abs(covxy / Math.sqrt(covx * covy));
                                    getLag = (minsim > sim) ? i : getLag;
                                    minsim = (minsim > sim) ? sim : minsim;
                                }
                                maxr = (maxr < r) ? r : maxr;
                            }
                            measures[10][p][index][2] = maxr;

                            // SIMILARITY
                            // measures[10][p][index][2] = 1 - minsim / (xdata.length-getLag);

                            // CALCULATE AREA
                            // set value of bins inside triangles is 1, outside triangles is 0
                            // count bin of 1, multiple it with cell area
                            for (var i = 0; i < numcell; i++) {
                                cellval[i] = [];
                                for (var j = 0; j < numcell; j++) {
                                    cellval[i][j] = 0;
                                }
                            }
                            if (xdata.length > 3) {
                                for (var i = 0; i < xdata.length - 2; i++) {
                                    var xmax = Math.max(...[xdata[i], xdata[i + 1], xdata[i + 2]]);
                                    var xmin = Math.min(...[xdata[i], xdata[i + 1], xdata[i + 2]]);
                                    var ymax = Math.max(...[ydata[i], ydata[i + 1], ydata[i + 2]]);
                                    var ymin = Math.min(...[ydata[i], ydata[i + 1], ydata[i + 2]]);
                                    xmin = Math.floor(xmin / cellsize);
                                    xmax = Math.ceil(xmax / cellsize);
                                    ymin = Math.floor(ymin / cellsize);
                                    ymax = Math.ceil(ymax / cellsize);
                                    for (var j = xmin; j <= xmax; j++) {
                                        for (var k = ymin; k <= ymax; k++) {
                                            var xcell = j * cellsize + cellsize / 2;
                                            var ycell = k * cellsize + cellsize / 2;
                                            if (checkinsidetriangle(xcell, ycell, xdata[i], ydata[i], xdata[i + 1], ydata[i + 1], xdata[i + 2], ydata[i + 2])) {
                                                cellval[j][k] = 1;
                                            }
                                        }
                                    }
                                }
                                measures[1][p][index][2] = 0;
                                cellval.forEach(function (row) {
                                    row.forEach(function (column) {
                                        measures[1][p][index][2] += column;
                                    });
                                });
                                measures[1][p][index][2] *= cellsize * cellsize;
                                measures[1][p][index][2] = 1 -  measures[1][p][index][2];
                            }


                        }


                        // increase index
                        index += 1;
                    }
                }

            });
        }

        // CHECK INTERSECTIONS
        function checkintersection(x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_) {
            var x1 = x1_;
            var y1 = y1_;
            var x2 = x2_;
            var y2 = y2_;
            var x3 = x3_;
            var y3 = y3_;
            var x4 = x4_;
            var y4 = y4_;
            var v1x = x2 - x1;
            var v1y = y2 - y1;
            var v2x = x4 - x3;
            var v2y = y4 - y3;
            var v23x = x3 - x2;
            var v23y = y3 - y2;
            var v24x = x4 - x2;
            var v24y = y4 - y2;
            var v41x = x1 - x4;
            var v41y = y1 - y4;
            var checkv1 = (v1x * v23y - v1y * v23x) * (v1x * v24y - v1y * v24x);
            var checkv2 = (v2x * v41y - v2y * v41x) * (v2y * v24x - v2x * v24y);
            var check = (checkv1 < 0) && (checkv2 < 0);
            return check;
        }

        // CALCULATE COSINE OF ANGLES
        // input: coordinates of 3 points: 1, 2 and 3
        // construct vector 1->2 and 2->3
        // calculate dot product of 2 vectors
        // get the angle
        function calculatecos(x1_, y1_, x2_, y2_, x3_, y3_) {
            var v1x = x2_ - x1_;
            var v1y = y2_ - y1_;
            var v2x = x3_ - x2_;
            var v2y = y3_ - y2_;
            var dotproduct = v1x * v2x + v1y * v2y;
            var v1 = Math.sqrt(v1x * v1x + v1y * v1y);
            var v2 = Math.sqrt(v2x * v2x + v2y * v2y);
            var cosangle;
            if (v1*v2 !== 0) {
                cosangle = dotproduct / (v1 * v2);
            } else
                cosangle = 0;
            return cosangle;
        }

        // CHECK INSIDE TRIANGLE
        // input: point need to check: O, 3 points of triangle: A, B, C
        // method: cross-product of OAxAB, OBxBC, and OCxCA have the same signs -> inside
        function checkinsidetriangle(x0_, y0_, x1_, y1_, x2_, y2_, x3_, y3_) {
            var x0 = x0_;
            var y0 = y0_;
            var x1 = x1_;
            var y1 = y1_;
            var x2 = x2_;
            var y2 = y2_;
            var x3 = x3_;
            var y3 = y3_;
            var checkline = ((x2-x1)/(x3-x1) === (y2-y1)/(y3-y1));
            if (!checkline) {
                var xOA = x1 - x0;
                var yOA = y1 - y0;
                var xOB = x2 - x0;
                var yOB = y2 - y0;
                var xOC = x3 - x0;
                var yOC = y3 - y0;
                var xAB = x2 - x1;
                var yAB = y2 - y1;
                var xBC = x3 - x2;
                var yBC = y3 - y2;
                var xCA = x1 - x3;
                var yCA = y1 - y3;
                var check1 = xOA * yAB - yOA * xAB;
                var check2 = xOB * yBC - yOB * xBC;
                var check3 = xOC * yCA - yOC * xCA;
                var check = (check1 > 0 && check2 > 0 && check3 > 0) || (check1 < 0 && check2 < 0 && check3 < 0);
            } else var check = false;
            return check;
        }

        needupdate = true;
        d3.select('.cover').classed('hidden', true);
///////////////////////
// END OF CALCULATION
///////////////////////
    });
    needcalculation = false;
}

// SORT MEASURES AND WRITE DISPLAYPLOT
function sortmeasures() {
    displayplot = [];
    for (var i = 0; i < nummeasure; i++) {
        var sortarr = [];
        var aindex = 0;
        measures[i].forEach(function (sample,si) {
            sample.forEach(function (arr,index) {
                var condition = [];
                var numfilter = 0;
                for (var j = 0; j < nummeasure; j++) {
                    if (checkfilter[j]) {
                        condition[numfilter] = false;
                        if (measures[j][si][index][2] >= valfilter[j][0] && measures[j][si][index][2] <= valfilter[j][1]) {
                            condition[numfilter] = true;
                            numfilter += 1;
                        }
                    }
                }
                var good = true;
                condition.forEach(function (value) {
                    good = good && value;
                });
                if (good) {
                    sortarr[aindex] = [si,arr[0],arr[1],arr[2],index];
                    aindex += 1;
                }
            });
        });
        sortarr = sortarr.filter(function (b) {return b[3] >= 0});
        sortarr.sort(function (b,n) {return b[3] - n[3]});    // ascending
        if (sortarr.length >= 3*numplot) {
            displayplot[i] = [];
            for (var j = 0; j < numplot; j++) {  // get the lowest paths
                displayplot[i][j] = sortarr[j];
            }
            for (var j = numplot; j < 2*numplot; j++) {  // get the middle paths
                displayplot[i][j] = sortarr[Math.floor(sortarr.length*0.5)+j-numplot];
            }
            for (var j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
                displayplot[i][j] = sortarr[sortarr.length+j-3*numplot];
            }
            newnumplot = 0;
        } else {
            newnumplot = sortarr.length;
            displayplot[i] = [];
            for (var j = 0; j < newnumplot; j++) {  // get the lowest paths
                displayplot[i][j] = sortarr[j];
            }
        }
    }
}
/////////////////////
////////////////////
// END OF MAIN CODE
////////////////////
////////////////////





////////////////////////////
////////////////////////////
// VISUALIZATION CODE HERE
////////////////////////////
////////////////////////////



///////////////////
// SET UP FUNCTION
//////////////////
// Variables
let csPlotSize = 6*columnSize;
let oPlotSize = 3*columnSize;
let rPlotSize = 3*columnSize;
let xBlank = 2*columnSize;
let xgBlank = 6*columnSize;
let yBlank = 50;
let ygBlank = csPlotSize*0.3;
let groupSize = oPlotSize+2*xBlank+csPlotSize+rPlotSize;

function setup() {
    let canvas = createCanvas(width,height);
    canvas.parent('mainCanvasHolder');
    frameRate(30);
}

// function windowResized() {
//   if (windowWidth<1000)
//     resizeCanvas(width, height*3);
//   else
//     resizeCanvas(width, height);
// }

///////////////////////////
// END OF SET UP FUNCTION
//////////////////////////



//////////////////
// DRAW FUNCTION
/////////////////
function getcolor(measure) {
    switch (type[measure]) {
        case 0:
            return [18, 169, 101];
            break;
        case 1:
            return [232, 101, 11];
            break;
        case 2:
            return [89, 135, 222];
            break;
        default:
            return [0,0,0];
            break;
    }
}

function draw() {
    if(needcalculation) {
        analyzedata();
        // MetricController.axisSchema(serviceFullList, true).update();
        // MetricController.data(data.result.arr).drawSummary(data.result.hindex);
    }
    if (needupdate){
        background(200);

            // CHOOSE DISPLAY PLOTS
            sortmeasures();
            textFont('Arial Unicode MS');

            if (displayplot[selectedmeasure].length === 0) {
                textSize(30);
                text('There is no plot to display',xBlank,yBlank);
            } else {
                // draw background of buttons
                // fill(160);
                // noStroke();
                // rect(0,0,width,50+plotsize/4);
                // Write group notation
                fill(0);
                noStroke();
                textSize(csPlotSize/8);
                text('Lowest values',2*xBlank+oPlotSize,yBlank);
                text('Middle values',4*xBlank+xgBlank+2*oPlotSize+csPlotSize,yBlank);
                text('Highest values',6*xBlank+2*xgBlank+3*oPlotSize+2*csPlotSize,yBlank);
                // textSize(plotsize/12);
                // text('select measure',xstartpos+plotsize+2*xblank1+0.5*splotsize,16+plotsize/10);
                // Color explanation
                // fill(18, 169, 101);
                // rect(xstartpos+plotsize,20,plotsize/12,plotsize/12);
                // fill(232, 101, 11);
                // rect(xstartpos+plotsize,30+plotsize/12,plotsize/12,plotsize/12);
                // fill(89, 135, 222);
                // rect(xstartpos+plotsize,40+plotsize/6,plotsize/12,plotsize/12);
                // fill(0);
                // textSize(plotsize/12);
                // text('Measures from Scagnostics of non time series data',xstartpos+plotsize+plotsize/6,16+plotsize/11);
                // text('Measures from features of connected scatterplot',xstartpos+plotsize+plotsize/6,26+plotsize/6);
                // text('Measures under developing',xstartpos+plotsize+plotsize/6,36+plotsize/4);
                // Formula
                // text('Formula for this measure:',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,16+plotsize/11);
                // switch (selectedmeasure) {
                //     case 0:
                //         text(measurename[selectedmeasure]+' = '+'Q75+1.5(Q75-Q25)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 1:
                //         text(measurename[selectedmeasure]+' = '+'distance(p1,pN)/(total edge length)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         text('p1: first point in the series, pN: last point in the series',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 2:
                //         text(measurename[selectedmeasure]+' = '+'(Q90-Q50)/(Q90-Q10)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         text('Q90, Q50 and Q10 are correspondingly 90th, 50th and 10th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 3:
                //         text(measurename[selectedmeasure]+' = '+'max_j[1-max_k(e_k)/e_j]',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         text('e_k is edge in Runt set from e_j, e_j is edge in the graph',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 4:
                //         text(measurename[selectedmeasure]+' = '+'Q90',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         text('Q90 is 90th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 5:
                //         text(measurename[selectedmeasure]+' = '+'mean of cosine of all angles',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 6:
                //         text(measurename[selectedmeasure]+' = '+'maximum number of directions of e_ij / (N(N-1)/2)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         text('e_ij is edge from i to all point j after i',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 7:
                //         text(measurename[selectedmeasure]+' = '+'count number of edges that are parallel to x-axis or y-axis',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 8:
                //         text(measurename[selectedmeasure]+' = '+'1-exp(- #intersections / #edges)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 9:
                //         text(measurename[selectedmeasure]+' = '+'under developing',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                //     case 10:
                //         text(measurename[selectedmeasure]+' = '+'mean length of all edges',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                //         // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                //         break;
                // }

                // Create list button
                // if (!choose) {
                //     let colorv= getcolor(selectedmeasure);
                //     fill(colorv[0],colorv[1],colorv[2]);
                //     stroke(0);
                //     rect(xstartpos+plotsize+2*xblank1+1.5*splotsize,20,130,plotsize/10);
                //     fill(255);
                //     noStroke();
                //     triangle(xstartpos+plotsize+2*xblank1+1.5*splotsize+125,21+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+125-plotsize/30,21+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+125-plotsize/60,19+plotsize/10);
                //     triangle(xstartpos+plotsize+2*xblank1+1.5*splotsize+125,19+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+125-plotsize/30,19+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+125-plotsize/60,21);
                //     fill(0);
                //     noStroke();
                //     textSize(plotsize/12);
                //     // textAlign(CENTER);
                //     text(measurename[selectedmeasure],xstartpos+plotsize+2*xblank1+1.5*splotsize+20,16+plotsize/10);
                //     // textAlign(LEFT);
                // } else {
                //     for (var i = 0; i < nummeasure; i++) {
                //         if (mouseX > xstartpos + plotsize + 2 * xblank1 + 1.5 * splotsize && mouseX < xstartpos + plotsize + 2 * xblank1 + 1.5 * splotsize + 130 && mouseY > 20 + i * plotsize / 10 && mouseY < 20 + (i + 1) * plotsize / 10) {
                //             fill(255);
                //         } else
                //             switch (type[i]) {
                //                 case 0:
                //                     fill(179, 226, 205);
                //                     break;
                //                 case 1:
                //                     fill(253, 205, 172);
                //                     break;
                //                 case 2:
                //                     fill(203, 213, 232);
                //                     break;
                //                 case 3:
                //                     fill(244, 202, 228);
                //                     break;
                //             }
                //         stroke(0);
                //         rect(xstartpos + plotsize + 2 * xblank1 + 1.5 * splotsize, 20 + i * plotsize / 10, 130, plotsize / 10);
                //         fill(0);
                //         noStroke();
                //         textSize(plotsize / 12);
                //         // textAlign(CENTER);
                //         text(measurename[i], xstartpos + plotsize + 2 * xblank1 + 1.5 * splotsize + 20, 16 + (i + 1) * plotsize / 10);
                //         // textAlign(LEFT);
                //         if (i === selectedmeasure) {
                //             strokeWeight(2);
                //             stroke(0);
                //             line(xstartpos+plotsize+2*xblank1+1.5*splotsize+5,20+i*plotsize/10+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+5+plotsize/60,20+i*plotsize/10+2*plotsize/30);
                //             line(xstartpos+plotsize+2*xblank1+1.5*splotsize+5+plotsize/60,20+i*plotsize/10+2*plotsize/30,xstartpos+plotsize+2*xblank1+1.5*splotsize+5+plotsize/30,20+i*plotsize/10+plotsize/30);
                //             strokeWeight(1);
                //         }
                //     }
                // }


                // Draw plots
                var correctnumplot = (newnumplot === 0) ? numplot : Math.floor(newnumplot/3);
                for (var i = 0; i < numplot; i++) {
                    for (var j = 0; j < 3; j++) {

                        var sample = displayplot[selectedmeasure][i+j*correctnumplot][0];
                        var xvar = displayplot[selectedmeasure][i+j*correctnumplot][1];
                        var yvar = displayplot[selectedmeasure][i+j*correctnumplot][2];
                        var value = displayplot[selectedmeasure][i+j*correctnumplot][3];
                        var mindex = displayplot[selectedmeasure][i+j*correctnumplot][4];

                        // draw rectangles for CS
                        fill(255);
                        stroke(0);
                        rect(2*xBlank+oPlotSize+j*(groupSize+xgBlank),yBlank+50+i*(ygBlank+csPlotSize),csPlotSize,csPlotSize);

                        // draw rectangles for time series
                        fill(220);
                        noStroke();
                        rect(xBlank+j*(groupSize+xgBlank),yBlank+50+0.05*columnSize+oPlotSize+i*(csPlotSize+ygBlank),oPlotSize,oPlotSize); // x-data
                        stroke(0);
                        line(xBlank+j*(groupSize+xgBlank),yBlank+50+0.05*columnSize+oPlotSize+i*(csPlotSize+ygBlank),xBlank+j*(groupSize+xgBlank),yBlank+50+0.05*columnSize+2*oPlotSize+i*(csPlotSize+ygBlank));
                        line(xBlank+j*(groupSize+xgBlank),yBlank+50+0.05*columnSize+2*oPlotSize+i*(csPlotSize+ygBlank),xBlank+j*(groupSize+xgBlank)+oPlotSize,yBlank+50+0.05*columnSize+2*oPlotSize+i*(csPlotSize+ygBlank));
                        line(xBlank+j*(groupSize+xgBlank)+oPlotSize+2,yBlank+50+0.05*columnSize+1.5*oPlotSize+i*(csPlotSize+ygBlank),xBlank+j*(groupSize+xgBlank)+oPlotSize+xBlank*0.5,yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*0.5);
                        noStroke();
                        rect(xBlank+j*(groupSize+xgBlank),yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank),oPlotSize,oPlotSize); // y-data
                        stroke(0);
                        line(xBlank+j*(groupSize+xgBlank),yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank),xBlank+j*(groupSize+xgBlank)+oPlotSize,yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank));
                        line(xBlank+j*(groupSize+xgBlank),yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank),xBlank+j*(groupSize+xgBlank),yBlank+50-0.05*columnSize+oPlotSize+i*(csPlotSize+ygBlank));
                        line(xBlank+j*(groupSize+xgBlank)+oPlotSize+2,yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank)+0.5*oPlotSize,xBlank+j*(groupSize+xgBlank)+oPlotSize+xBlank*0.5,yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*0.5);
                        line(xBlank+j*(groupSize+xgBlank)+oPlotSize+xBlank*0.5,yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*0.5,xBlank+j*(groupSize+xgBlank)+oPlotSize+xBlank-2,yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*0.5);
                        fill(0);
                        triangle(xBlank+j*(groupSize+xgBlank)+oPlotSize+xBlank-2,yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*0.5,xBlank+j*(groupSize+xgBlank)+oPlotSize+xBlank-7,yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*0.5-5,xBlank+j*(groupSize+xgBlank)+oPlotSize+xBlank-7,yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*0.5+5);
                        timedata.forEach(function (time,step) {
                            if (step%12 === 0) {
                                line(xBlank+j*(groupSize+xgBlank)+step*oPlotSize/timedata.length,yBlank+50+0.05*columnSize+2*oPlotSize+i*(csPlotSize+ygBlank),xBlank+j*(groupSize+xgBlank)+step*oPlotSize/timedata.length,yBlank+50+0.05*columnSize+2*oPlotSize+i*(csPlotSize+ygBlank)-2);
                                line(xBlank+j*(groupSize+xgBlank)+step*oPlotSize/timedata.length,yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank)+oPlotSize,xBlank+j*(groupSize+xgBlank)+step*oPlotSize/timedata.length,yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank)+oPlotSize-2);
                            }
                        });
                        var xCenter = 3*xBlank+oPlotSize+csPlotSize+rPlotSize/2+j*(groupSize+xgBlank);
                        var yCenter = yBlank+50+csPlotSize/2+i*(csPlotSize+ygBlank);
                        fill(255);
                        stroke(150);
                        for (var k = 5; k > 0; k--) {
                            ellipse(xCenter,yCenter,rPlotSize*0.2*k,rPlotSize*0.2*k);
                        }
                        for (var k = 0; k < nummeasure-1; k++) {
                            var xp1 = xCenter+rPlotSize*Math.sin(Math.PI*2*k/nummeasure)/2;
                            var yp1 = yCenter-rPlotSize*Math.cos(Math.PI*2*k/nummeasure)/2;
                            stroke(150);
                            line(xCenter,yCenter,xp1,yp1);
                            var xp2 = xCenter+Math.round(measures[k][sample][mindex][2]*100)*rPlotSize*Math.sin(Math.PI*2*k/nummeasure)/200;
                            var yp2 = yCenter-Math.round(measures[k][sample][mindex][2]*100)*rPlotSize*Math.cos(Math.PI*2*k/nummeasure)/200;
                            var xp3 = xCenter+Math.round(measures[k+1][sample][mindex][2]*100)*rPlotSize*Math.sin(Math.PI*2*(k+1)/nummeasure)/200;
                            var yp3 = yCenter-Math.round(measures[k+1][sample][mindex][2]*100)*rPlotSize*Math.cos(Math.PI*2*(k+1)/nummeasure)/200;
                            switch (type[k]) {
                                case 0:
                                    fill(18, 169, 101);
                                    stroke(18, 169, 101);
                                    break;
                                case 1:
                                    fill(232, 101, 11);
                                    stroke(232, 101, 11);
                                    break;
                                case 2:
                                    fill(89, 135, 222);
                                    stroke(89, 135, 222);
                                    break;
                            }
                            triangle(xCenter,yCenter,xp2,yp2,xp3,yp3);
                            textSize(8);
                            noStroke();
                            if (k>nummeasure/2) {
                                textAlign(RIGHT);
                            }
                            text(measurename[k]+': '+Math.round(measures[k][sample][mindex][2]*100)/100,xCenter+(rPlotSize+10)*Math.sin(Math.PI*2*k/nummeasure)/2,yCenter-(rPlotSize+10)*Math.cos(Math.PI*2*k/nummeasure)/2);
                            textAlign(LEFT);
                        }
                        var xp1 = xCenter+rPlotSize*Math.sin(Math.PI*2*(nummeasure-1)/nummeasure)/2;
                        var yp1 = yCenter-rPlotSize*Math.cos(Math.PI*2*(nummeasure-1)/nummeasure)/2;
                        var xp2 = xCenter+Math.round(measures[nummeasure-1][sample][mindex][2]*100)*rPlotSize*Math.sin(Math.PI*2*(nummeasure-1)/nummeasure)/200;
                        var yp2 = yCenter-Math.round(measures[nummeasure-1][sample][mindex][2]*100)*rPlotSize*Math.cos(Math.PI*2*(nummeasure-1)/nummeasure)/200;
                        var xp3 = xCenter+Math.round(measures[0][sample][mindex][2]*100)*rPlotSize*Math.sin(0)/200;
                        var yp3 = yCenter-Math.round(measures[0][sample][mindex][2]*100)*rPlotSize*Math.cos(0)/200;
                        stroke(0);
                        line(xCenter,yCenter,xp1,yp1);
                        switch (type[nummeasure-1]) {
                            case 0:
                                fill(18, 169, 101);
                                stroke(18, 169, 101);
                                break;
                            case 1:
                                fill(232, 101, 11);
                                stroke(232, 101, 11);
                                break;
                            case 2:
                                fill(89, 135, 222);
                                stroke(89, 135, 222);
                                break;
                        }
                        triangle(xCenter,yCenter,xp2,yp2,xp3,yp3);
                        textSize(8);
                        noStroke();
                        textAlign(RIGHT);
                        text(measurename[k]+': '+Math.round(measures[k][sample][mindex][2]*100)/100,xCenter+(rPlotSize+10)*Math.sin(Math.PI*2*(nummeasure-1)/nummeasure)/2,yCenter-(rPlotSize+10)*Math.cos(Math.PI*2*(nummeasure-1)/nummeasure)/2);
                        textAlign(LEFT);

                        // write value of measure
                        noStroke();
                        fill(255);
                        textSize(csPlotSize/12);
                        text(measurename[selectedmeasure]+' = '+Math.round(value*100)/100,2*xBlank+oPlotSize+j*(groupSize+xgBlank)+csPlotSize*0.6,yBlank+50+i*(ygBlank+csPlotSize)-5);

                        // write sample notation
                        noStroke();
                        fill(0);
                        textSize(csPlotSize/12);
                        text(mapsample2.get(sample),2*xBlank+oPlotSize+j*(groupSize+xgBlank),yBlank+50+i*(ygBlank+csPlotSize)-5);

                        // write x-variable notation
                        noStroke();
                        fill(0);
                        textSize(csPlotSize/14);
                        if (mapvar2.get(xvar).split("").length <= 27) {
                            text(mapvar2.get(xvar),2*xBlank+oPlotSize+j*(groupSize+xgBlank),yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*1.1);
                        } else {
                            text(mapvar2.get(xvar).substr(0,27)+'...',2*xBlank+oPlotSize+j*(groupSize+xgBlank),yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*1.1);
                        }
                        text("time",xBlank+j*(groupSize+xgBlank),yBlank+50+0.05*columnSize+2*oPlotSize+i*(csPlotSize+ygBlank)+csPlotSize*0.1);
                        text("time",xBlank+j*(groupSize+xgBlank),yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank)-5);

                        //write y-variable notation
                        push();
                        noStroke();
                        fill(0);
                        textSize(csPlotSize/14);
                        translate(xBlank-5+j*(groupSize+xgBlank),yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank)+2*oPlotSize);
                        rotate(-PI/2);
                        if(mapvar2.get(yvar).split("").length <= 27) {
                            text(mapvar2.get(yvar),0,1.05*oPlotSize+xBlank-5);
                        } else {
                            text(mapvar2.get(yvar).substr(0,27)+'...',0,1.05*oPlotSize+xBlank-5);
                        }
                        if(mapvar2.get(xvar).split("").length <= 17) {
                            text(mapvar2.get(xvar),1.05*oPlotSize,0);
                        } else {
                            text(mapvar2.get(xvar).substr(0,17)+'...',1.05*oPlotSize,0);
                        }
                        if(mapvar2.get(yvar).split("").length <= 17) {
                            text(mapvar2.get(yvar),0,0);
                        } else {
                            text(mapvar2.get(yvar).substr(0,17)+'...',0,0);
                        }
                        pop();


                        // draw plots
                        timedata.forEach(function (time,step) {
                            if(step) {
                                // CS plots
                                if(data[sample][xvar][step]>=0 && data[sample][xvar][step-1]>=0 && data[sample][yvar][step]>=0 && data[sample][yvar][step-1]>=0) {
                                    var x1 = 0.05*csPlotSize+2*xBlank+oPlotSize+j*(groupSize+xgBlank)+0.9*csPlotSize*data[sample][xvar][step-1];
                                    var x2 = 0.05*csPlotSize+2*xBlank+oPlotSize+j*(groupSize+xgBlank)+0.9*csPlotSize*data[sample][xvar][step];
                                    var y1 = 0.05*csPlotSize+yBlank+50+i*(ygBlank+csPlotSize)+0.9*csPlotSize*(1-data[sample][yvar][step-1]);
                                    var y2 = 0.05*csPlotSize+yBlank+50+i*(ygBlank+csPlotSize)+0.9*csPlotSize*(1-data[sample][yvar][step]);
                                    if (step<timedata.length/2) stroke(0,0,255-255*step/(timedata.length/2));
                                    else stroke((step-timedata.length/2)*255/(timedata.length/2),0,0);
                                    line(x1,y1,x2,y2);
                                }
                                // X-var plots
                                if(data[sample][xvar][step]>=0 && data[sample][xvar][step-1]>=0) {
                                    var x1 = 0.05*oPlotSize+xBlank+j*(groupSize+xgBlank)+0.9*oPlotSize*(step-1)/timedata.length;
                                    var x2 = 0.05*oPlotSize+xBlank+j*(groupSize+xgBlank)+0.9*oPlotSize*step/timedata.length;
                                    var y1 = -0.05*oPlotSize+yBlank+50+0.05*columnSize+2*oPlotSize+i*(csPlotSize+ygBlank)-0.9*oPlotSize*data[sample][xvar][step-1];
                                    var y2 = -0.05*oPlotSize+yBlank+50+0.05*columnSize+2*oPlotSize+i*(csPlotSize+ygBlank)-0.9*oPlotSize*data[sample][xvar][step];
                                    if (step<timedata.length/2) stroke(0,0,255-255*step/(timedata.length/2));
                                    else stroke((step-timedata.length/2)*255/(timedata.length/2),0,0);
                                    line(x1,y1,x2,y2);
                                }
                                // Y-var plots
                                if(data[sample][yvar][step]>=0 && data[sample][yvar][step-1]>=0) {
                                    var x1 = 0.05*oPlotSize+xBlank+j*(groupSize+xgBlank)+0.9*oPlotSize*(step-1)/timedata.length;
                                    var x2 = 0.05*oPlotSize+xBlank+j*(groupSize+xgBlank)+0.9*oPlotSize*step/timedata.length;
                                    var y1 = -0.05*oPlotSize+yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank)+oPlotSize-0.9*oPlotSize*data[sample][yvar][step-1];
                                    var y2 = -0.05*oPlotSize+yBlank+50-0.05*columnSize+i*(csPlotSize+ygBlank)+oPlotSize-0.9*oPlotSize*data[sample][yvar][step];
                                    if (step<timedata.length/2) stroke(0,0,255-255*step/(timedata.length/2));
                                    else stroke((step-timedata.length/2)*255/(timedata.length/2),0,0);
                                    line(x1,y1,x2,y2);
                                }
                            }
                        });
                    }
                }

                needupdate = false;
            }
    }
}

// function mousePressed() {
//     for (var i = 0; i < numplot; i++) {
//         for (var j = 0; j < 3; j++) {
//             if (mouseX > xstartpos + j * (plotsize + 2 * splotsize + 2 * xblank1 + xblank2) && mouseX < xstartpos + j * (plotsize + 2 * splotsize + 2 * xblank1 + xblank2) + plotsize && mouseY > ystartpos + i * (plotsize + yblank) && mouseY < ystartpos + i * (plotsize + yblank) + plotsize) {
//                 choose = !choose;
//                 needupdate = true;
//             }
//         }
//     }
// }
