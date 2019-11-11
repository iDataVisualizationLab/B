// some info of the data
const nV = 14;  // number of variables
const nT = 264;  // number of time points
const nP = 49;  // number of data points

// calculation variables
let data = [];
let path = [];
let meanpath = [];
let maxpathplot = [];
let indexmaxpathplot = [];
let minpathplot = [];
let indexminpathplot = [];

// select data point
let sp;

// layout variables
const width = 2000;
const height = 2000;
const plotsize = 100;
const posx = 300;
const posy = 300;
const rposx = 1400;
const rposy = 20;
var plotmax = [];
var plotmin = [];

// control variables
let donereadingdata = false;

// add data from var file to a map
let vardata;
d3.tsv("data/IndustryFiltered.txt").then(function(data1){
  vardata = data1.map(function (d) {
    return d.name;
  });
  if(data1.length != nV) console.log("wrong number of variables!");
}); // end of adding data from var file to a map

// add data from point file to a map
let pointdata = new Map();
d3.tsv("data/state.txt").then(function(data2){
  pointdata = data2.map(function(d) {
    return d.state;
  });
  if(data2.length != nP) console.log("wrong number of data point!");
}); // end of adding data from point file to a map

// add data from time file to a map
let timedata = new Map();
d3.tsv("data/months.txt").then(function(data3){
  timedata = data3.map(function(d) {
    return d.Time;
  });
  if(data3.length != nT) console.log("wrong number of time point!");




}); // end of adding data from time file to a map

// read file data
let removekey = ["Annual"];
d3.tsv("data/employ2.txt").then(function(data0){
  data0.forEach(function(d,i){
    const listKeys = Object.keys(d);
    listKeys.forEach(lk=>{
      if (removekey.find(rm=>lk.match(rm)))
        delete d[lk];
    });
    data[i] = Object.values(d);
  });
  data.forEach(function(d){
    for (var i = 1; i <= nT; i++){
      d[i] = d[i] ? d[i]:"-1.0";
      if(d[i] == "NaN") d[i] = "-1.0";
    }
  });

  // calculate path = sum(edges)
  // note that there are some time points which have no data/undefined
  // so each edge does not mean the same period of time in connected scatterplot
  // S1: for each time step, check if there is data ot not.
  // if no, skip this step
  // if yes, check if there is data in the next step or not.
  // if no, continue checking the following step to see data.
  // remember this step
  // after finding the next data, calculate as usual
  for (var p = 0; p < nP; p++){
    path[p] = [];
    for (var r = 0; r < nV; r++){
      path[p][r] = [];
      for (var c = 0; c < r; c++){
        // x-axis: data[ssindex+j]
        // y-axis: data[ssindex+i]
        pindex = nV*p;
        path[p][r][c] = 0;
        var numrm = 0;
        for (var n = 1; n < nT; n++) {
          if (data[pindex+r][n] === "-1.0" || data[pindex+c][n] === "-1.0") {
            numrm += 1;
          } else {
            var nnext = n + 1;
            while((data[pindex+r][nnext] === "-1.0" || data[pindex+c][nnext] === "-1.0") && nnext <= nT) {nnext += 1; numrm += 1;}
            if (nnext <= nT) {
              var edgex = (+data[pindex+r][nnext])-(+data[pindex+r][n]);
              var edgey = (+data[pindex+c][nnext])-(+data[pindex+c][n]);
              var edge = Math.sqrt(edgex*edgex+edgey*edgey);
              path[p][r][c] += edge;
            }
          }
        }
        path[p][r][c] /= ((nT-1-numrm));  // to be divided by total edges * sqrt(2) for sure, or total edges as a replacement
      }
    }
  }

  // find mean path of each data point
  path.forEach(function(dp,p){
    meanpath[p] = 0;
    dp.forEach(function(dc,r){
      dc.forEach(function(d,c){
        meanpath[p] += path[p][r][c];
      });
    });
    meanpath[p] /= (nV*(nV-1)/2);
  });

  // find max meanpath to display
  sp = 0;
  meanpath.forEach(function(d,i){
    sp = (meanpath[0] < d) ? i : sp;
  });

  // find maxpathplot to highlight
  path.forEach(function(dp,p){
    maxpathplot[p] = 0;
    indexmaxpathplot[p] = [0,0];
    minpathplot[p] = 2;
    indexminpathplot[p] = [0,0];
    dp.forEach(function(dc,r){
      dc.forEach(function(d,c){
        indexmaxpathplot[p] = (maxpathplot[p] < path[p][r][c]) ? [r,c] : indexmaxpathplot[p];
        maxpathplot[p] = (maxpathplot[p] < path[p][r][c]) ? path[p][r][c] : maxpathplot[p];
        indexminpathplot[p] = (minpathplot[p] > path[p][r][c]) ? [r,c] : indexminpathplot[p];
        minpathplot[p] = (minpathplot[p] > path[p][r][c]) ? path[p][r][c] : minpathplot[p];
      });
    });
  });

  donereadingdata = true;

}); // end of reading file data


function setup() {
  createCanvas(width,height);
}

function draw() {
  background(255);
  if (donereadingdata){
    // draw 5 max plots and 5 min plots
    var max = [];
    var min = [];
    for(var p = 0; p < nP; p++){
      max[p] = maxpathplot[p];
      min[p] = minpathplot[p];
    }
    max.sort(function(b,n){return n-b});
    min.sort(function(b,n){return b-n});
    for (var i = 0; i < 5; i++) {
      // draw max and min plots
      plotmax[i] = [];
      plotmax[i][0] = maxpathplot.findIndex(function(bln){return bln == max[i]});
      plotmax[i][1] = indexmaxpathplot[plotmax[i][0]][0];
      plotmax[i][2] = indexmaxpathplot[plotmax[i][0]][1];
      plotmin[i] = [];
      plotmin[i][0] = minpathplot.findIndex(function(bln){return bln == min[i]});
      plotmin[i][1] = indexminpathplot[plotmin[i][0]][0];
      plotmin[i][2] = indexminpathplot[plotmin[i][0]][1];

      noFill();
      stroke(0);
      rect(rposx,rposy+(plotsize+50)*i,plotsize,plotsize);
      rect(rposx+plotsize+200,rposy+(plotsize+50)*i,plotsize,plotsize);
      textSize(16);
      fill(0);
      text(pointdata[plotmax[i][0]],rposx,rposy+(plotsize+50)*i);
      text(vardata[plotmax[i][1]],rposx+plotsize,rposy+(plotsize+50)*i+plotsize/2);
      text(pointdata[plotmin[i][0]],rposx+plotsize+200,rposy+(plotsize+50)*i);
      text(vardata[plotmin[i][1]],rposx+2*plotsize+200,rposy+(plotsize+50)*i+plotsize/2);
      text(vardata[plotmax[i][2]],rposx+10,rposy+(plotsize+50)*(i+1)-30);
      text(vardata[plotmin[i][2]],rposx+plotsize+210,rposy+(plotsize+50)*(i+1)-30);
      stroke(255,0,0);
      fill(255,0,0);
      text(path[plotmax[i][0]][plotmax[i][1]][plotmax[i][2]],rposx+plotsize,rposy+(plotsize+50)*i+20);
      text(path[plotmin[i][0]][plotmin[i][1]][plotmin[i][2]],rposx+2*plotsize+200,rposy+(plotsize+50)*i+20);

      for (var n = 1; n < nT; n++) {
        if (!(data[nV*plotmax[i][0]+plotmax[i][2]][n] === "-1.0" || data[nV*plotmax[i][0]+plotmax[i][1]][n] === "-1.0")) {
          var nnext = n + 1;
          while((data[nV*plotmax[i][0]+plotmax[i][2]][nnext] === "-1.0" || data[nV*plotmax[i][0]+plotmax[i][1]][nnext] === "-1.0") && nnext <= nT) {nnext += 1;}
          if (nnext <= nT) {
            var x1 = rposx+plotsize*(+data[nV*plotmax[i][0]+plotmax[i][2]][n]);
            var y1 = rposy+(plotsize+50)*i+plotsize*(1-(+data[nV*plotmax[i][0]+plotmax[i][1]][n]));
            var x2 = rposx+plotsize*(+data[nV*plotmax[i][0]+plotmax[i][2]][nnext]);
            var y2 = rposy+(plotsize+50)*i+plotsize*(1-(+data[nV*plotmax[i][0]+plotmax[i][1]][nnext]));
            stroke(0,0,255);
            line(x1,y1,x2,y2);
          }
        }
        if (!(data[nV*plotmin[i][0]+plotmin[i][2]][n] === "-1.0" || data[nV*plotmin[i][0]+plotmin[i][1]][n] === "-1.0")) {
          var nnext = n + 1;
          while((data[nV*plotmin[i][0]+plotmin[i][2]][nnext] === "-1.0" || data[nV*plotmin[i][0]+plotmin[i][1]][nnext] === "-1.0") && nnext <= nT) {nnext += 1;}
          if (nnext <= nT) {
            var x1 = rposx+plotsize+200+plotsize*(+data[nV*plotmin[i][0]+plotmin[i][2]][n]);
            var y1 = rposy+(plotsize+50)*i+plotsize*(1-(+data[nV*plotmin[i][0]+plotmin[i][1]][n]));
            var x2 = rposx+plotsize+200+plotsize*(+data[nV*plotmin[i][0]+plotmin[i][2]][nnext]);
            var y2 = rposy+(plotsize+50)*i+plotsize*(1-(+data[nV*plotmin[i][0]+plotmin[i][1]][nnext]));
            stroke(0,0,255);
            line(x1,y1,x2,y2);
          }
        }
      }
    }


    // draw matrix
    for (var r = 0; r < nV; r++) {
      for (var c = 0; c <= r; c++) {
        stroke(0);
        if (r === indexmaxpathplot[sp][0] && c === indexmaxpathplot[sp][1]) fill(255,0,0,100);
        else noFill();
        rect(c*plotsize+posx,r*plotsize+posy,plotsize,plotsize);
        if (r == c) {
          fill(0);
          textSize(16);
          noStroke();
          text(vardata[r],c*plotsize+posx,r*plotsize+posy+0.5*plotsize);
        } else {
          fill(255,0,0);
          textSize(10);
          noStroke();
          text(path[sp][r][c].toString().substring(0,6),c*plotsize+posx,r*plotsize+posy+10);
          for (var n = 1; n < nT; n++) {
            if (!(data[nV*sp+r][n] === "-1.0" || data[nV*sp+c][n] === "-1.0")) {
              var nnext = n + 1;
              while((data[nV*sp+r][nnext] === "-1.0" || data[nV*sp+c][nnext] === "-1.0") && nnext <= nT) {nnext += 1;}
              if (nnext <= nT) {
                var x1 = c*plotsize+posx+plotsize*(+data[sp*nV+c][n]);
                var y1 = r*plotsize+posy+plotsize*(1-(+data[sp*nV+r][n]));
                var x2 = c*plotsize+posx+plotsize*(+data[sp*nV+c][nnext]);
                var y2 = r*plotsize+posy+plotsize*(1-(+data[sp*nV+r][nnext]));
                stroke(0,0,255);
                line(x1,y1,x2,y2);
              }
            }
          }
        }
      }
    }
  }
}

function mousePressed() {
  if (donereadingdata) {
    var press = false;
    var xcondition = false;
    var ycondition = false;
    var ycondition0 = false;
    var ycondition1 = false;
    var ycondition2 = false;
    var ycondition3 = false;
    var ycondition4 = false;
    var rl;
    var ud;
    if ((mouseX >= rposx && mouseX <= rposx+plotsize)) {xcondition = true; rl = false;}
    if ((mouseX >= rposx+plotsize+200 && mouseX >= rposx+2*plotsize+200)) {xcondition = true; rl = true;}
    if ((mouseY-rposy)/(plotsize+50) >= 0 && (mouseY-rposy-plotsize)/(plotsize) <=0) {ycondition0 = true; ud = 0;}
    if ((mouseY-rposy)/(plotsize+50) >= 1 && (mouseY-rposy-plotsize)/(plotsize) <=1) {ycondition1 = true; ud = 1;}
    if ((mouseY-rposy)/(plotsize+50) >= 2 && (mouseY-rposy-plotsize)/(plotsize) <=2) {ycondition2 = true; ud = 2;}
    if ((mouseY-rposy)/(plotsize+50) >= 3 && (mouseY-rposy-plotsize)/(plotsize) <=3) {ycondition3 = true; ud = 3;}
    if ((mouseY-rposy)/(plotsize+50) >= 4 && (mouseY-rposy-plotsize)/(plotsize) <=4) {ycondition4 = true; ud = 4;}
    ycondition = ycondition0 || ycondition1 || ycondition2 || ycondition3 || ycondition4;
    press = xcondition && ycondition;
    if (press) {
      if (rl) sp = plotmin[ud][0];
      else sp = plotmax[ud][0];
    }
  }
}







