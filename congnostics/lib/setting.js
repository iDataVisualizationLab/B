let myWidth = window.innerWidth;
let myHeight = window.innerHeight;
// let selectedDisplay = "2D";
let currentPage = 1;
let maxPerPage = 6;
let maxPage = 1;
let displayType = 'series';
let transformDR = d3.zoomIdentity;
let multipleMouseOver = 1.5;
let mouseOverPosition = [];
let trueMousePosition = [];
let multipleHighlight = 1.5;
// let plotPosition = [];
let pointSize = 3;
let clickArr = [];
let dimensionReductionData;
let xscale, yscale;
let measures = [];  // measures[index][sample][x-var,y-var,value], value = -1 means no data
let nummeasure = 8;
let limitList = [];     // for paper
// let measurename = [
//     'Outlying',
//     'Skinny',
//     'Skewed',
//     'Clumpy',
//     'Sparse',
//     'Striated',
//     'Trend',
//     "Intersections",
//     "Loop",
//     'Cross-correlation',
//     'Length',
// ];
// let measureObj = {
//     'Outlying':0,
//     'Skinny':1,
//     'Skewed':2,
//     'Clumpy':3,
//     'Sparse':4,
//     'Striated':5,
//     'Trend':6,
//     "Intersections":7,
//     "Loop":8,
//     'Cross-correlation':9,
//     'Length':10
// };
let measurename = [
    'Outlying',
    'Clumpy',
    'Striated',
    'Trend',
    'Correlation',
    "Circular",
    'Length',
    "Intersections",
];
let measureObj = {
    'Outlying':0,
    'Clumpy':1,
    'Striated':2,
    'Trend':3,
    'Correlation':4,
    "Circular":5,
    'Length':6,
    "Intersections":7,
};


var application_name ='Joblist';
var jobList=[];
var cluster_info,clusterDescription;
var hostList;
var serviceList,serviceList_selected,serviceListattr,serviceLists, serviceFullList;
function updateMeasureName() {
    serviceList = measurename;
// var serviceList_selected = [{"text":"Temperature","index":0},{"text":"Memory_usage","index":1},{"text":"Fans_speed","index":2},{"text":"Power_consum","index":3}];
    serviceList_selected = measurename.map((d, i) => {
        return {text: d, index: i}
    });
// var serviceListattr = ["arrTemperature","arrMemory_usage","arrFans_health","arrPower_usage","arrJob_scheduling"];
    serviceListattr = measurename;
// var serviceLists = [{"text":"Outlying","id":0,"enable":true,"sub":[{"text":"Outlying","id":0,"enable":true,"idroot":0,"angle":0,"range":[0,1]}]},{"text":"Skinny","id":1,"enable":true,"sub":[{"text":"Skinny","id":0,"enable":true,"idroot":1,"angle":0.5235987755982988,"range":[0,1]}]},{"text":"Skewed","id":2,"enable":true,"sub":[{"text":"Skewed","id":0,"enable":true,"idroot":2,"angle":1.0471975511965976,"range":[0,1]}]},{"text":"Clumpy","id":3,"enable":true,"sub":[{"text":"Clumpy","id":0,"enable":true,"idroot":3,"angle":1.5707963267948966,"range":[0,1]}]},{"text":"Sparse","id":4,"enable":true,"sub":[{"text":"Sparse","id":0,"enable":true,"idroot":4,"angle":2.0943951023931953,"range":[0,1]}]},{"text":"Striated","id":5,"enable":true,"sub":[{"text":"Striated","id":0,"enable":true,"idroot":5,"angle":2.6179938779914944,"range":[0,1]}]},{"text":"Trend","id":6,"enable":true,"sub":[{"text":"Trend","id":0,"enable":true,"idroot":6,"angle":3.141592653589793,"range":[0,1]}]},{"text":"Constant","id":7,"enable":true,"sub":[{"text":"Constant","id":0,"enable":true,"idroot":7,"angle":3.665191429188092,"range":[0,1]}]},{"text":"Intersection","id":8,"enable":true,"sub":[{"text":"Intersection","id":0,"enable":true,"idroot":8,"angle":4.1887902047863905,"range":[0,1]}]},{"text":"Loop","id":9,"enable":true,"sub":[{"text":"Loop","id":0,"enable":true,"idroot":9,"angle":4.71238898038469,"range":[0,1]}]},{"text":"CrossCorrelation","id":10,"enable":true,"sub":[{"text":"CrossCorrelation","id":0,"enable":true,"idroot":10,"angle":5.235987755982989,"range":[0,1]}]},{"text":"Length","id":11,"enable":true,"sub":[{"text":"Length","id":0,"enable":true,"idroot":11,"angle":5.759586531581287,"range":[0,1]}]}];
    serviceLists = measurename.map((d, i) => {
        return {
            text: d,
            id: i,
            enable: true,
            sub: [{
                "text": d,
                "id": 0,
                "enable": true,
                "idroot": i,
                "angle": Math.PI * 2 * i / nummeasure,
                "range": [0, 1]
            }]
        }
    });
// var serviceLists_or = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
    serviceFullList = serviceLists2serviceFullList(serviceLists);
}

updateMeasureName();

srcpath = '../HiperView/';


let jobMap_opt = {
    margin:{top:90,bottom:20,left:20,right:20},
    width: 1000,
    height:500,
    node:{
        r: 5,
    },
    job: {
        r: 10,
        r_inside: 2,
    },user:{
        r: 10,
    },
    radaropt : {
        // summary:{quantile:true},
        mini:true,
        levels:6,
        gradient:true,
        w:40,
        h:40,
        showText:false,
        margin: {top: 0, right: 0, bottom: 0, left: 0},
    },
};
let jobMap_runopt = {
    compute:{type:'radar',clusterJobID:true,clusterJobID_info:{groupBy:1800000},clusterNode:true,},
    graphic:{colorBy:'group'},
    histodram:{resolution:11},
    mouse:{auto:true, lensing: false}
}
function zoomtoogle(event) {
    let oldvval = d3.select(event).classed('lock');
    jobMap.zoomtoogle(!oldvval);
    d3.select(event).classed('lock',!oldvval);
}
function distanceL2(a, b){
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=(d-b[i])*(d-b[i])});
    return Math.round(Math.sqrt(dsum)*Math.pow(10, 10))/Math.pow(10, 10);
}
function distanceL1(a,b) {
    let dsum = 0;
    a.forEach((d,i)=> {dsum +=Math.abs(d-b[i])}); //modified
    return Math.round(dsum*Math.pow(10, 10))/Math.pow(10, 10);
}
function getClusterName (name,index){
    return (sampleS[name].arrcluster||[])[index];
}
function islastimestep(index){
    if(isRealtime)
        return false;
    else
        return index>sampleS.timespan.length-1;
}

// overide getjoblist
function getJoblist (iteration,reset){
    try {
        iteration = iteration||lastIndex
        if (reset===true || reset===undefined)
            jobList = [];
        jobList = sampleJobdata.filter(s=>new Date(s.startTime)<sampleS.timespan[iteration]&&(s.endTime?new Date(s.endTime)>sampleS.timespan[iteration]:true));
        //draw userlist data
        TSneplot.drawUserlist(query_time);
    }catch(e){}
}
function current_userData () {
    let jobByuser = d3.nest().key(function(uD){return uD.user}).entries( jobList);
    jobByuser.forEach(d=>d.unqinode= _.chain(d.values).map(d=>d.nodes).flatten().uniq().value());
    return jobByuser;
}
function systemFormat() {
    jobList=[];
    serviceList = measuresname;
    serviceList_selected = measuresname.map((d,i) => {return {"text":d,"index":i}});
    serviceListattr = measuresname;
    serviceLists = measuresname.map((d,i) => {return {"text":d,"id":i,"enable":true,"sub":[{"text":d,"id":0,"enable":true,"idroot":i,"angle":Math.PI*2*i/nummeasure,"range":[0,1]}]}});
    // serviceLists = [{"text":"Temperature","id":0,"enable":true,"sub":[{"text":"CPU1 Temp","id":0,"enable":true,"idroot":0,"angle":5.585053606381854,"range":[3,98]},{"text":"CPU2 Temp","id":1,"enable":true,"idroot":0,"angle":0,"range":[3,98]},{"text":"Inlet Temp","id":2,"enable":true,"idroot":0,"angle":0.6981317007977318,"range":[3,98]}]},{"text":"Memory_usage","id":1,"enable":true,"sub":[{"text":"Memory usage","id":0,"enable":true,"idroot":1,"angle":1.5707963267948966,"range":[0,99]}]},{"text":"Fans_speed","id":2,"enable":true,"sub":[{"text":"Fan1 speed","id":0,"enable":true,"idroot":2,"angle":2.4870941840919194,"range":[1050,17850]},{"text":"Fan2 speed","id":1,"enable":true,"idroot":2,"angle":2.923426497090502,"range":[1050,17850]},{"text":"Fan3 speed","id":2,"enable":true,"idroot":2,"angle":3.3597588100890845,"range":[1050,17850]},{"text":"Fan4 speed","id":3,"enable":true,"idroot":2,"angle":3.796091123087667,"range":[1050,17850]}]},{"text":"Power_consum","id":3,"enable":true,"sub":[{"text":"Power consumption","id":0,"enable":true,"idroot":3,"angle":4.71238898038469,"range":[0,200]}]}];
    serviceFullList = serviceLists2serviceFullList(serviceLists);
    serviceListattrnest = measuresname.map((d) => {return {key:d,sub:d}});
    serviceAttr = {arrTemperature: {key: "Temperature", val: ["arrTemperatureCPU1","arrTemperatureCPU2"]},
        arrMemory_usage: {key: "Memory_usage", val: ["arrMemory_usage"]},
        arrFans_health: {key: "Fans_speed", val: ["arrFans_speed1","arrFans_speed2"]},
        arrPower_usage:{key: "Power_consumption", val: ["arrPower_usage"]}};
    thresholds = measuresname.map(d => {return [0,1]});
}

let colorScaleList = {
    n: 7,
    rainbow: ["#000066", "#4400ff", "#00ddff", "#00ddaa", "#00dd00", "#aadd00", "#ffcc00", "#ff8800", "#ff0000", "#660000"],
    soil: ["#2244AA","#4A8FC2", "#76A5B1", "#9DBCA2", "#C3D392", "#F8E571", "#F2B659", "#eb6424", "#D63128", "#660000"],
    customschemeCategory:  ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#bcbd22", "#17becf"],
    customFunc: function(name,arr,num){
        const n= num||this.n;
        const arrColor = arr||this[name];
        let colorLength = arrColor.length;
        const arrThresholds=d3.range(0,colorLength).map(e=>e/(colorLength-1));
        let colorTemperature = d3.scaleLinear()
            .domain(arrThresholds)
            .range(arrColor)
            .interpolate(d3.interpolateHcl);

        return d3.range(0,n).map(e=>colorTemperature(e/(n-1)))
    },
    d3colorChosefunc: function(name,num){
        const n = num|| this.n;
        if (d3[`scheme${name}`]) {
            if (typeof (d3[`scheme${name}`][0]) !== 'string') {
                colors = (d3[`scheme${name}`][n]||d3[`scheme${name}`][d3[`scheme${name}`].length-1]).slice();
            }
            else
                colors=  d3[`scheme${name}`].slice();
        } else {
            const interpolate = d3[`interpolate${name}`];
            colors = [];
            for (let i = 0; i < n; ++i) {
                colors.push(d3.rgb(interpolate(i / (n - 1))).hex());
            }
        }
        colors = this.customFunc(undefined,colors,n);
        return colors;
    },
},colorArr = {Radar: [
        {val: 'rainbow',type:'custom',label: 'Rainbow'},
        {val: 'RdBu',type:'d3',label: 'Blue2Red',invert:true},
        {val: 'soil',type:'custom',label: 'RedYelBlu'},
        {val: 'Viridis',type:'d3',label: 'Viridis'},
        {val: 'Greys',type:'d3',label: 'Greys'}],
    Cluster: [{val: 'Category10',type:'d3',label: 'D3'},{val: 'Paired',type:'d3',label: 'Blue2Red'}]};
let colorCluster  = d3.scaleOrdinal().range(d3.schemeCategory10);

let radarChartclusteropt  = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    w: 180,
    h: 180,
    radiuschange: false,
    levels:5,
    dotRadius:2,
    strokeWidth:0.75,
    maxValue: 0.5,
    isNormalize:true,
    showHelperPoint: false,
    roundStrokes: true,
    ringStroke_width: 0.15,
    ringColor:'black',
    fillin:0.5,
    boxplot:false,
    animationDuration:1000,
    events:{
        axis: {
            mouseover: function(){
                try {
                    const d = d3.select(d3.event.detail || this).datum();
                    d3.selectAll('#clusterDisplay .axis' + d.idroot + '_' + d.id).classed('highlight', true);
                    $('.tablesvg').scrollTop($('table .axis' + d.idroot + '_' + d.id)[0].offsetTop);
                }catch(e){}
            },
            mouseleave: function(){
                const d = d3.select(d3.event.detail||this).datum();
                d3.selectAll('#clusterDisplay .axis'+d.idroot+'_'+d.id).classed('highlight',false);
            },
        },
    },
    showText: false};
radarChartclusteropt.schema = serviceFullList;

let myRadarChartClusterOpt  = {
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    w: 180,
    h: 180,
    radiuschange: false,
    levels:5,
    dotRadius:2,
    strokeWidth:0.75,
    maxValue: 0.5,
    isNormalize:true,
    showHelperPoint: false,
    roundStrokes: true,
    ringStroke_width: 0.15,
    ringColor:'black',
    fillin:0.5,
    boxplot:false,
    animationDuration:1000,
    events:{
        axis: {
            mouseover: function(){
                try {
                    const d = d3.select(d3.event.detail || this).datum();
                    d3.selectAll('#clusterDisplay .axis' + d.idroot + '_' + d.id).classed('highlight', true);
                    $('.tablesvg').scrollTop($('table .axis' + d.idroot + '_' + d.id)[0].offsetTop);
                }catch(e){}
            },
            mouseleave: function(){
                const d = d3.select(d3.event.detail||this).datum();
                d3.selectAll('#clusterDisplay .axis'+d.idroot+'_'+d.id).classed('highlight',false);
            },
        },
    },
    showText: false};

myRadarChartClusterOpt.schema = serviceFullList;