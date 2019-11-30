/////////////////////
/////////////////////
// DECLARE VARIABLES
/////////////////////
////////////////////

let measures = [];  // measures[index][sample][x-var,y-var,value], value = -1 means no data
let nummeasure = 14;
for (var i=0; i<nummeasure; i++) {
    measures[i] = [];
}
let measurename = [
    'Outlying',
    'Straight',
    'Skewed',
    'Clumpy',
    'Sparse',
    'Striated',
    'Trend',
    'L-shape',
    "Intersections",
    "Loop",
    'Similarity',
    'Cross-correlation',
    'Length',
    'Area'
];
let measureObj = {
    'Outlying':0,
    'Straight':1,
    'Skewed':2,
    'Clumpy':3,
    'Sparse':4,
    'Striated':5,
    'Trend':6,
    'L-shape':7,
    "Intersections":8,
    "Loop":9,
    'Similarity':10,
    'Cross-correlation':11,
    'Length':12,
    'Area':13
};

// VARIABLES FOR STORING DATA
let data = []; // data[sample][variable][time step] for raw data
let mapsample0 = new Map(); // code -> data sample name
let mapsample1 = new Map(); // data sample name -> index in data[data sample]
let mapsample2 = new Map(); // index -> data sample name
let mapvar0 = new Map();  // code -> variable name
let mapvar1 = new Map();  // variable name -> index in data[variable]
let mapvar2 = new Map(); // index -> variable name
let timedata =[]; // store indices of time steps

// VARIABLES FOR CALCULATIONS
let numcell = 40;
let cellsize = 1/numcell;
let cellval = [];
let minloop = 24;
let maxloop = 60;
let lag = 0;
let selecteddata = 0;
let filename0, filename1, filename2;

// VARIABLES FOR CONTROLLING
let donecalculation = false;
let needupdate = true;
let needcalculation = true;

// VARIABLES FOR VISUALIZATION
let displayplot = [];   // displayplot[measure index][0->numplot-1:lowest, numplot->2numplot-1: middle, 2numplot->3numplot-1: highest][sample, x-var, y-var,value]
let width = 2000;
let height = 6000;
let plotsize = width*0.09;
let splotsize = width*0.06;
let numplot = 20;
let newnumplot = 0;
let selectedmeasure = 0;
let choose = false;   // for selections
let type = [0,0,0,0,0,0,1,1,1,1,1,2,2,2];   // for type of measures in selection button
let xstartpos = width*0.05;   // starting position of plots
let ystartpos = 200;
let xblank1 = splotsize*0.3;
let xblank2 = plotsize*0.8;
let yblank = plotsize*0.3;
let checkfilter = [];
let valfilter = [];
for (var i = 0; i < nummeasure; i++) {
    checkfilter[i] = false;
    valfilter[i] = [0,1];
}




////////////////////////////////
////////////////////////////////
// UI CODE
///////////////////////////////
///////////////////////////////

$( document ).ready(function() {
    console.log('ready');
    try {
        $('.collapsible').collapsible();
        $('.modal').modal();
        $('.dropdown-trigger').dropdown();
        $('.tabs').tabs();
        $('.sidenav').sidenav();
        discovery('#sideNavbtn');
        openNav();
        d3.select("#DarkTheme").on("click", switchTheme);

        noUiSlider.create(orderSelection,{
            start: 0,
            connect: false,
            step: 1,
            orientation: 'vertical',
            range: {
                'min': 0,
                'max': nummeasure-1
            },
        }).on('change',function (values) {
            selectedmeasure = +values;
            needupdate = true;
        });
        // generate measurement list
        let mc = d3.select('#measureControl').selectAll('.measureControl')
            .data(measurename)
            .enter().append('div').attr('class', 'measureControl row valign-wrapper');
        // mc.append('verticalSlider').attr('class','col s2').each(function(){
        //   noUiSlider.create(this,{
        //     start: [0],
        //     connect: true,
        //     step: 1,
        //     orientation: 'vertical',
        //     range: {
        //       'min': 0,
        //       'max': nummeasure
        //     },
        //   }).on('change',function (values) {
        //     selectedmeasure = +values;
        //     console.log(selectedmeasure);
        //   })
        // });
        let mc_label = mc.append('label').attr('class', 'col s7');
        mc_label.append('input').attr('type', 'checkbox').attr('class', 'filled-in enableCheck')
            .on('change',function(d){
                checkfilter[measureObj[d]] = this.checked;
                needupdate = true;
            });
        mc_label.append('span').attr('class', 'col measureLabel')
            .style('color',d=>'rgb('+getcolor(measureObj[d]).join(',')+')')
            .text(d => d);
        mc.append('div').attr('class','sliderHolder col s4').each(function(){
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
        let totalw = measureControl.getBoundingClientRect().height;
        d3.select('#orderSelection').style('height',(totalw-totalw/nummeasure)+'px').style('margin-top','12.5px');
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
// ///////////////////////////
////////////////////////////////
// MAIN CODE FOR ANALYZING DATA
///////////////////////////////
//////////////////////////////

switch (selecteddata) {
    case 0:
        filename0 = "data/employment.txt";
        filename1 = "data/statecode.txt";
        filename2 = "data/Industrycode.txt";
}

Promise.all([
    d3.csv(filename0),
    d3.tsv(filename1),
    d3.tsv(filename2),
]).then(function(files) {

///////////////////////////////////////
// READ DATA TO RESTORING VARIABLES
//////////////////////////////////////

    // MAP DATA sample
    files[1].forEach(function(sample,p){
        if (!mapsample0.get(sample.code)) mapsample0.set(sample.code,sample.name);  // code-string to name-string
        if (!mapsample1.get(sample.name)) mapsample1.set(sample.name,p);  // name-string to index-number
        if (!mapsample2.get(p)) mapsample2.set(p,sample.name);   // index-number to name-string
        data[p] = [];
    });

    // MAP VARIABLES
    files[2].forEach(function(variable,v){
        if (!mapvar0.get(variable.code)) mapvar0.set(variable.code,variable.name);  // code-string to name-string
        if (!mapvar1.get(variable.name)) mapvar1.set(variable.name,v);  // name-string to index-number
        if (!mapvar2.get(v)) mapvar2.set(v,variable.name);
        data.forEach(function(d){
            d[v] = [];
        });
    });

    // TIME NAME
    timedata = files[0].columns.filter(function(step){return step !== "Series ID"});

    // WRITE DATA TO DATA[]
    data.forEach(function(sample){
        sample.forEach(function (variable) {
            timedata.forEach(function (step,s) {
                variable[s] = -1;
            });
        });
    });
    files[0].forEach(function(line){
        var sampleindex = mapsample1.get(mapsample0.get(line["Series ID"].substr(3,2)));
        var varindex = mapvar1.get(mapvar0.get(line["Series ID"].substr(10,8)));
        timedata.forEach(function(step,s){
            data[sampleindex][varindex][s] = isNaN(parseFloat(line[step])) ? -1 : parseFloat(line[step]);
        });
    });

/////////////////////////
// END OF READING DATA
///////////////////////

///////////////////////
// CALCULATION CODE
/////////////////////

    // CONTROL CALCULATION
    normalization();
    calculatemeasures();
    // sortmeasures();
    // console.log(timedata);


    // NORMALIZE DATA
    // find min and max of each series -> normalize
    // local normalization
    function normalization() {
        data.forEach(function(sample,p) {
            sample.forEach(function(variable,v) {
                var svariable = variable.filter(function(d){return d >= 0});
                var mymax = Math.max(...svariable);
                var mymin = Math.min(...svariable);
                var myrange = mymax - mymin;
                variable.forEach(function(step,s){
                    data[p][v][s] = (step !== -1) ? (step - mymin)/myrange : -1;
                });
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
    function calculatemeasures () {

        data.forEach(function (sample,p) {

            // Declare measure structures
            for (var i=0; i< nummeasure; i++) {
                measures[i][p] = [];
            }
            var index = 0;
            // Each plot
            for (var yvar = 0; yvar < mapvar0.size; yvar++) {
                for (var xvar = 0; xvar < yvar; xvar++) {

                    // Initialize measure values
                    for (var i = 0; i < nummeasure; i++) {
                        measures[i][p][index] = [xvar,yvar,-1];
                    }

                    // create calculation data
                    var xdata = sample[xvar].map(function (x) {return x});
                    var ydata = sample[yvar].map(function (y) {return y});
                    xdata.forEach(function(x,ix){
                        ydata[ix] = (x === -1) ? -1 : ydata[ix];
                    });
                    ydata.forEach(function(y,iy){
                        xdata[iy] = (y === -1) ? -1 : xdata[iy];
                    });
                    xdata = xdata.filter(function(x){return x !== -1});
                    ydata = ydata.filter(function(y){return y !== -1});
                    if (xdata.length !== ydata.length)
                        console.log("2 series have different length at: sample = " + p + ", x-var = " + xvar + ", y-var = " + yvar);

                    // CALCULATIONS RELATED LENGTH
                    var edgelength = [];
                    var sumlength = 0;
                    xdata.forEach(function (x,xi) {
                        if (xi) {
                            var xlength = x - xdata[xi-1];
                            var ylength = ydata[xi] - ydata[xi-1];
                            edgelength[xi-1] = Math.sqrt(xlength*xlength+ylength*ylength);
                            sumlength += edgelength[xi-1];
                        }
                    });
                    var sortlength = edgelength.map(function (v) {return v});
                    sortlength.sort(function (b,n) {return b-n});   // ascending

                    // OUTLYING
                    if (xdata.length > 1) {
                        measures[0][p][index][2] = 0;
                        var outlier = [];
                        var sindex = 0;
                        var q1 = sortlength[Math.floor(sortlength.length*0.25)];
                        var q3 = sortlength[Math.floor(sortlength.length*0.75)];
                        var upperlimit = q3 + 1.5*(q3 - q1);
                        edgelength.forEach(function (e,ei) {
                            if (ei === 0) {
                                if (e > upperlimit) {
                                    outlier[sindex] = ei;
                                    measures[0][p][index][2] += e;
                                    sindex += 1;
                                }
                            }
                            else if (ei === edgelength.length - 1) {
                                if (e > upperlimit) {
                                    outlier[sindex] = ei + 1;
                                    if (outlier[sindex-1] !== outlier[sindex] - 1) {
                                        measures[0][p][index][2] += e;
                                    }
                                    sindex += 1;
                                }
                                if (e > upperlimit && edgelength[ei-1] > upperlimit) {
                                    outlier[sindex] = ei;
                                    if (outlier[sindex-1] !== outlier[sindex] - 1) {
                                        measures[0][p][index][2] += e + edgelength[ei-1];
                                    } else {
                                        measures[0][p][index][2] += e;
                                    }
                                    sindex += 1;
                                }
                            }
                            else {
                                if (e > upperlimit && edgelength[ei-1] > upperlimit) {
                                    outlier[sindex] = ei;
                                    if (outlier[sindex-1] !== outlier[sindex] - 1) {
                                        measures[0][p][index][2] += e + edgelength[ei-1];
                                    } else {
                                        measures[0][p][index][2] += e;
                                    }
                                    sindex += 1;
                                }
                            }
                        });
                        measures[0][p][index][2] /= sumlength;
                        var adjust = 0;
                        outlier.forEach(function (v) {
                            xdata.splice(v-adjust,1);
                            ydata.splice(v-adjust,1);
                            adjust += 1;
                        });
                    }

                    // CALCULATIONS RELATED LENGTH AFTER REMOVING OUTLIERS
                    var edgelengtha = [];
                    var sumlengtha = 0;
                    var meanx = 0;
                    var meany = 0;
                    xdata.forEach(function (x,xi) {
                        if (xi) {
                            var xlength = x - xdata[xi-1];
                            var ylength = ydata[xi] - ydata[xi-1];
                            edgelengtha[xi-1] = Math.sqrt(xlength*xlength+ylength*ylength);
                            sumlengtha += edgelengtha[xi-1];
                        }
                        meanx += x;
                        meany += ydata[xi];
                    });
                    meanx /= xdata.length;
                    meany /= ydata.length;
                    var sortlengtha = edgelengtha.map(function (v) {return v});
                    sortlengtha.sort(function (b,n) {return b-n});   // ascending

                    // L-SHAPE
                    if (xdata.length > 1) {
                        measures[7][p][index][2] = 0;
                        var count = 0;
                        xdata.forEach(function (x,xi) {
                            if (xi) {
                                if (x === xdata[xi - 1] || ydata[xi] === ydata[xi - 1]) count += 1;
                            }
                        });
                        // L-SHAPE
                        measures[7][p][index][2] = count/xdata.length;  // or timedata.length
                    }

                    // CALCULATE SOME MEASURES
                    // do not consider outliers and L-shape plots
                    // The threshold here is 0.6
                    if (xdata.length > 1) {
                        var dir = [0,0,0,0];    // count directions for Trend
                        var countcrossing = 0;  // count #intersections
                        var sumcos = 0;   // sum of cosine of angles
                        // var looparr = [];
                        var looplength = 0;
                        xdata.forEach(function (x,xi) {
                            for (var i = xi + 1; i < xdata.length; i++) {   // for all data after x
                                // count directions for MONOTONIC TREND
                                var xx = xdata[i] - x;
                                var yy = ydata[i] - ydata[xi];
                                if (xx > 0 && yy > 0) dir[0] += 1;
                                if (xx < 0 && yy > 0) dir[1] += 1;
                                if (xx < 0 && yy < 0) dir[2] += 1;
                                if (xx > 0 && yy < 0) dir[3] += 1;
                                // check intersections for INTERSECTIONS
                                if (i > xi + 1 && i < xdata.length-1 && xi < xdata.length-3) {
                                    if (checkintersection(x,ydata[xi],xdata[xi+1],ydata[xi+1],xdata[i],ydata[i],xdata[i+1],ydata[i+1])) {
                                        // looparr[countcrossing] = i-xi;
                                        if ((i-xi) > minloop && (i-xi) < maxloop) {
                                            looplength = (looplength < (i-xi)) ? i-xi : looplength;
                                        }
                                        countcrossing += 1;
                                    }
                                }
                            }
                            if (xi > 0 && xi < xdata.length - 1) {
                                sumcos += Math.abs(calculatecos(xdata[xi-1],ydata[xi-1],x,ydata[xi],xdata[xi+1],ydata[xi+1]));
                            }
                        });
                        // LENGTH
                        measures[12][p][index][2] = sumlengtha/(xdata.length-1);
                        if (measures[12][p][index][2] > 1) measures[12][p][index][2] = 1;
                        // MONOTONIC TREND
                        measures[6][p][index][2] = Math.max(...dir)/(xdata.length*(xdata.length-1)/2);
                        // INTERSECTIONS
                        measures[8][p][index][2] = 1-Math.exp(-countcrossing/(xdata.length-1));
                        // STRIATED
                        measures[5][p][index][2] = sumcos/(xdata.length-2);
                        // STRAIGHT
                        measures[1][p][index][2] = Math.sqrt(Math.pow(xdata[xdata.length-1]-xdata[0],2)+Math.pow(ydata[ydata.length-1]-ydata[0],2))/sumlengtha;
                        // SKEWED
                        var q10 = sortlengtha[Math.floor(sortlengtha.length*0.1)];
                        var q50 = sortlengtha[Math.floor(sortlengtha.length*0.5)];
                        var q90 = sortlengtha[Math.floor(sortlengtha.length*0.9)];
                        measures[2][p][index][2] = (q90-q50)/(q90-q10);
                        // SPARSE
                        measures[4][p][index][2] = q90;

                        // CLUMPY
                        xdata.forEach(function (x,xi) {
                            var countleft = 0;
                            var countright = 0;
                            var maxleft = 0;
                            var maxright = 0;
                            for (var j = xi - 1; j >= 0; j--) {
                                if (edgelengtha[j] >= edgelengtha[xi]) break;
                                countleft += 1;
                                maxleft = (maxleft < edgelengtha[j]) ? edgelengtha[j] : maxleft;
                            }
                            for (j = xi+1; j < xdata.length; j++) {
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
                        measures[9][p][index][2] = (looplength > 0) ? (maxloop-looplength)/(maxloop-minloop) : 0;

                        // CROSS - CORRELATION
                        var maxr = 0;
                        var covxy = 0;
                        var covx = 0;
                        var covy = 0;
                        var sim = 0;
                        var minsim = Infinity;
                        for (var i = -lag; i < lag + 1; i++) {
                            if (i <= 0) {
                                for (var j = 0; j < xdata.length - lag; j++) {
                                    covxy += (xdata[j]-meanx)*(ydata[j-i]-meany);
                                    covx += Math.pow(xdata[j]-meanx,2);
                                    covy += Math.pow(ydata[j-i]-meany,2);
                                    sim += Math.abs(xdata[j]-ydata[j-i]);
                                }
                                var r = Math.pow(covxy/Math.sqrt(covx*covy),2);
                                minsim = (minsim > sim) ? sim : minsim;
                            } else {
                                for (var j = 0; j < xdata.length - lag; j++) {
                                    covxy += (xdata[j+i]-meanx)*(ydata[j]-meany);
                                    covx += Math.pow(xdata[j+i]-meanx,2);
                                    covy += Math.pow(ydata[j]-meany,2);
                                    sim += Math.abs(xdata[j+i]-ydata[j]);
                                }
                                var r = Math.pow(covxy/Math.sqrt(covx*covy),2);
                                minsim = (minsim > sim) ? sim : minsim;
                            }
                            maxr = (maxr < r) ? r : maxr;
                        }
                        measures[11][p][index][2] = maxr;

                        // SIMILARITY
                        measures[10][p][index][2] = 1 - minsim/(xdata.length-1);

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
                            for (var i = 0; i < xdata.length-2; i++) {
                                var xmax = Math.max(...[xdata[i],xdata[i+1],xdata[i+2]]);
                                var xmin = Math.min(...[xdata[i],xdata[i+1],xdata[i+2]]);
                                var ymax = Math.max(...[ydata[i],ydata[i+1],ydata[i+2]]);
                                var ymin = Math.min(...[ydata[i],ydata[i+1],ydata[i+2]]);
                                xmin = Math.floor(xmin/cellsize);
                                xmax = Math.ceil(xmax/cellsize);
                                ymin = Math.floor(ymin/cellsize);
                                ymax = Math.ceil(ymax/cellsize);
                                for (var j = xmin; j <= xmax; j++) {
                                    for (var k = ymin; k <= ymax; k++) {
                                        var xcell = j*cellsize + cellsize/2;
                                        var ycell = k*cellsize + cellsize/2;
                                        if (checkinsidetriangle(xcell,ycell,xdata[i],ydata[i],xdata[i+1],ydata[i+1],xdata[i+2],ydata[i+2])) {
                                            cellval[j][k] = 1;
                                        }
                                    }
                                }
                            }
                            measures[13][p][index][2] = 0;
                            cellval.forEach(function (row) {
                                row.forEach(function (column) {
                                    measures[13][p][index][2] += column;
                                });
                            });
                            measures[13][p][index][2] *= cellsize*cellsize;
                        }




                    }







                    // increase index
                    index += 1;
                }
            }

        });
    }

    // CHECK INTERSECTIONS
    function checkintersection(x1_,y1_,x2_,y2_,x3_,y3_,x4_,y4_) {
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
        var checkv1 = (v1x*v23y-v1y*v23x)*(v1x*v24y-v1y*v24x);
        var checkv2 = (v2x*v41y-v2y*v41x)*(v2y*v24x-v2x*v24y);
        var check = (checkv1 < 0) && (checkv2 < 0);
        return check;
    }

    // CALCULATE COSINE OF ANGLES
    // input: coordinates of 3 points: 1, 2 and 3
    // construct vector 1->2 and 2->3
    // calculate dot product of 2 vectors
    // get the angle
    function calculatecos(x1_,y1_,x2_,y2_,x3_,y3_) {
        var v1x = x2_ - x1_;
        var v1y = y2_ - y1_;
        var v2x = x3_ - x2_;
        var v2y = y3_ - y2_;
        var dotproduct = v1x*v2x+v1y*v2y;
        var v1 = Math.sqrt(v1x*v1x+v1y*v1y);
        var v2 = Math.sqrt(v2x*v2x+v2y*v2y);
        var cosangle = dotproduct/(v1*v2);
        return cosangle;
    }

    // CHECK INSIDE TRIANGLE
    // input: point need to check: O, 3 points of triangle: A, B, C
    // method: cross-product of OAxAB, OBxBC, and OCxCA have the same signs -> inside
    function checkinsidetriangle(x0_,y0_,x1_,y1_,x2_,y2_,x3_,y3_) {
        var x0 = x0_;
        var y0 = y0_;
        var x1 = x1_;
        var y1 = y1_;
        var x2 = x2_;
        var y2 = y2_;
        var x3 = x3_;
        var y3 = y3_;
        var xOA = x1-x0;
        var yOA = y1-y0;
        var xOB = x2-x0;
        var yOB = y2-y0;
        var xOC = x3-x0;
        var yOC = y3-y0;
        var xAB = x2-x1;
        var yAB = y2-y1;
        var xBC = x3-x2;
        var yBC = y3-y2;
        var xCA = x1-x3;
        var yCA = y1-y3;
        var check1 = xOA*yAB-yOA*xAB;
        var check2 = xOB*yBC-yOB*xBC;
        var check3 = xOC*yCA-yOC*xCA;
        var check = (check1 > 0 && check2 > 0 && check3 > 0) || (check1 < 0 && check2 < 0 && check3 < 0);
        return check;
    }



    donecalculation = true;
    d3.select('.cover').classed('hidden', true);
///////////////////////
// END OF CALCULATION
///////////////////////
});
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
function getcolor(measure) {
    switch (type[measure]) {
        case 0:
            return [179, 226, 205];
            break;
        case 1:
            return [253, 205, 172];
            break;
        case 2:
            return [203, 213, 232];
            break;
        case 3:
            return [244, 202, 228];
            break;
    }
}

/////////////////
function draw() {
    if (needupdate){
        background(180);

        if (donecalculation) {

            // SLIDERS


            // CHOOSE DISPLAY PLOTS
            sortmeasures();

            textFont('Arial Unicode MS');

            // draw background of buttons
            fill(160);
            noStroke();
            rect(0,0,width,50+plotsize/4);
            // Write group notation
            fill(0);
            noStroke();
            textSize(plotsize/8);
            text('Lowest values',xstartpos+plotsize,ystartpos-50);
            text('Middle values',xstartpos+2*plotsize+2*xblank1+2*splotsize+xblank2,ystartpos-50);
            text('Highest values',xstartpos+3*plotsize+4*xblank1+4*splotsize+2*xblank2,ystartpos-50);
            textSize(plotsize/12);
            text('select measure',xstartpos+plotsize+2*xblank1+0.5*splotsize,16+plotsize/10);
            // Color explanation
            fill(179,226,205);
            rect(xstartpos+plotsize+2*xblank1+2*splotsize+xblank2,20,plotsize/12,plotsize/12);
            fill(253,205,172);
            rect(xstartpos+plotsize+2*xblank1+2*splotsize+xblank2,30+plotsize/12,plotsize/12,plotsize/12);
            fill(203,213,232);
            rect(xstartpos+plotsize+2*xblank1+2*splotsize+xblank2,40+plotsize/6,plotsize/12,plotsize/12);
            fill(0);
            text('Measures from Scagnostics of non time series data',xstartpos+plotsize+2*xblank1+2*splotsize+xblank2+plotsize/12+10,16+plotsize/11);
            text('Measures from features of connected scatterplot',xstartpos+plotsize+2*xblank1+2*splotsize+xblank2+plotsize/12+10,26+plotsize/6);
            text('Measures under developing',xstartpos+plotsize+2*xblank1+2*splotsize+xblank2+plotsize/12+10,36+plotsize/4);
            // Formula
            text('Formula for this measure:',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,16+plotsize/11);
            switch (selectedmeasure) {
                case 0:
                    text(measurename[selectedmeasure]+' = '+'Q75+1.5(Q75-Q25)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 1:
                    text(measurename[selectedmeasure]+' = '+'distance(p1,pN)/(total edge length)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    text('p1: first point in the series, pN: last point in the series',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 2:
                    text(measurename[selectedmeasure]+' = '+'(Q90-Q50)/(Q90-Q10)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    text('Q90, Q50 and Q10 are correspondingly 90th, 50th and 10th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 3:
                    text(measurename[selectedmeasure]+' = '+'max_j[1-max_k(e_k)/e_j]',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    text('e_k is edge in Runt set from e_j, e_j is edge in the graph',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 4:
                    text(measurename[selectedmeasure]+' = '+'Q90',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    text('Q90 is 90th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 5:
                    text(measurename[selectedmeasure]+' = '+'mean of cosine of all angles',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 6:
                    text(measurename[selectedmeasure]+' = '+'maximum number of directions of e_ij / (N(N-1)/2)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    text('e_ij is edge from i to all point j after i',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 7:
                    text(measurename[selectedmeasure]+' = '+'count number of edges that are parallel to x-axis or y-axis',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 8:
                    text(measurename[selectedmeasure]+' = '+'1-exp(- #intersections / #edges)',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 9:
                    text(measurename[selectedmeasure]+' = '+'under developing',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
                case 10:
                    text(measurename[selectedmeasure]+' = '+'mean length of all edges',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,26+plotsize/6);
                    // text('Q75 and Q25 are correspondingly 75th and 25th percentile of edge length',xstartpos+2*plotsize+4*xblank1+4*splotsize+xblank2,36+plotsize/4);
                    break;
            }

            // Create list button
            if (!choose) {
                let colorv= getcolor(selectedmeasure);
                fill(colorv[0],colorv[1],colorv[2]);
                stroke(0);
                rect(xstartpos+plotsize+2*xblank1+1.5*splotsize,20,130,plotsize/10);
                fill(255);
                noStroke();
                triangle(xstartpos+plotsize+2*xblank1+1.5*splotsize+125,21+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+125-plotsize/30,21+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+125-plotsize/60,19+plotsize/10);
                triangle(xstartpos+plotsize+2*xblank1+1.5*splotsize+125,19+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+125-plotsize/30,19+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+125-plotsize/60,21);
                fill(0);
                noStroke();
                textSize(plotsize/12);
                // textAlign(CENTER);
                text(measurename[selectedmeasure],xstartpos+plotsize+2*xblank1+1.5*splotsize+20,16+plotsize/10);
                // textAlign(LEFT);
            } else {
                for (var i = 0; i < nummeasure; i++) {
                    if (mouseX > xstartpos + plotsize + 2 * xblank1 + 1.5 * splotsize && mouseX < xstartpos + plotsize + 2 * xblank1 + 1.5 * splotsize + 130 && mouseY > 20 + i * plotsize / 10 && mouseY < 20 + (i + 1) * plotsize / 10) {
                        fill(255);
                    } else
                        switch (type[i]) {
                            case 0:
                                fill(179, 226, 205);
                                break;
                            case 1:
                                fill(253, 205, 172);
                                break;
                            case 2:
                                fill(203, 213, 232);
                                break;
                            case 3:
                                fill(244, 202, 228);
                                break;
                        }
                    stroke(0);
                    rect(xstartpos + plotsize + 2 * xblank1 + 1.5 * splotsize, 20 + i * plotsize / 10, 130, plotsize / 10);
                    fill(0);
                    noStroke();
                    textSize(plotsize / 12);
                    // textAlign(CENTER);
                    text(measurename[i], xstartpos + plotsize + 2 * xblank1 + 1.5 * splotsize + 20, 16 + (i + 1) * plotsize / 10);
                    // textAlign(LEFT);
                    if (i === selectedmeasure) {
                        strokeWeight(2);
                        stroke(0);
                        line(xstartpos+plotsize+2*xblank1+1.5*splotsize+5,20+i*plotsize/10+plotsize/20,xstartpos+plotsize+2*xblank1+1.5*splotsize+5+plotsize/60,20+i*plotsize/10+2*plotsize/30);
                        line(xstartpos+plotsize+2*xblank1+1.5*splotsize+5+plotsize/60,20+i*plotsize/10+2*plotsize/30,xstartpos+plotsize+2*xblank1+1.5*splotsize+5+plotsize/30,20+i*plotsize/10+plotsize/30);
                        strokeWeight(1);
                    }
                }
            }


            // Draw plots
            var correctnumplot = (newnumplot === 0) ? numplot : Math.floor(newnumplot/3);
            for (var i = 0; i < numplot; i++) {
                for (var j = 0; j < 3; j++) {

                    var sample = displayplot[selectedmeasure][i+j*correctnumplot][0];
                    var xvar = displayplot[selectedmeasure][i+j*correctnumplot][1];
                    var yvar = displayplot[selectedmeasure][i+j*correctnumplot][2];
                    var value = displayplot[selectedmeasure][i+j*correctnumplot][3];

                    // draw rectangles for CS
                    fill(255);
                    stroke(0);
                    rect(xstartpos+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+i*(plotsize+yblank),plotsize,plotsize);

                    // draw rectangles for time series
                    fill(220);
                    noStroke();
                    rect(xstartpos+plotsize+xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank)-splotsize,splotsize,splotsize); // x-data
                    stroke(0);
                    line(xstartpos+plotsize+xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank)-splotsize,xstartpos+plotsize+xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank));
                    line(xstartpos+plotsize+xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank),xstartpos+plotsize+splotsize+xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank));
                    noStroke();
                    rect(xstartpos+plotsize+splotsize+2*xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank)-splotsize,splotsize,splotsize); // y-data
                    stroke(0);
                    line(xstartpos+plotsize+splotsize+2*xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank)-splotsize,xstartpos+plotsize+splotsize+2*xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank));
                    line(xstartpos+plotsize+splotsize+2*xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank),xstartpos+plotsize+2*splotsize+2*xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+plotsize+i*(plotsize+yblank));


                    // write value of measure
                    noStroke();
                    fill(255);
                    textSize(plotsize/12);
                    text(measurename[selectedmeasure]+' = '+Math.round(value*100)/100,xstartpos+j*(plotsize+2*splotsize+2*xblank1+xblank2)+plotsize*0.6,ystartpos+i*(plotsize+yblank)-5);

                    // write sample notation
                    noStroke();
                    fill(0);
                    textSize(plotsize/12);
                    text(mapsample2.get(sample),xstartpos+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+i*(plotsize+yblank)-5);

                    // write x-variable notation
                    noStroke();
                    fill(0);
                    textSize(plotsize/14);
                    text(mapvar2.get(xvar),xstartpos+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+i*(plotsize+yblank)+1.08*plotsize);
                    text("time",xstartpos+plotsize+xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2)+0.4*splotsize,ystartpos+i*(plotsize+yblank)+1.08*plotsize);
                    text("time",xstartpos+plotsize+1.4*splotsize+2*xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2),ystartpos+i*(plotsize+yblank)+1.08*plotsize);

                    //write y-variable notation
                    push();
                    noStroke();
                    fill(0);
                    textSize(plotsize/14);
                    translate(xstartpos+j*(plotsize+2*splotsize+2*xblank1+xblank2)-0.02*plotsize,ystartpos+i*(plotsize+yblank)+plotsize);
                    rotate(-PI/2);
                    text(mapvar2.get(yvar),0,0);
                    text(mapvar2.get(xvar),0,plotsize+xblank1);
                    text(mapvar2.get(yvar),0,plotsize+splotsize+2*xblank1);
                    pop();


                    // draw plots
                    timedata.forEach(function (time,step) {
                        if(step) {
                            // CS plots
                            if(data[sample][xvar][step]>=0 && data[sample][xvar][step-1]>=0 && data[sample][yvar][step]>=0 && data[sample][yvar][step-1]>=0) {
                                var x1 = xstartpos+j*(plotsize+2*splotsize+2*xblank1+xblank2)+plotsize*data[sample][xvar][step-1];
                                var x2 = xstartpos+j*(plotsize+2*splotsize+2*xblank1+xblank2)+plotsize*data[sample][xvar][step];
                                var y1 = ystartpos+i*(plotsize+yblank)+plotsize-plotsize*data[sample][yvar][step-1];
                                var y2 = ystartpos+i*(plotsize+yblank)+plotsize-plotsize*data[sample][yvar][step];
                                if (step<timedata.length/2) stroke(0,0,255-255*step/(timedata.length/2));
                                else stroke((step-timedata.length/2)*255/(timedata.length/2),0,0);
                                line(x1,y1,x2,y2);
                            }
                            // X-var plots
                            if(data[sample][xvar][step]>=0 && data[sample][xvar][step-1]>=0) {
                                var x1 = xstartpos+plotsize+xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2)+splotsize*(step-1)/timedata.length;
                                var x2 = xstartpos+plotsize+xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2)+splotsize*step/timedata.length;
                                var y1 = ystartpos+plotsize+i*(plotsize+yblank)-splotsize*data[sample][xvar][step-1];
                                var y2 = ystartpos+plotsize+i*(plotsize+yblank)-splotsize*data[sample][xvar][step];
                                if (step<timedata.length/2) stroke(0,0,255-255*step/(timedata.length/2));
                                else stroke((step-timedata.length/2)*255/(timedata.length/2),0,0);
                                line(x1,y1,x2,y2);
                            }
                            // Y-var plots
                            if(data[sample][yvar][step]>=0 && data[sample][yvar][step-1]>=0) {
                                var x1 = xstartpos+plotsize+splotsize+2*xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2)+splotsize*(step-1)/timedata.length;
                                var x2 = xstartpos+plotsize+splotsize+2*xblank1+j*(plotsize+2*splotsize+2*xblank1+xblank2)+splotsize*step/timedata.length;
                                var y1 = ystartpos+plotsize+i*(plotsize+yblank)-splotsize*data[sample][yvar][step-1];
                                var y2 = ystartpos+plotsize+i*(plotsize+yblank)-splotsize*data[sample][yvar][step];
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

function mousePressed() {
    if(!choose) {
        if (mouseX > xstartpos+plotsize+2*xblank1+1.5*splotsize && mouseX < xstartpos+plotsize+2*xblank1+1.5*splotsize+130 && mouseY > 20 && mouseY < 20+plotsize/10) {
            choose = true;
        }
    } else {
        for (var i = 0; i < nummeasure; i++) {
            if (mouseX > xstartpos+plotsize+2*xblank1+1.5*splotsize && mouseX < xstartpos+plotsize+2*xblank1+1.5*splotsize+130 && mouseY > 20+i*plotsize/10 && mouseY < 20+(i+1)*plotsize/10) {
                selectedmeasure = i;
                choose = false;
            }
        }
        if (mouseX < xstartpos+plotsize+2*xblank1+1.5*splotsize || mouseX > xstartpos+plotsize+2*xblank1+1.5*splotsize+130 || mouseY < 20 || mouseY > 20 + plotsize*(nummeasure+1)/10) {
            choose = false;
        }
    }
}

// SORT MEASURES AND WRITE DISPLAYPLOT
function sortmeasures() {
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
                    sortarr[aindex] = [si,arr[0],arr[1],arr[2]];
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