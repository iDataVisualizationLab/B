// DATA
let fileName = {
    "employment": 'data/employment_tf.json',
    "HPCC": 'data/hpcc_tf.json',
    "death-birth": 'data/death_birth_tf.json',
    "life-expectancy": 'data/Life_expectancy_tf.json',
};
let tKey = [];
let iKey = [];
let pKey = [];
let mKey = ['Outlying vector','Outlying length','Outlying angle','Correlation','Entropy','Intersection','Translation','Homogeneous'];
let score = [];
let data = [];

// INTERFACE DESIGN
const width = window.innerWidth;
const height = window.innerHeight - 50;
let ds = [1,2,3,4,5,6,7,8,9,10,11,12];
const timelinePadding = 20;
const timeLineWidth = width - 450 - 50 - 2*timelinePadding;
const chartHeight = height/ds.length;
const myColor = ['#3288bd','#66c2a5','#abdda4','#e6f598','#ffffbf','#fee08b','#fdae61','#f46d43','#d53e4f'];
let timelineStep = 12;
let timelineText = 1;
let pPadding = 5;

// CONTROL PANEL
let selectedData = 'employment';
let selectedMetric = 'Outlying vector';
let selectedPlot = 'Total Nonfarm vs. Total Private';

// INTERACTION
let mouse = {
    x: undefined,
    y: undefined,
}
let cMouse = {
    x: undefined,
    y: undefined,
}
const lR = 3;
const scaleFactor = 20;
let clicked = false;
let highlighted = false;