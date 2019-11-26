/////////////////////
/////////////////////
// DECLARE VARIABLES
/////////////////////
////////////////////

let measures = [];  // measures[index][sample][x-var,y-var,value], value = -1 means no data
let nummeasure = 11;
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
  'Length'
];

// VARIABLES FOR STORING DATA
let data = []; // data[sample][variable][time step] for raw data
let mapsample0 = new Map(); // code -> data sample name
let mapsample1 = new Map(); // data sample name -> index in data[data sample]
let mapsample2 = new Map(); // index -> data sample name
let mapvar0 = new Map();  // code -> variable name
let mapvar1 = new Map();  // variable name -> index in data[variable]
let mapvar2 = new Map(); // index -> variable name
let timedata =[]; // store indices of time steps

// VARIABLES FOR CONTROLLING
let donecalculation = false;

// VARIABLES FOR VISUALIZATION
let displayplot = [];   // displayplot[measure index][0->numplot-1:lowest, numplot->2numplot-1: middle, 2numplot->3numplot-1: highest][sample, x-var, y-var,value]
let width = 2000;
let height = 6000;
let plotsize = width*0.09;
let splotsize = width*0.06;
let numplot = 10;
let selectedmeasure = 0;
let choose = false;   // for selections
let type = [0,0,0,0,0,0,1,1,1,2,2];   // for type of measures in selection button
let xstartpos = width*0.05;   // starting position of plots
let ystartpos = 200;
let xblank1 = splotsize*0.3;
let xblank2 = plotsize*0.8;
let yblank = plotsize*0.3;





////////////////////////////////
////////////////////////////////
// MAIN CODE FOR ANALYZING DATA
///////////////////////////////
//////////////////////////////

Promise.all([
  d3.csv("data/employment.txt"),
  d3.tsv("data/statecode.txt"),
  d3.tsv("data/Industrycode.txt"),
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
  sortmeasures();
  console.log(measures);


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
              if (ei === 0 ) {
                if (e > upperlimit) {
                  outlier[sindex] = ei;
                  measures[0][p][index][2] += e;
                  sindex += 1;
                }
              }
              else if (ei === edgelength.length - 1) {
                if (e > upperlimit) {
                  outlier[sindex] = ei + 1;
                  measures[0][p][index][2] += e;
                  sindex += 1;
                }
              }
              else {
                if (e > upperlimit && edgelength[ei-1] > upperlimit) {
                  outlier[sindex] = ei;
                  measures[0][p][index][2] += e + edgelength[ei-1];
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
          xdata.forEach(function (x,xi) {
            if (xi) {
              var xlength = x - xdata[xi-1];
              var ylength = ydata[xi] - ydata[xi-1];
              edgelengtha[xi-1] = Math.sqrt(xlength*xlength+ylength*ylength);
              sumlengtha += edgelengtha[xi-1];
            }
          });
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
          if (xdata.length > 1 && measures[7][p][index][2] < 0.6) {
            var dir = [0,0,0,0];    // count directions for Trend
            var countcrossing = 0;  // count #intersections
            var sumcos = 0;   // sum of cosine of angles
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
                  if (checkintersection(x,ydata[xi],xdata[xi+1],ydata[xi+1],xdata[i],ydata[i],xdata[i+1],ydata[i+1])) countcrossing += 1;
                }
              }
              if (xi > 0 && xi < xdata.length - 1) {
                sumcos += Math.abs(calculatecos(xdata[xi-1],ydata[xi-1],x,ydata[xi],xdata[xi+1],ydata[xi+1]));
              }
            });
            // LENGTH
            measures[10][p][index][2] = sumlengtha/(xdata.length-1);
            if (measures[10][p][index][2] > 1) measures[10][p][index][2] = 1;
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
            if (measures[8][p][index][2] < 10) {
              // var mincurve = Infinity;
              // xdata.forEach(function (x,xi) {
              //   var locallength = 0;
              //   for (var j = xi + 1; j < xdata.length; j++) {
              //     locallength += edgelengtha[j-1];
              //     var Edistance = Math.sqrt(Math.pow(xdata[j] - x,2)+Math.pow(ydata[j] - ydata[xi],2));
              //     mincurve = (mincurve > Edistance/locallength) ? Edistance/locallength : mincurve;
              //   }
              // });
              var maxinterval = 0;
              xdata.forEach(function (x,xi) {
                for (var i = xi + 2; i < xdata.length; i++) {   // for all data after x
                  // check intersections for INTERSECTIONS
                  if (checkintersection(x,ydata[xi],xdata[xi+1],ydata[xi+1],xdata[i],ydata[i],xdata[i+1],ydata[i+1])){
                    maxinterval = (maxinterval < i - xi) ? i - xi : maxinterval;
                  }
                }
              });
              measures[9][p][index][2] = maxinterval;
            }




          }



          

          

          // increase index
          index += 1;
        }
      }

    });
  }

  // SORT MEASURES AND WRITE DISPLAYPLOT
  function sortmeasures() {
    for (var i = 0; i < nummeasure; i++) {
      var sortarr = [];
      var index = 0;
      measures[i].forEach(function (sample,si) {
        sample.forEach(function (arr) {
          sortarr[index] = [si,arr[0],arr[1],arr[2]];
          index += 1;
        });
      });
      sortarr = sortarr.filter(function (b) {return b[3] >= 0});
      sortarr.sort(function (b,n) {return b[3] - n[3]});    // ascending
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
    }
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



  donecalculation = true;
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
  createCanvas(width,height);
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
function draw() {
  background(180);

  if (donecalculation) {
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
    text('select measure',xstartpos+plotsize+xblank1+0.8*splotsize,16+plotsize/10);
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
      switch (type[selectedmeasure]) {
        case 0:
          fill(179,226,205);
          break;
        case 1:
          fill(253,205,172);
          break;
        case 2:
          fill(203,213,232);
          break;
        case 3:
          fill(244,202,228);
          break;
      }
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
    for (var i = 0; i < numplot; i++) {
      for (var j = 0; j < 3; j++) {

        var sample = displayplot[selectedmeasure][i+j*numplot][0];
        var xvar = displayplot[selectedmeasure][i+j*numplot][1];
        var yvar = displayplot[selectedmeasure][i+j*numplot][2];
        var value = displayplot[selectedmeasure][i+j*numplot][3];

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