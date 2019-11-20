/////////////////////
/////////////////////
// DECLARE VARIABLES
/////////////////////
////////////////////

let measures = [];  // measures[index][sample][x-var,y-var,value], value = -1 means no data
let nummeasure = 10;
for (var i=0; i<nummeasure; i++) {
  measures[i] = [];
}
let measurename = [
  'Outlying',
  'Straight',
  'Striated',
  'Clumpy',
  'Skewed',
  'Trend',
  'L-shape',
  'Length',
  "Intersections",
  "Loop"
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
let width = 3000;
let height = 6000;
let plotsize = width/10;
let splotsize = width/15;
let numplot = 10;
let selectedmeasure = 0;
let choose = false;   // for selections
let type = [0,0,0,0,0,1,2,2,2,2];   // for type of measures in selection button
let xstartpos = width*0.05;
let ystartpos = 250;




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
            measures[6][p][index][2] = 0;
            var count = 0;
            xdata.forEach(function (x,xi) {
              if (xi) {
                if (x === xdata[xi - 1] || ydata[xi] === ydata[xi - 1]) count += 1;
              }
            });
            // L-SHAPE
            measures[6][p][index][2] = count/xdata.length;  // or timedata.length
          }

          // CALCULATE SOME MEASURES
          // do not consider outliers and L-shape plots
          // The threshold here is 0.6
          if (xdata.length > 1 && measures[6][p][index][2] < 0.6) {
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
            measures[7][p][index][2] = sumlengtha/Math.sqrt(2);
            // MONOTONIC TREND
            measures[5][p][index][2] = Math.max(...dir)/(xdata.length*(xdata.length-1)/2);
            // INTERSECTIONS
            measures[8][p][index][2] = countcrossing;
            // STRIATED
            measures[2][p][index][2] = sumcos/(xdata.length-2);
            // STRAIGHT
            measures[1][p][index][2] = Math.sqrt(Math.pow(xdata[xdata.length-1]-xdata[0],2)+Math.pow(ydata[ydata.length-1]-ydata[0],2))/sumlengtha;
            // SKEWED
            var q10 = sortlengtha[Math.floor(sortlengtha.length*0.1)];
            var q50 = sortlengtha[Math.floor(sortlengtha.length*0.5)];
            var q90 = sortlengtha[Math.floor(sortlengtha.length*0.9)];
            measures[4][p][index][2] = (q90-q50)/(q90-q10);

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
              var maxxi = (countright > countleft) ? maxright : maxleft;
              maxxi /= edgelengtha[xi];
              maxxi = 1 - maxxi;
              measures[3][p][index][2] = (measures[3][p][index][2] < maxxi) ? maxxi : measures[3][p][index][2];
            });

            // LOOP
            var mincurve = Infinity;
            xdata.forEach(function (x,xi) {
              var locallength = 0;
              for (var j = xi + 1; j < xdata.length; j++) {
                locallength += edgelengtha[j-1];
                var Edistance = Math.sqrt(Math.pow(xdata[j] - x,2)+Math.pow(ydata[j] - ydata[xi],2));
                mincurve = (mincurve > Edistance/locallength) ? Edistance/locallength : mincurve;
              }
            });
            measures[9][p][index][2] = 1 - mincurve;



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
      // for (var j = 0; j < numplot; j++) {  // get the lowest paths
      //   displayplot[i][j] = sortarr[j];
      // }
      // for (var j = numplot; j < 2*numplot; j++) {  // get the middle paths
      //   displayplot[i][j] = sortarr[Math.floor(sortarr.length*0.5)+j-numplot];
      // }
      // for (var j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
      //   displayplot[i][j] = sortarr[sortarr.length+j-3*numplot];
      // }
      for (var j = 0; j <3*numplot; j++) {    // look at highest values only
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

    // Write group notation
    fill(255,0,0);
    noStroke();
    textSize(width/100);
    text('Highest values',xstartpos,180);

    // Create list button
    if (!choose) {
      switch (type[selectedmeasure]) {
        case 0:
          fill(239,138,98);
          break;
        case 1:
          fill(247,247,247);
          break;
        case 2:
          fill(103,169,207);
          break;
      }
      noStroke();
      rect(width/3,50,150,width/150);
      fill(0);
      noStroke();
      textSize(13);
      text(measurename[selectedmeasure],width/3+20,45+width/150);
    } else {
      for (var i = 0; i < nummeasure; i++) {
        switch (type[i]) {
          case 0:
            fill(239,138,98);
            break;
          case 1:
            fill(247,247,247);
            break;
          case 2:
            fill(103,169,207);
            break;
        }
        noStroke();
        rect(width/3,50+i*20,150,width/150);
        fill(0);
        noStroke();
        textSize(13);
        text(measurename[i],width/3+20,45+width/150*(i+1));
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
        rect(xstartpos+0.1*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+0.2*plotsize+i*1.4*plotsize,plotsize,plotsize);

        // draw rectangles for time series
        fill(220);
        noStroke();
        rect(xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize-splotsize,splotsize,splotsize); // x-data
        stroke(0);
        line(xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize-splotsize,xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize);
        line(xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize,xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize))+splotsize,ystartpos+1.2*plotsize+i*1.4*plotsize);
        noStroke();
        rect(xstartpos+1.3*(plotsize+splotsize)+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize-splotsize,splotsize,splotsize); // y-data
        stroke(0);
        line(xstartpos+1.3*(plotsize+splotsize)+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize-splotsize,xstartpos+1.3*(plotsize+splotsize)+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize);
        line(xstartpos+1.3*(plotsize+splotsize)+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize,xstartpos+1.3*(plotsize+splotsize)+j*(1.3*(plotsize+2*splotsize))+splotsize,ystartpos+1.2*plotsize+i*1.4*plotsize);


        // write value of measure
        noStroke();
        fill(0);
        textSize(plotsize/12);
        text(measurename[selectedmeasure]+' = '+Math.round(value*100)/100,xstartpos+0.1*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+0.15*plotsize+i*1.4*plotsize);

        // write sample notation
        noStroke();
        fill(0);
        textSize(plotsize/12);
        text(mapsample2.get(sample),xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+0.15*plotsize+i*1.4*plotsize);

        // write x-variable notation
        noStroke();
        fill(0);
        textSize(plotsize/18);
        text(mapvar2.get(xvar),xstartpos+0.1*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.3*plotsize+i*1.4*plotsize);
        text("time",xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.3*plotsize+i*1.4*plotsize);
        text("time",xstartpos+1.3*(plotsize+splotsize)+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.3*plotsize+i*1.4*plotsize);

        //write y-variable notation
        push();
        noStroke();
        fill(0);
        textSize(plotsize/18);
        translate(xstartpos+0.05*plotsize+j*(1.3*(plotsize+2*splotsize)),ystartpos+1.2*plotsize+i*1.4*plotsize);
        rotate(-PI/2);
        text(mapvar2.get(yvar),0,0);
        text(mapvar2.get(xvar),0,1.2*plotsize);
        text(mapvar2.get(yvar),0,1.2*plotsize+1.3*splotsize);
        pop();


        // draw plots
        timedata.forEach(function (time,step) {
          if(step) {
            // CS plots
            if(data[sample][xvar][step]>=0 && data[sample][xvar][step-1]>=0 && data[sample][yvar][step]>=0 && data[sample][yvar][step-1]>=0) {
              var x1 = xstartpos+0.1*plotsize+j*(1.3*(plotsize+2*splotsize))+plotsize*data[sample][xvar][step-1];
              var x2 = xstartpos+0.1*plotsize+j*(1.3*(plotsize+2*splotsize))+plotsize*data[sample][xvar][step];
              var y1 = ystartpos+1.2*plotsize+i*1.4*plotsize-plotsize*data[sample][yvar][step-1];
              var y2 = ystartpos+1.2*plotsize+i*1.4*plotsize-plotsize*data[sample][yvar][step];
              if (step<timedata.length/2) stroke(0,0,255-255*step/(timedata.length/2));
              else stroke((step-timedata.length/2)*255/(timedata.length/2),0,0);
              line(x1,y1,x2,y2);
            }
            // X-var plots
            if(data[sample][xvar][step]>=0 && data[sample][xvar][step-1]>=0) {
              var x1 = xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize))+splotsize*(step-1)/timedata.length;
              var x2 = xstartpos+1.3*plotsize+j*(1.3*(plotsize+2*splotsize))+splotsize*step/timedata.length;
              var y1 = ystartpos+1.2*plotsize+i*1.4*plotsize-splotsize*data[sample][xvar][step-1];
              var y2 = ystartpos+1.2*plotsize+i*1.4*plotsize-splotsize*data[sample][xvar][step];
              if (step<timedata.length/2) stroke(0,0,255-255*step/(timedata.length/2));
              else stroke((step-timedata.length/2)*255/(timedata.length/2),0,0);
              line(x1,y1,x2,y2);
            }
            // Y-var plots
            if(data[sample][yvar][step]>=0 && data[sample][yvar][step-1]>=0) {
              var x1 = xstartpos+1.3*(plotsize+splotsize)+j*(1.3*(plotsize+2*splotsize))+splotsize*(step-1)/timedata.length;
              var x2 = xstartpos+1.3*(plotsize+splotsize)+j*(1.3*(plotsize+2*splotsize))+splotsize*step/timedata.length;
              var y1 = ystartpos+1.2*plotsize+i*1.4*plotsize-splotsize*data[sample][yvar][step-1];
              var y2 = ystartpos+1.2*plotsize+i*1.4*plotsize-splotsize*data[sample][yvar][step];
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
    if (mouseX > width/3 && mouseX < width/3+150 && mouseY > 50 && mouseY < 50+width/150) {
      choose = true;
    }
  } else {
    for (var i = 0; i < nummeasure; i++) {
      if (mouseX > width/3 && mouseX < width/3+150 && mouseY > 50+i*width/150 && mouseY < 50+(i+1)*width/150) {
        selectedmeasure = i;
        choose = false;
      }
    }
    if (mouseX < width/3 || mouseX > width/3+150 || mouseY < 50 || mouseY > 50 + width*(nummeasure+1)/150) {
      choose = false;
    }
  }
}