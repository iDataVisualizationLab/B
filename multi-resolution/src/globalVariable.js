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
const height = window.innerHeight;
let ds = [1,2,3,4,5,6,7,8,9,10,11,12];
const timelinePadding = 20;
const timeLineWidth = width - 450 - 50 - 2*timelinePadding;
const chartHeight = (height-100)/ds.length;
const myColor = ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf'];
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
const scaleFactor = 12;
let clicked = false;
let highlighted = false;