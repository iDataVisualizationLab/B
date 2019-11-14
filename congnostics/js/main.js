/* Note:
path === 0
monotonictrend === 1
outling === 2
crossing === 3
straight === 4
sumangle === 5
*/

/////////////////////
/////////////////////
// DECLARE VARIABLES
/////////////////////
////////////////////

// VARIABLES FOR STORING DATA
let data = []; // data[data point][variable][time step]
let drawdata = [];  // remove negative data in data[]
let mappoint0 = new Map(); // code -> data point name
let mappoint1 = new Map(); // data point name -> index in data[data point]
let mappoint2 = new Map(); // index -> data point name
let mapvar0 = new Map();  // code -> variable name
let mapvar1 = new Map();  // variable name -> index in data[variable]
let mapvar2 = new Map(); // index -> variable name
let timedata =[]; // store indices of time steps

// VARIABLES FOR CALCULATIONS
let path = [];  // path[data point][x-var,y-var,path], path = 0 means no data
let monotonictrend = [];  // monotonic[data point][x-var,y-var,monotonic], monotonic = -1 means no data
let outlying = [];  // outlying[data point][x-var,y-var,outlying], outlying = -1 means no data
let crossing = [];  // crossing[data point][x-var,y-var,crossing], crossing = -1 means no data
let straight = [];  // straight[data point][x-var,y-var,straight], straight = -1 means no data
let sumangle = [];  // sumangle[data point][x-var,y-var,sumangle], sumangle = -1 means no data
let displayplot = [];  // displayplot[scagnostic index][0->numplot-1:lowest, numplot->2numplot-1: middle, 2numplot->3numplot-1: highest][data point, x-var, y-var,value]
let numscag = 6;

// VARIABLES FOR VISUALIZATION
let selectedscag = 0;
let numplot = 5;    // number of scatter plots in each column
let plotsize;     // size of each scatter plots
let plotsizet;
let xblank = 200;   // total blank size in x-direction
let yblank = 60;    // total blank size in y-direction, except for a space of picking data point
let xstartpos = xblank/2;   // start positions
let ystartpos;
let dirsize = 4;
let dirangle = 0.314;

// VARIABLES FOR CONTROLS
let doneanalyzation = false;

//////////////////////////////
//////////////////////////////
// END OF DECLARING VARIABLES
/////////////////////////////
/////////////////////////////





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
  // files[0] is file1.txt
  // Add more files: next elements => do not change the indices



/////////////////////////////////////
// READ DATA TO RESTORING VARIABLES
///////////////////////////////////

  // MAP DATA POINT
  files[1].forEach(function(point,p){
    if (!mappoint0.get(point.code)) mappoint0.set(point.code,point.name);  // code-string to name-string
    if (!mappoint1.get(point.name)) mappoint1.set(point.name,p);  // name-string to index-number
    if (!mappoint2.get(p)) mappoint2.set(p,point.name);   // index-number to name-string
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
  data.forEach(function(point){
    point.forEach(function (variable) {
      timedata.forEach(function (step,s) {
        variable[s] = -1;
      });
    });
  });
  files[0].forEach(function(line){
    var pointindex = mappoint1.get(mappoint0.get(line["Series ID"].substr(3,2)));
    var varindex = mapvar1.get(mapvar0.get(line["Series ID"].substr(10,8)));
    timedata.forEach(function(step,s){
      data[pointindex][varindex][s] = isNaN(parseFloat(line[step])) ? -1 : parseFloat(line[step]);
    });
  });

/////////////////////////
// END OF READING DATA
///////////////////////



///////////////////////
// CALCULATION HERE
/////////////////////

// CONTROL CALCULATION
  normalization();
  calculatescagnostics();
  sortscag();
  console.log(data);
  console.log(path);
  console.log(displayplot);
  console.log(drawdata);

// NORMALIZE THE DATA OVER TIME
// each data point -> each variable
// -> find min and max of time series -> data = (data-min)/(max-min)
// -> write drawdata[] for later uses
  function normalization() {
    data.forEach(function(point,p) {
      point.forEach(function(variable,v) {
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
    data.forEach(function (point,p) {
      drawdata[p] = [];
      point.forEach(function (variable,v) {
        drawdata[p][v] = variable.filter(function(step){return step >=0});
      });
    });
  }

// CALCULATE SCAGNOSTICS OF CONNECTED SCATTER PLOTS
// each data point -> each pair of variables
// give -1 to each series's value if corresponding value in another series is -1
// -> filter non-negative numbers -> calculate scagnostics
// -> normalize them
  function calculatescagnostics() {
    data.forEach(function(point,p){

      path[p] = [];  // declare array of scagnostics
      monotonictrend[p] = [];
      outlying[p] = [];
      crossing[p] = [];
      straight[p] = [];
      sumangle[p] = [];

      var pathindex = 0;  // declare index for scagnostic arrays
      var monotonictrendindex = 0;
      var outlyingindex = 0;
      var crossingindex = 0;
      var straightindex = 0;
      var sumangleindex = 0;

      for (var myy = 0; myy < mapvar0.size; myy++) {
        for (var myx = 0; myx < myy; myx++) {

          path[p][pathindex] = [myx,myy,0];  // declare array of scagnostics
          monotonictrend[p][monotonictrendindex] = [myx,myy,-1];
          outlying[p][outlyingindex] = [myx,myy,-1];
          crossing[p][crossingindex] = [myx,myy,-1];
          straight[p][straightindex] = [myx,myy,-1];
          sumangle[p][sumangleindex] = [myx,myy,-1];

          var xdata = point[myx].map(function(x){return x});
          var ydata = point[myy].map(function(y){return y});
          xdata.forEach(function(x,ix){
            ydata[ix] = (x === -1) ? -1 : ydata[ix];
          });
          ydata.forEach(function(y,iy){
            xdata[iy] = (y === -1) ? -1 : xdata[iy];
          });
          xdata = xdata.filter(function(x){return x !== -1});
          ydata = ydata.filter(function(y){return y !== -1});
          if (xdata.length !== ydata.length)
            console.log("calculatepath -> 2 series have different length at: point = " + p + ", xvar = " + myx + ", yvar = " + myy);

          // CALCULATE PATH
          if (xdata.length > 1) {
            var prex = xdata[0], prey = ydata[0];
            xdata.forEach(function(x,ix){
              if (ix !== 0) {
                var edgex = x - prex;
                prex = x;
                var edgey = ydata[ix] - prey;
                prey = ydata[ix];
                path[p][pathindex][2] += Math.sqrt(edgex*edgex+edgey*edgey);
              }
            });
            //path[p][pathindex][2] /= ((xdata.length-1)*Math.sqrt(2));
            path[p][pathindex][2] /= ((xdata.length-1))/7;  // normalize
            if ( path[p][pathindex][2] > 1)  path[p][pathindex][2] = 1.00;  // boundary condition
          }
          pathindex += 1;
          // END OF PATH

          // CALCULATE MY MONOTONIC TREND
          // go to each element
          // -> get sign due to Mann-Kendall sense
          // -> consider relationships between a step's value with all steps' values after it
          // -> add to arr[I,II,III,IV]
          // -> mod/no. of edge
          var countedgedir = [0,0,0,0];
          for (var i = 0; i < xdata.length-1; i++) {
            for (var j = 0; j < xdata.length; j++) {
              var edgex = xdata[j] - xdata[i];
              var edgey = ydata[j] - ydata[i];
              if (edgex > 0 && edgey > 0) countedgedir[0] += 1;
              if (edgex < 0 && edgey > 0) countedgedir[1] += 1;
              if (edgex < 0 && edgey < 0) countedgedir[2] += 1;
              if (edgex > 0 && edgey < 0) countedgedir[3] += 1;
            }
          }
          countedgedir.forEach(function(c,i){
            monotonictrend[p][monotonictrendindex][2] = (monotonictrend[p][monotonictrendindex][2] < c) ? c : monotonictrend[p][monotonictrendindex][2];
          });
          monotonictrend[p][monotonictrendindex][2] /= xdata.length*(xdata.length - 1)/2;
          monotonictrendindex += 1;
          // END OF MONOTONIC TREND

          // CALCULATE OUTLIER
          // calculate edge lengths
          // sort them
          // get q1 and q3
          // calculate outlyinglength
          var edgearr = [];
          xdata.forEach(function (x,xi) {
            if (xi) {
              var edgex = x - xdata[xi-1];
              var edgey = ydata[xi] - ydata[xi-1];
              edgearr[xi-1] = Math.sqrt(edgex*edgex+edgey*edgey);
            }
          });
          edgearr.sort(function(b,n){return b-n});  // ascending sort
          var q1 = edgearr[Math.floor(0.25*edgearr.length)];
          var q3 = edgearr[Math.floor(0.75*edgearr.length)];
          var outlyingedge = 0;
          var countindex = edgearr.length - 1;
          var outcondition = q3+3*(q3-q1);
          while (edgearr[countindex] > outcondition) {
            outlyingedge += edgearr[countindex]*7/(xdata.length-1);
            countindex -= 1;
          }
          outlying[p][outlyingindex][2] = outlyingedge/path[p][pathindex-1][2];
          outlyingindex += 1;
          // END OF OUTLYING

          // CALCULATE NUMBER OF INTERSECTION - NOISE - CROSSING
          if (xdata.length > 1) {
            crossing[p][crossingindex][2] = 0;
            for (var i = 0; i < xdata.length - 3; i++) {
              for (var j = i+2; j < xdata.length - 1; j++) {
                if (checkintersection(xdata[i],ydata[i],xdata[i+1],ydata[i+1],xdata[j],ydata[j],xdata[j+1],ydata[j+1]))
                  crossing[p][crossingindex][2] += 1;
              }
            }
            // intersection[p][intersectionidex][2] /= (xdata.length - 2)*(xdata.length - 3)/2;
            crossing[p][crossingindex][2] /= xdata.length*3;
            if (crossing[p][crossingindex][2] > 1) crossing[p][crossingindex][2] = 1;
          }
          crossingindex += 1;
          // END OF CALCULATE NUMBER OF INTERSECTION

          // CALCULATE STRAIGHT
          // Euclidean distance / path
          if (xdata.length > 2) {
            straight[p][straightindex][2] = Math.sqrt(Math.pow((xdata[xdata.length-1]-xdata[0]),2)+Math.pow(ydata[ydata.length-1]-ydata[0],2));
            straight[p][straightindex][2] /= path[p][pathindex-1][2]*(xdata.length-1)/7;
          }
          straightindex += 1;
          // END OF STRAIGHT

          // CALCULATE SUM OF ANGLES
          // if (xdata.length > 2){
          //   var anglearr = [];
          //   for (var i = 0; i < xdata.length - 2; i++) {
          //     anglearr[i] = 2*(Math.PI/2 - calculateangle(xdata[i],ydata[i],xdata[i+1],ydata[i+1],xdata[i+2],ydata[i+2]))/Math.PI;
          //   }
          //   anglearr.sort(function(a,b){return a - b});
          //   sumangle[p][sumangleindex][2] = anglearr[Math.floor(anglearr.length*0.9)];
          // }
          if (xdata.length > 2){
            sumangle[p][sumangleindex][2] = 0;
            for (var i = 0; i < xdata.length - 2; i++) {
              sumangle[p][sumangleindex][2] += calculateangle(xdata[i],ydata[i],xdata[i+1],ydata[i+1],xdata[i+2],ydata[i+2]);
            }
            sumangle[p][sumangleindex][2] = 1 - sumangle[p][sumangleindex][2]/((xdata.length-2)*Math.PI);
          }
          sumangleindex += 1;


        }
      }
    });
  }

// SORT SCAGNOSTICS
// create a sortscagarr = array(total plots)
// each element is an array(4)
// [data point, x-variable, y-variable, scag]
// remove meaningless values
// for path = 0 ===> no data
// for monotonictrend = -1 ===> no data
// sort the sortscagarr by scag
// get array in the middle and two ends
  function sortscag() {
    var sortscagarr = [];
    var sortindex = 0;
    for (var i = 0; i < numscag; i++) {
      displayplot[i] = [];
      switch (i) {
        case 0:
          sortscagarr[i] = [];
          path.forEach(function(p,pi){
            p.forEach(function(v){
              sortscagarr[i][sortindex] = [pi,v[0],v[1],v[2]];
              sortindex += 1;
            });
          });
          sortscagarr[i] = sortscagarr[i].filter(function(a){return a[3]});
          sortscagarr[i].sort(function(b,n){return b[3]-n[3]});  // ascending sort
          for (var j = 0; j < numplot; j++) {  // get the lowest paths
            displayplot[i][j] = sortscagarr[i][j];
          }
          for (var j = numplot; j < 2*numplot; j++) {  // get the middle paths
            displayplot[i][j] = sortscagarr[i][Math.floor(sortscagarr[i].length*0.5)+j];
          }
          for (var j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
            displayplot[i][j] = sortscagarr[i][sortscagarr[i].length+j-3*numplot];
          }
          break;
        case 1:
          sortscagarr[i] = [];
          monotonictrend.forEach(function (p,pi) {
            p.forEach(function (mt) {
              sortscagarr[i][sortindex] = [pi,mt[0],mt[1],mt[2]];
              sortindex += 1;
            });
          });
          sortscagarr[i] = sortscagarr[i].filter(function(a){return a[3] >= 0});
          sortscagarr[i].sort(function(b,n){return b[3]-n[3]});  // ascending sort
          for (var j = 0; j < numplot; j++) {  // get the lowest paths
            displayplot[i][j] = sortscagarr[i][j];
          }
          for (var j = numplot; j < 2*numplot; j++) {  // get the middle paths
            displayplot[i][j] = sortscagarr[i][Math.floor(sortscagarr[i].length*0.5)+j];
          }
          for (var j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
            displayplot[i][j] = sortscagarr[i][sortscagarr[i].length+j-3*numplot];
          }
          break;
        case 2:
          sortscagarr[i] = [];
          outlying.forEach(function (p,pi) {
            p.forEach(function (sc) {
              sortscagarr[i][sortindex] = [pi,sc[0],sc[1],sc[2]];
              sortindex += 1;
            });
          });
          sortscagarr[i] = sortscagarr[i].filter(function(a){return a[3] >= 0});
          sortscagarr[i].sort(function(b,n){return b[3]-n[3]});  // ascending sort
          for (var j = 0; j < numplot; j++) {  // get the lowest paths
            displayplot[i][j] = sortscagarr[i][j];
          }
          for (var j = numplot; j < 2*numplot; j++) {  // get the middle paths
            displayplot[i][j] = sortscagarr[i][Math.floor(sortscagarr[i].length*0.5)+j];
          }
          for (var j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
            displayplot[i][j] = sortscagarr[i][sortscagarr[i].length+j-3*numplot];
          }
          break;
        case 3:
          sortscagarr[i] = [];
          crossing.forEach(function (p,pi) {
            p.forEach(function (sc) {
              sortscagarr[i][sortindex] = [pi,sc[0],sc[1],sc[2]];
              sortindex += 1;
            });
          });
          sortscagarr[i] = sortscagarr[i].filter(function(a){return a[3] >= 0});
          sortscagarr[i].sort(function(b,n){return b[3]-n[3]});  // ascending sort
          for (var j = 0; j < numplot; j++) {  // get the lowest paths
            displayplot[i][j] = sortscagarr[i][j];
          }
          for (var j = numplot; j < 2*numplot; j++) {  // get the middle paths
            displayplot[i][j] = sortscagarr[i][Math.floor(sortscagarr[i].length*0.5)+j];
          }
          for (var j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
            displayplot[i][j] = sortscagarr[i][sortscagarr[i].length+j-3*numplot];
          }
          break;
        case 4:
          sortscagarr[i] = [];
          straight.forEach(function (p,pi) {
            p.forEach(function (sc) {
              sortscagarr[i][sortindex] = [pi,sc[0],sc[1],sc[2]];
              sortindex += 1;
            });
          });
          sortscagarr[i] = sortscagarr[i].filter(function(a){return a[3] >= 0});
          sortscagarr[i].sort(function(b,n){return b[3]-n[3]});  // ascending sort
          for (var j = 0; j < numplot; j++) {  // get the lowest paths
            displayplot[i][j] = sortscagarr[i][j];
          }
          for (var j = numplot; j < 2*numplot; j++) {  // get the middle paths
            displayplot[i][j] = sortscagarr[i][Math.floor(sortscagarr[i].length*0.5)+j];
          }
          for (var j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
            displayplot[i][j] = sortscagarr[i][sortscagarr[i].length+j-3*numplot];
          }
          break;
        case 5:
          sortscagarr[i] = [];
          sumangle.forEach(function (p,pi) {
            p.forEach(function (sc) {
              sortscagarr[i][sortindex] = [pi,sc[0],sc[1],sc[2]];
              sortindex += 1;
            });
          });
          sortscagarr[i] = sortscagarr[i].filter(function(a){return a[3] >= 0});
          sortscagarr[i].sort(function(b,n){return b[3]-n[3]});  // ascending sort
          for (var j = 0; j < numplot; j++) {  // get the lowest paths
            displayplot[i][j] = sortscagarr[i][j];
          }
          for (var j = numplot; j < 2*numplot; j++) {  // get the middle paths
            displayplot[i][j] = sortscagarr[i][Math.floor(sortscagarr[i].length*0.5)+j];
          }
          for (var j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
            displayplot[i][j] = sortscagarr[i][sortscagarr[i].length+j-3*numplot];
          }
          break;
      }
    }
  }

  // FIND INTERSECTION
  // input: coordinates of 2 line segments
  // check orientation for each line segments
  // if both are true, return true
  // if not, return false
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

  // CALCULATE ANGLES
  // input: coordinates of 3 points: 1, 2 and 3
  // construct vector 1->2 and 2->3
  // calculate dot product of 2 vectors
  // get the angle
  function calculateangle(x1_,y1_,x2_,y2_,x3_,y3_) {
    var v1x = x2_ - x1_;
    var v1y = y2_ - y1_;
    var v2x = x3_ - x2_;
    var v2y = y3_ - y2_;
    var dotproduct = v1x*v2x+v1y*v2y;
    var v1 = Math.sqrt(v1x*v1x+v1y*v1y);
    var v2 = Math.sqrt(v2x*v2x+v2y*v2y);
    var angle = Math.acos(dotproduct/(v1*v2));
    return angle;
  }


///////////////////////
// END OF CALCULATION
///////////////////////



  doneanalyzation = true;
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
let sel;
function setup() {
  createCanvas(windowWidth,windowHeight);
  frameRate(30);

  // some P5 dependent variables
  plotsize = (0.08*windowWidth < 0.125*windowHeight) ? 0.08*(windowWidth-xblank) : 0.125*(windowHeight - yblank);
  ystartpos = yblank/2+plotsize;
  plotsizet = 0.8*plotsize;

  sel = createSelect();
  sel.position(50, 50);
  sel.option('path');
  sel.option('monotonic trend');
  sel.option('outlying');
  sel.option('crossing');
  sel.option('straight');
  sel.option('sum of angles');
}
///////////////////////////
// END OF SET UP FUNCTION
//////////////////////////



//////////////////
// DRAW FUNCTION
/////////////////
function draw() {

  background(255);

  if (doneanalyzation) {

    // CHOOSE SCAGNOSTIC
    switch (sel.value()) {
      case 'path':
        selectedscag = 0;
        break;
      case 'monotonic trend':
        selectedscag = 1;
        break;
      case 'outlying':
        selectedscag = 2;
        break;
      case 'crossing':
        selectedscag = 3;
        break;
      case 'straight':
        selectedscag = 4;
        break;
      case 'sum of angles':
          selectedscag = 5;
          break;
    }

    for (var i = 0; i < numplot; i++) {
      for (var j = 0; j < 3; j++) {

        var pointdrawed = displayplot[selectedscag][i+j*numplot][0];
        var xvardrawed = displayplot[selectedscag][i+j*numplot][1];
        var yvardrawed = displayplot[selectedscag][i+j*numplot][2];
        var valuedrawed = displayplot[selectedscag][i+j*numplot][3];

        // draw rectangles
        fill(255);
        strokeWeight(1);
        stroke(0);
        rect(xstartpos+0.1*plotsize+j*4.5*plotsize,ystartpos+0.2*plotsize+i*1.4*plotsize,plotsize,plotsize);  // CS
        fill(220);
        noStroke();
        rect(xstartpos+1.3*plotsize+j*4.5*plotsize,ystartpos+0.2*plotsize+i*1.4*plotsize,plotsize,plotsize);  // x-var
        rect(xstartpos+2.5*plotsize+j*4.5*plotsize,ystartpos+0.2*plotsize+i*1.4*plotsize,plotsize,plotsize);  // y-var
        strokeWeight(1);
        stroke(0);
        line(xstartpos+1.3*plotsize+j*4.5*plotsize,ystartpos+0.2*plotsize+i*1.4*plotsize,xstartpos+1.3*plotsize+j*4.5*plotsize,ystartpos+1.2*plotsize+i*1.4*plotsize);  // x-var
        line(xstartpos+1.3*plotsize+j*4.5*plotsize,ystartpos+1.2*plotsize+i*1.4*plotsize,xstartpos+2.3*plotsize+j*4.5*plotsize,ystartpos+1.2*plotsize+i*1.4*plotsize);
        line(xstartpos+2.5*plotsize+j*4.5*plotsize,ystartpos+0.2*plotsize+i*1.4*plotsize,xstartpos+2.5*plotsize+j*4.5*plotsize,ystartpos+1.2*plotsize+i*1.4*plotsize);  // y-var
        line(xstartpos+2.5*plotsize+j*4.5*plotsize,ystartpos+1.2*plotsize+i*1.4*plotsize,xstartpos+3.5*plotsize+j*4.5*plotsize,ystartpos+1.2*plotsize+i*1.4*plotsize);

        // write scagnostic's values
        strokeWeight(1);
        stroke(255,0,0);
        fill(255,0,0);
        textSize(16);
        text(Math.round(valuedrawed*1000)/1000,xstartpos+0.1*plotsize+j*4.5*plotsize,ystartpos+0.15*plotsize+i*1.4*plotsize);

        // write data point notation
        strokeWeight(1);
        stroke(0,0,255);
        fill(0,0,255);
        textSize(16);
        text(mappoint2.get(pointdrawed),xstartpos+1.3*plotsize+j*4.5*plotsize,ystartpos+0.15*plotsize+i*1.4*plotsize);

        // write x-variable notation
        strokeWeight(1);
        stroke(0);
        fill(0);
        textSize(12);
        text(mapvar2.get(xvardrawed),xstartpos+0.1*plotsize+j*4.5*plotsize,ystartpos+1.3*plotsize+i*1.4*plotsize);
        text("time",xstartpos+1.7*plotsize+j*4.5*plotsize,ystartpos+1.3*plotsize+i*1.4*plotsize);
        text("time",xstartpos+2.9*plotsize+j*4.5*plotsize,ystartpos+1.3*plotsize+i*1.4*plotsize);

        //write y-variable notation
        push();
        strokeWeight(1);
        stroke(0);
        fill(0);
        textSize(12);
        translate(xstartpos+0.05*plotsize+j*4.5*plotsize,ystartpos+1.2*plotsize+i*1.4*plotsize);
        rotate(-PI/2);
        text(mapvar2.get(yvardrawed),0,0);
        text(mapvar2.get(xvardrawed),0,1.2*plotsize);
        text(mapvar2.get(yvardrawed),0,2.4*plotsize);
        pop();

        // draw plots
        timedata.forEach(function(step,s){
          if (s) {
            // CS
            var x1 = xstartpos+0.1*plotsize+j*4.5*plotsize+plotsize*drawdata[pointdrawed][xvardrawed][s-1];
            var y1 = ystartpos+0.2*plotsize+i*1.4*plotsize+plotsize*(1-drawdata[pointdrawed][yvardrawed][s-1]);
            var x2 = xstartpos+0.1*plotsize+j*4.5*plotsize+plotsize*drawdata[pointdrawed][xvardrawed][s];
            var y2 = ystartpos+0.2*plotsize+i*1.4*plotsize+plotsize*(1-drawdata[pointdrawed][yvardrawed][s]);
            strokeWeight(1+2*(timedata.length-s)/timedata.length);
            colorMode(HSB,timedata.length);
            stroke(s,timedata.length/2,timedata.length/2);
            line(x1,y1,x2,y2);
            // var ex = x2 - x1;
            // var ey = y2 - y1;
            // var ee = Math.sqrt(ex*ex+ey*ey);
            // if (ey >= 0.00001*plotsize) {
            //   var delta = ee*Math.sin(dirangle)*dirsize/ey;
            //   var xc = x2 - (dirsize*ee*ex*Math.cos(dirangle)/Math.pow(ey,2)+delta)/(1+ex*ex/(ey*ey));
            //   var xd = x2 - (dirsize*ee*ex*Math.cos(dirangle)/Math.pow(ey,2)-delta)/(1+ex*ex/(ey*ey));
            //   var yc = y2-(ee*dirsize*Math.cos(dirangle)-ex*(x2-xc))/ey;
            //   var yd = y2-(ee*dirsize*Math.cos(dirangle)-ex*(x2-xd))/ey;
            //   fill(0);
            //   triangle(x2,y2,xc,yc,xd,yd);
            // } else if (x1 < x2) {
            //   var xc = x2 - dirsize*Math.cos(dirangle);
            //   var xd = x2 - dirsize*Math.cos(dirangle);
            //   var yc = y2 - dirsize*Math.sin(dirangle);
            //   var yd = y2 + dirsize*Math.sin(dirangle);
            //   fill(0);
            //   triangle(x2,y2,xc,yc,xd,yd);
            // } else {
            //   var xc = x2 + dirsize*Math.cos(dirangle);
            //   var xd = x2 + dirsize*Math.cos(dirangle);
            //   var yc = y2 - dirsize*Math.sin(dirangle);
            //   var yd = y2 + dirsize*Math.sin(dirangle);
            //   fill(0);
            //   triangle(x2,y2,xc,yc,xd,yd);
            // }
            // var delta = ee*Math.sin(dirangle)*dirsize/ey;
            // var xc = x2 - (dirsize*ee*ex*Math.cos(dirangle)/Math.pow(ey,2)+delta)/(1+ex*ex/(ey*ey));
            // var xd = x2 - (dirsize*ee*ex*Math.cos(dirangle)/Math.pow(ey,2)-delta)/(1+ex*ex/(ey*ey));
            // var yc = y2 - (ee*dirsize*Math.cos(dirangle)-ex*(x2-xc))/ey;
            // var yd = y2 - (ee*dirsize*Math.cos(dirangle)-ex*(x2-xd))/ey;
            // fill(0);
            // triangle(x2,y2,xc,yc,xd,yd);

            // x-var time series
            var x1 = xstartpos+1.3*plotsize+j*4.5*plotsize+s*plotsize/(timedata.length+1);
            var y1 = ystartpos+0.2 *plotsize+i*1.4*plotsize+plotsize*(1-drawdata[pointdrawed][xvardrawed][s-1]);
            var x2 = xstartpos+1.3*plotsize+j*4.5*plotsize+(s+1)*plotsize/(timedata.length+1);
            var y2 = ystartpos+0.2*plotsize+i*1.4*plotsize+plotsize*(1-drawdata[pointdrawed][xvardrawed][s]);
            strokeWeight(1);
            stroke(0);
            line(x1,y1,x2,y2);

            // y-var time series
            var x1 = xstartpos+2.5*plotsize+j*4.5*plotsize+s*plotsize/(timedata.length+1);
            var y1 = ystartpos+0.2*plotsize+i*1.4*plotsize+plotsize*(1-drawdata[pointdrawed][yvardrawed][s-1]);
            var x2 = xstartpos+2.5*plotsize+j*4.5*plotsize+(s+1)*plotsize/(timedata.length+1);
            var y2 = ystartpos+0.2*plotsize+i*1.4*plotsize+plotsize*(1-drawdata[pointdrawed][yvardrawed][s]);
            strokeWeight(1);
            stroke(0);
            line(x1,y1,x2,y2);
          }

        });


      }
    }

  }
}
