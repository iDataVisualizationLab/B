/////////////////////
/////////////////////
// DECLARE VARIABLES
/////////////////////
////////////////////



// VARIABLES FOR STORING DATA
let data = []; // data[sample][variable][time step] for raw data
let dataRaw = [];
let mapsample0 = new Map(); // code -> data sample name
let mapsample1 = new Map(); // data sample name -> index in data[data sample]
let mapsample2 = new Map(); // index -> data sample name
let mapvar0 = new Map();  // code -> variable name
let mapvar1 = new Map();  // variable name -> index in data[variable]
let mapvar2 = new Map(); // index -> variable name
let timedata = [];
let newmeasures = {};

// VARIABLES FOR CALCULATIONS
let numcell = 40;
let cellsize = 1/numcell;
let cellval = [];
let lag = 0;
let selecteddata= 'death_rate';
let myPeriodogramDraw = [];
let peakPeri = [];

// VARIABLES FOR CONTROLLING
let needupdate = false;
let needcalculation = true;
let doneCalculation = false;
let videoOnly = true;
let isFirstTime = true;

// VARIABLES FOR VISUALIZATION
let displayplot = [];   // displayplot[measure index][0->numplot-1:lowest, numplot->2numplot-1: middle, 2numplot->3numplot-1: highest][sample, x-var, y-var,value,index]
let width = 2000;
let height = 2400;
let numColumn = 72;
let columnSize = width/numColumn;
let numplot = 10;
let newnumplot = 0;
let selectedmeasure = 0;
let choose = false;   // for selections
let chooseType = "series";
let type = [0,0,0,1,1,1,1,1];   // for type of measures in selection button
let checkfilter = [];
let valfilter = [];
for (var i = 0; i < nummeasure; i++) {
    checkfilter[i] = false;
    valfilter[i] = [0,1];
}
// radar control
let MetricController = radarController();
let Radarplot_opt = {
    clusterMethod: 'kmean',
};
let leaderList;
// Dimension reduction variable
let tsneTS;
let pcaTS;
let umapTS;
let visualizingOption = 'LMH';
let interactionOption = {
    'sample': 'noOption',
    'variable1': 'noOption',
    'variable2': 'noOption',
    'time1':'noOption',
    'time2':'noOption',
};
var TsneTSopt = {width:myWidth-300,height:myHeight};
var PCAopt = {width:myWidth-300,height:myHeight};
var umapopt = {width:myWidth-300,height:myHeight};
// worker
let clustercalWorker;
let getDataWorker;
let dataRadar1 = [];
let dataRadar2 = [];
let dataRadar;

////////////////////////////////
////////////////////////////////
// UI CODE
///////////////////////////////
///////////////////////////////
function settingMeasureUpdate() {
    let mc_o = d3.select('#measureControl').selectAll('.measureControl')
        .data(measurename); // update data
    mc_o.exit().remove(); // remove exit data
    let mc = mc_o.enter().append('div').attr('class', 'measureControl row valign-wrapper')
        .attr('disabled', 'disabled'); // new data

    let mc_labelr = mc.append('label').attr('class', 'col s2 measureName');
    mc_labelr.append('input').attr('type', 'radio').attr('name', 'orderMeasure').attr('class', 'with-gap');
    mc_labelr.append('span');
    let mc_labeln = mc.append('label').attr('class', 'col s6 measureFilter');
    mc_labeln.append('span').attr('class', 'col measureLabel');
    let mc_label = mc.append('label').attr('class', 'col s1 measureFilterCheck');
    mc_label.append('input').attr('type', 'checkbox').attr('class', 'filled-in enableCheck');
    mc_label.append('span');
    mc.append('div').attr('class', 'sliderHolder col s3').each(function () {
        if ($(this)[0].noUiSlider)
            $(this)[0].noUiSlider.destroy();
        noUiSlider.create(this, {
            start: [0, 1],
            connect: true,
            range: {
                'min': 0,
                'max': 1
            },
        }).on('change', function (values) {
            valfilter[measureObj[d3.select(this.target).datum()]][0] = +(values[0]);
            valfilter[measureObj[d3.select(this.target).datum()]][1] = +(values[1]);
            needupdate = true;
        });
    });

    mc = d3.select('#measureControl').selectAll('.measureControl'); // reselect
    mc.select('label.measureName').select('input')
        .attr('checked', d => selectedmeasure === measureObj[d] ? '' : null)
        .on('change', function (d) {
            console.log(d);
            selectedmeasure = measureObj[d];
            needupdate = true;
        });
    mc.select('label.measureFilter').select('span')
        .style('color', d => 'rgb(' + getcolor(measureObj[d]).join(',') + ')').style('font-family', 'Arial')
        .text(d => d);
    mc.select('label.measureFilterCheck')
        .on('change', function (d) {
            checkfilter[measureObj[d]] = !checkfilter[measureObj[d]];
            // console.log(this.checked);
            // console.log(d);
            d3.select(this.parentNode.parentNode).attr('disabled', this.checked ? null : 'disabled');
            needupdate = true;
        });
}

function onTabChange (myTab_) {
    // let myVideo = document.getElementById('videoIn');
    if (myTab_==='video') {
        preloader(false);
        closeNav();
        videoOnly = true;
        // myVideo.muted = true;
        // myVideo.play();
        console.log($('#videoIn')[0]);
        $('#videoIn')[0].play();

        d3.select('#video').classed('hide',false);
        d3.select('#demo').classed('hide',true);

    } else if (myTab_==='demo') {
        if (isFirstTime) preloader(true);
        openNav();
        videoOnly = false;
        isFirstTime = false;
        // myVideo.muted = true;
        // myVideo.pause();
        $('#videoIn')[0].pause();

        d3.select('#video').classed('hide',true);
        d3.select('#demo').classed('hide',false);

        $('.sidenav').sidenav();
        discovery('#sideNavbtn');
        // openNav();
        d3.select("#DarkTheme").on("click", switchTheme);
        $('input[type=radio][name=viztype]').change(function() {
            updateViztype(this.value);
        });
        d3.select('#clusterMethod').on('change',function(){
            Radarplot_opt.clusterMethod = this.value;
            // Radarplot.binopt(Radarplot_opt);
            d3.selectAll('.clusterProfile').classed('hide',true);
            d3.select(`#${this.value}profile`).classed('hide',false);
        });
        // generate measurement list
        settingMeasureUpdate();

        // Radar control
        MetricController.graphicopt({width:365,height:365})
            .div(d3.select('#RadarController'))
            .tablediv(d3.select('#RadarController_Table'))
            .axisSchema(serviceFullList)
            .onChangeValue(onSchemaUpdate)
            .init();
        // set event for viz type
        $('input[type=radio][name=viztype]').change(function() {
            updateViztype(this.value);
        });

        d3.select('#majorGroupDisplay_control').on('change',function() {
            radarChartclusteropt.boxplot = $(this).prop('checked');
            cluster_map(cluster_info);
        });
        // data options
        d3.select('#datacom').on('change',function(){
            selecteddata = this.value;
            if (selecteddata === 'ECG' || selecteddata === 'Bao') {
                d3.select('#pca').attr('disabled',true);
                d3.select('#t_sne').attr('disabled',true);
                d3.select('#umap').attr('disabled',true);
            } else {
                d3.select('#pca').attr('disabled',null);
                d3.select('#t_sne').attr('disabled',null);
                d3.select('#umap').attr('disabled',null);
            }
            needcalculation = true;
            d3.select('.cover').classed('hidden', false);
            if(visualizingOption === 'LMH') {
                d3.select('#mainCanvasHolder').classed('hide',false);
                d3.select('#tSNE').classed('hide',true);
                d3.select('#dataInstances').attr('disabled','');
                d3.select('#variable1').attr('disabled','');
                d3.select('#variable2').attr('disabled','');
            }
            if(visualizingOption === 'tSNE'||visualizingOption === 'PCA'||visualizingOption === 'UMAP') {
                d3.select('#mainCanvasHolder').classed('hide', true);
                d3.select('#tSNE').classed('hide', false);
                recalculateCluster( {clusterMethod: $('#clusterMethod').val() || 'kmean',bin:{k:$('#knum').val() || 6,iterations:$('#kiteration').val() || 1}},function(){
                    plotPosition = [];
                    reCalculateTsne();
                });
                d3.select('#dataInstances').attr('disabled',null);
                d3.select('#variable1').attr('disabled',null);
                d3.select('#variable2').attr('disabled',null);
            }
            clickArr.length = 0;      // delete clickArr after changing mode
            interactionOption.sample = 'noOption';
            interactionOption.variable1 = 'noOption';
            interactionOption.variable2 = 'noOption';
            interactionOption.time1 = 'noOption';
            interactionOption.time2 = 'noOption';
            $('#dataInstances').val('noOption').selected = true;
            $('#variable1').val('noOption').selected = true;
            $('#variable2').val('noOption').selected = true;
            $('#myTime1').val('noOption').selected = true;
            $('#myTime2').val('noOption').selected = true;
        });
        // visualizing option
        d3.select('#mainCanvasHolder').classed('hide',false);
        d3.select('#visualizing').on('change',function(){
            visualizingOption = this.value;
            if (visualizingOption !== 'LMH') {
                d3.select('#ecg').attr('disabled',true);
                d3.select('#test').attr('disabled',true);
            } else {
                d3.select('#ecg').attr('disabled',null);
                d3.select('#test').attr('disabled',null);
            }
            // console.log(this.value);
            if(visualizingOption === 'LMH') {
                d3.select('#mainCanvasHolder').classed('hide',false);
                d3.select('#tSNE').classed('hide',true);
                d3.select('#dataInstances').attr('disabled','');
                d3.select('#variable1').attr('disabled','');
                d3.select('#variable2').attr('disabled','');
                d3.select('#metrics').classed('hidden',false);
            }
            if(visualizingOption === 'PCA') {
                d3.select('#mainCanvasHolder').classed('hide',true);
                d3.select('#tSNE').classed('hide',false);
                d3.select('#metrics').classed('hidden',true);
                onchangeVizType(visualizingOption);
                onchangeVizdata(visualizingOption);
                d3.select('#dataInstances').attr('disabled',null);
                d3.select('#variable1').attr('disabled',null);
                d3.select('#variable2').attr('disabled',null);
                clickArr.length = 0;
            }
            if(visualizingOption === 'UMAP') {
                d3.select('#mainCanvasHolder').classed('hide',true);
                d3.select('#tSNE').classed('hide',false);
                d3.select('#metrics').classed('hidden',true);
                onchangeVizType(visualizingOption);
                onchangeVizdata(visualizingOption);
                d3.select('#dataInstances').attr('disabled',null);
                d3.select('#variable1').attr('disabled',null);
                d3.select('#variable2').attr('disabled',null);
                clickArr.length = 0;
            }
            if(visualizingOption === 'tSNE') {
                d3.select('#mainCanvasHolder').classed('hide',true);
                d3.select('#tSNE').classed('hide',false);
                d3.select('#metrics').classed('hidden',true);
                onchangeVizType(visualizingOption);
                onchangeVizdata(visualizingOption);
                d3.select('#dataInstances').attr('disabled',null);
                d3.select('#variable1').attr('disabled',null);
                d3.select('#variable2').attr('disabled',null);
                clickArr.length = 0;
            }
            interactionOption.sample = 'noOption';
            interactionOption.variable1 = 'noOption';
            interactionOption.variable2 = 'noOption';
            interactionOption.time1 = 'noOption';
            interactionOption.time2 = 'noOption';
            $('#dataInstances').val('noOption').selected = true;
            $('#variable1').val('noOption').selected = true;
            $('#variable2').val('noOption').selected = true;
            $('#myTime1').val('noOption').selected = true;
            $('#myTime2').val('noOption').selected = true;
        });
        // interaction option
        d3.select('#dataInstances').on('change',function(){
            interactionOption.sample = this.value;
            if (interactionOption.sample !== 'noOption') {clickArr.length = 0; currentPage = 1;}    // delete clicked charts after changing to interaction
        });
        d3.select('#variable1').on('change',function(){
            interactionOption.variable1 = this.value;
            if (interactionOption.variable1 !== 'noOption') {clickArr.length = 0; currentPage = 1;}   // delete clicked charts after changing to interaction
        });
        d3.select('#variable2').on('change',function(){
            interactionOption.variable2 = this.value;
            if (interactionOption.variable2 !== 'noOption') {clickArr.length = 0; currentPage = 1;}   // delete clicked charts after changing to interaction
        });
        d3.select('#myTime1').on('change',function(){
            interactionOption.time1 = +this.value;
        });
        d3.select('#myTime2').on('change',function(){
            interactionOption.time2 = +this.value;
        });
        d3.select('#submit').on('click',function(){
            switch (visualizingOption) {
                case 'PCA':
                    pcaTS.renderPCA();
                    break;
                case 'tSNE':
                    tsneTS.renderTSNE();
                    break;
                case 'UMAP':
                    umapTS.renderUMAP();
                    break;
                case 'LMH':
                    needupdate = true;
                    draw();
                    break;
            }
        });

        // display chart options
        $('input[type=radio][name=displayType]').change(function() {
            displayType = this.value;
            switch (visualizingOption) {
                case 'PCA':
                    pcaTS.renderPCA();
                    break;
                case 'tSNE':
                    tsneTS.renderTSNE();
                    break;
                case 'UMAP':
                    umapTS.renderUMAP();
                    break;
            }
        });
        // zoom effect
        // let myDRCanvas = d3.select('tsneSreen_svg'),
        //     context = myDRCanvas.node().getContext("2d"),
        //     width = myDRCanvas.property("width"),
        //     height = myDRCanvas.property("height");
        // myDRCanvas.call(d3.zoom().scaleExtent([0.5, 8]).on("zoom", zoomFunction()));

        // dimension option

        // display mode
        // d3.select('#displaymode').on('change',function (){
        //     choose = (+this.value !== 0);
        //     needupdate = true;
        //     console.log('mode = '+this.value);
        // });

        // change type of chart in dimension reduction techniques
        d3.select('#tsneScreen_svg').on('click',onClickFunction).on('mousemove',mouseOverFunction);
    }
}

$( document ).ready(function() {
    // try {
        $('.collapsible.expandable').collapsible({
            accordion: false,
            inDuration:1000,
            outDuration:1000,
        });
        $('.modal').modal();
        $('.dropdown-trigger').dropdown();

        onTabChange('demo');

    // }catch{}
});
function onSchemaUpdate(schema){ // update angle
    serviceFullList.forEach(ser=>{
        ser.angle = schema.axis[ser.text].angle();
        ser.enable = schema.axis[ser.text].data.enable;
    });
    // radarChartOptions.schema = serviceFullList;
    // TSneplot.schema(serviceFullList,firstTime);
    // Radarplot.schema(serviceFullList,firstTime);
    if (cluster_info){
        // jobMap.schema(serviceFullList);
        radarChartclusteropt.schema = serviceFullList;}
    if (!firstTime) {
        // updateSummaryChartAll();
        MetricController.drawSummary();
        if (cluster_info) {
            cluster_map(cluster_info);
            // jobMap.draw();
        }
    }
    // }
    // if (db!=='csv')
    //     SaveStore();
}
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
    doneCalculation = false;
    // d3.select('.cover').classed('hide',false);
    let filename0;
    let filename1;
    let filename2;
    switch (selecteddata) {
        case 'employment':
            filename0 =  "data/US_employment.txt";
            filename1 = "data/statecode.txt";
            filename2 = "data/Industrycode_reduced.txt";
            break;
        // case 'RUL':
        //     filename0 = "data/RUL_data.txt";
        //     filename1 = "data/engine_code.txt";
        //     filename2 = "data/sensor_code.txt";
        //     break;
        case 'stock':
            filename0 = "data/stock_data.txt";
            filename1 = "data/year_code.txt";
            filename2 = "data/var_code.txt";
            break;
        // case 'ECG':
        //     filename0 = "data/ECG_dog.txt";
        //     filename1 = "data/ECG_sample_code.txt";
        //     filename2 = "data/ECG_varCode.txt";
        //     break;
        // case 'EEG':
        //     filename0 = "data/eeg_data.txt";
        //     filename1 = "data/eeg_code.txt";
        //     filename2 = "data/eeg_v_code.txt";
        //     break;
        // case 'Bao':
        //     filename0 = "data/Bao_dataset.txt";
        //     filename1 = "data/Bao_data_sample.txt";
        //     filename2 = "data/Bao_data_var.txt";
        //     break;
        case 'death_rate':
            filename0 = "data/birth_death_rate.csv";
            filename1 = "data/death_rate_code.txt";
            filename2 = "data/death_rate_var.txt";
            break;
        case 'house_price':
            filename0 = 'data/house_financial.txt';
            filename1 = 'data/state_code.txt';
            filename2 = 'data/house_financial_code.txt';
            break;
        case 'Life_expectancy':
            filename0 = 'data/Life_expectancy.txt';
            filename1 = 'data/Country_code.txt';
            filename2 = 'data/Gender_code.txt';
            break;
        // case 'ozone':
        //     filename0 = "data/ozone_onehour.txt";
        //     filename1 = "data/ozone_sample.txt";
        //     filename2 = "data/ozone_variable.txt";
        //     break;
        // case 'air_quality':
        //     filename0 = "data/airQuality_reduced.txt";
        //     filename1 = "data/airQuality_sample.txt";
        //     filename2 = "data/airQuality_variable.txt";
        //     break;
        // case 'DowJones':
        //     filename0 = "data/DowJonesIndex.txt";
        //     filename1 = "data/DJIndex_sample.txt";
        //     filename2 = "data/DJIndex_variable.txt";
        //     break;
        // case 'HPCC_0':
        //     filename0 = "data/HPCC_02Jun2019.csv";
        //     filename1 = "data/HPCC_host.tsv";
        //     filename2 = "data/HPCC_service_2.tsv";
        //     break;
        // case 'HPCC_1':
        //     filename0 = "data/HPCC_03Jun2019.csv";
        //     filename1 = "data/HPCC_host.tsv";
        //     filename2 = "data/HPCC_service_2.tsv";
        //     break;
        // case 'HPCC_2':
        //     filename0 = "data/HPCC_04Jun2019.csv";
        //     filename1 = "data/HPCC_host.tsv";
        //     filename2 = "data/HPCC_service_2.tsv";
        //     break;
        // case 'HPCC_3':
        //     filename0 = "data/HPCC_05Jun2019.csv";
        //     filename1 = "data/HPCC_host.tsv";
        //     filename2 = "data/HPCC_service_2.tsv";
        //     break;
        // case 'HPCC_4':
        //     filename0 = "data/HPCC_06Jun2019.csv";
        //     filename1 = "data/HPCC_host.tsv";
        //     filename2 = "data/HPCC_service_2.tsv";
        //     break;
        // case 'HPCC_5':
        //     filename0 = "data/HPCC_07Jun2019.csv";
        //     filename1 = "data/HPCC_host.tsv";
        //     filename2 = "data/HPCC_service_2.tsv";
        //     break;
        // case 'HPCC_6':
        //     filename0 = "data/HPCC_08Jun2019.csv";
        //     filename1 = "data/HPCC_host.tsv";
        //     filename2 = "data/HPCC_service_2.tsv";
        //     break;
        case 'hpcc':
            filename0 = 'data/hpcc_users.csv';
            filename1 = 'data/hpcc_instance.tsv';
            filename2 = 'data/hpcc_variables.tsv';
    }

    Promise.all([
        d3.csv(filename0),
        d3.tsv(filename1),
        d3.tsv(filename2),
    ]).then(function (files) {

        data.length = 0; // data[sample][variable][time step] for raw data
        dataRaw.length = 0;
        mapsample0.clear(); // code -> data sample name
        mapsample1.clear(); // data sample name -> index in data[data sample]
        mapsample2.clear(); // index -> data sample name
        mapvar0.clear();  // code -> variable name
        mapvar1.clear();  // variable name -> index in data[variable]
        mapvar2.clear(); // index -> variable name
        timedata.length = 0;
        measures.length = 0;

///////////////////////////////////////
// READ DATA TO RESTORING VARIABLES
//////////////////////////////////////
        //MAP DATA sample
        files[1].forEach(function (sample, p) {
            if (!mapsample0.get(sample.code)) mapsample0.set(sample.code, sample.name);  // code-string to name-string
            if (!mapsample1.get(sample.name)) mapsample1.set(sample.name, p);  // name-string to index-number
            if (!mapsample2.get(p)) mapsample2.set(p, sample.name);   // index-number to name-string
            data[p] = [];
            dataRaw[p] = [];
        });

        // MAP VARIABLES
        files[2].forEach(function (variable, v) {
            if (!mapvar0.get(variable.code)) mapvar0.set(variable.code, variable.name);  // code-string to name-string
            if (!mapvar1.get(variable.name)) mapvar1.set(variable.name, v);  // name-string to index-number
            if (!mapvar2.get(v)) mapvar2.set(v, variable.name);
            data.forEach(function (d) {
                d[v] = [];
            });
            dataRaw.forEach(function (d) {
                d[v] = [];
            });
        });

        // for paper - remove some variables
        limitList = [];

            if (mapvar1.get('Mining, Logging')) limitList.push(mapvar1.get('Mining, Logging'));
            if (mapvar1.get('Wholesale Trade')) limitList.push(mapvar1.get('Wholesale Trade'));
            if (mapvar1.get('Retail Trade')) limitList.push(mapvar1.get('Retail Trade'));
            if (mapvar1.get('Finance and Insurance')) limitList.push(mapvar1.get('Finance and Insurance'));
            if (mapvar1.get('Educational Services')) limitList.push(mapvar1.get('Educational Services'));
            if (mapvar1.get('Private Service Providing')) limitList.push(mapvar1.get('Private Service Providing'));
            if (mapvar1.get('State Government')) limitList.push(mapvar1.get('State Government'));
            if (mapvar1.get('Local Government')) limitList.push(mapvar1.get('Local Government'));
            if (mapvar1.get('Health Care, Social Assistance')) limitList.push(mapvar1.get('Health Care, Social Assistance'));
            if (mapvar1.get('Durable Goods')) limitList.push(mapvar1.get('Durable Goods'));
            if (mapvar1.get('Non-Durable Goods')) limitList.push(mapvar1.get('Non-Durable Goods'));
            if (mapvar1.get('Administrative and Support and Waste Management and Remediation Services')) limitList.push(mapvar1.get('Administrative and Support and Waste Management and Remediation Services'));


        // TIME NAME
        if (selecteddata !== 'ozone' && selecteddata !== 'air_quality' || selecteddata !== 'DowJones' || selecteddata !== 'hpcc')
            timedata = files[0].columns.filter(function (step) {
                if (selecteddata !== 'death_rate') return step !== "Series ID";
                else return step !=='CountryName' && step !== 'CountryCode' && step !== 'Type';
            });
        if (selecteddata === 'hpcc') {
            timedata = files[0].columns.filter(function (step) {
                return step !== 'Series ID' && step !== 'User';
            });
        }

        // for loop computation
            let myData = new Data_processing(files);
            myData.read();
            let compute = new Visual_feature_2D(false);
            compute.Loop();

        switch (selecteddata) {
            case 'employment':
                // WRITE DATA TO DATA[]
                data.forEach(function (sample) {
                    sample.forEach(function (variable) {
                        timedata.forEach(function (step, s) {
                            variable[s] = -Infinity;
                        });
                    });
                });
                dataRaw.forEach(function (sample) {
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
                            dataRaw[sampleindex][varindex][s] = isNaN(parseFloat(line[step])) ? -Infinity : parseFloat(line[step]);
                        } else {
                            data[sampleindex][varindex][s] = -Infinity;
                            dataRaw[sampleindex][varindex][s] = -Infinity;
                        }
                    });
                });
                // compute loop
                // let myData = new Data_processing(files);
                // myData.read();
                // let compute = new Visual_feature_2D(false);
                // compute.Loop();
                break;
            case "death_rate":
                // WRITE DATA TO DATA[]
                data.forEach(function (sample) {
                    sample.forEach(function (variable) {
                        timedata.forEach(function (step, s) {
                            variable[s] = -Infinity;
                        });
                    });
                });
                dataRaw.forEach(function (sample) {
                    sample.forEach(function (variable) {
                        timedata.forEach(function (step, s) {
                            variable[s] = -Infinity;
                        });
                    });
                });
                files[0].forEach(function (line) {
                    var varindex = mapvar1.get(mapvar0.get(line['Type']));
                    var sampleindex = mapsample1.get(mapsample0.get(line['CountryCode']));
                    timedata.forEach(function (step, s) {
                        data[sampleindex][varindex][s] = isNaN(parseFloat(line[step])) ? -Infinity : parseFloat(line[step]);
                        dataRaw[sampleindex][varindex][s] = isNaN(parseFloat(line[step])) ? -Infinity : parseFloat(line[step]);
                    });
                });
                break;
            // case 'ozone':
            //     files[0].forEach((line,index)=>{
            //         timedata[index] = line.Date;
            //     });
            //     data.forEach(function (sample) {
            //         sample.forEach(function (variable) {
            //             timedata.forEach(function (step, s) {
            //                 variable[s] = -Infinity;
            //             });
            //         });
            //     });
            //     dataRaw.forEach(function (sample) {
            //         sample.forEach(function (variable) {
            //             timedata.forEach(function (step, s) {
            //                 variable[s] = -Infinity;
            //             });
            //         });
            //     });
            //     files[0].forEach((line,index) => {
            //         files[2].forEach((line_,index_)=>{
            //             data[0][index_][index] = isNaN(parseFloat(line[line_.name])) ? -Infinity : parseFloat(line[line_.name]);
            //             dataRaw[0][index_][index] = isNaN(parseFloat(line[line_.name])) ? -Infinity : parseFloat(line[line_.name]);
            //         });
            //     });
            //     break;
            // case 'air_quality':
            //     let timeLength = files[0].length/files[1].length;
            //     for (let i = 0; i < timeLength; i++) {
            //         timedata[i] = files[0][i].hour+':00,'+files[0][i].month+'/'+files[0][i].day+'/'+files[0][i].year;
            //     }
            //     data.forEach(function (sample) {
            //         sample.forEach(function (variable) {
            //             timedata.forEach(function (step, s) {
            //                 variable[s] = -Infinity;
            //             });
            //         });
            //     });
            //     dataRaw.forEach(function (sample) {
            //         sample.forEach(function (variable) {
            //             timedata.forEach(function (step, s) {
            //                 variable[s] = -Infinity;
            //             });
            //         });
            //     });
            //     files[0].forEach((line,index)=>{
            //         let sampleIndex = mapsample1.get(line.station);
            //         let index__ = index%timeLength;
            //         files[2].forEach((line_,index_)=>{
            //             data[sampleIndex][index_][index__] = isNaN(parseFloat(line[line_.name])) ? -Infinity : parseFloat(line[line_.name]);
            //             dataRaw[sampleIndex][index_][index__] = isNaN(parseFloat(line[line_.name])) ? -Infinity : parseFloat(line[line_.name]);
            //         });
            //     });
            //     break;
            // case 'DowJones':
            //     data.forEach(function (sample) {
            //         sample.forEach(function (variable) {
            //             timedata.forEach(function (step, s) {
            //                 variable[s] = -Infinity;
            //             });
            //         });
            //     });
            //     dataRaw.forEach(function (sample) {
            //         sample.forEach(function (variable) {
            //             timedata.forEach(function (step, s) {
            //                 variable[s] = -Infinity;
            //             });
            //         });
            //     });
            //     let count = 0;
            //     files[0].forEach(line=>{
            //         if (line.stock === 'AA') {
            //             timedata[count] = line.date;
            //             count += 1;
            //         }
            //     });
            //     files[0].forEach((line,index)=>{
            //         let sampleIndex = mapsample1.get(mapsample0.get(line.stock));
            //         files[2].forEach((line_,index_)=>{
            //             data[sampleIndex][index_][timedata.findIndex(t=>t===line.date)] = isNaN(parseFloat(line[line_.name])) ? -Infinity : parseFloat(line[line_.name]);
            //             dataRaw[sampleIndex][index_][timedata.findIndex(t=>t===line.date)] = isNaN(parseFloat(line[line_.name])) ? -Infinity : parseFloat(line[line_.name]);
            //         });
            //     });
            //     break;
            // case 'house_price':
            //     data.forEach(function (sample) {
            //         sample.forEach(function (variable) {
            //             timedata.forEach(function (step, s) {
            //                 variable[s] = -Infinity;
            //             });
            //         });
            //     });
            //     dataRaw.forEach(function (sample) {
            //         sample.forEach(function (variable) {
            //             timedata.forEach(function (step, s) {
            //                 variable[s] = -Infinity;
            //             });
            //         });
            //     });
            //     files[0].forEach((line,index)=>{
            //         let variableIndex = mapvar1.get(mapvar0.get(line.state));
            //         let sampleIndex = 0;
            //         files[2].forEach((line_,index_)=>{
            //             data[sampleIndex][variableIndex][timedata.findIndex(t=>t===line.date)] = isNaN(parseFloat(line[line_.name])) ? -Infinity : parseFloat(line[line_.name]);
            //             dataRaw[sampleIndex][variableIndex][timedata.findIndex(t=>t===line.date)] = isNaN(parseFloat(line[line_.name])) ? -Infinity : parseFloat(line[line_.name]);
            //         });
            //     });
            //     break;
            case 'hpcc':
                experiment.user.length = 0;
                // WRITE DATA TO DATA[]
                data.forEach(function (sample) {
                    sample.forEach(function (variable) {
                        timedata.forEach(function (step, s) {
                            variable[s] = -Infinity;
                        });
                    });
                });
                dataRaw.forEach(function (sample) {
                    sample.forEach(function (variable) {
                        timedata.forEach(function (step, s) {
                            variable[s] = -Infinity;
                        });
                    });
                });
                files[0].forEach(function (line){
                    let sI = mapsample1.get(mapsample0.get(line['Series ID'].split('_')[0]));
                    let vI = parseInt(line["Series ID"].split("_")[1]);
                    timedata.forEach(function (step, s) {
                        data[sI][vI][s] = isNaN(parseFloat(line[step])) ? -Infinity : parseFloat(line[step]);
                        dataRaw[sI][vI][s] = isNaN(parseFloat(line[step])) ? -Infinity : parseFloat(line[step]);
                    });
                    experiment.user.push([mapsample0.get(line['Series ID'].split('_')[0]),line['User']]);
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
                dataRaw.forEach(function (sample) {
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
                        dataRaw[sampleindex][varindex][s] = isNaN(parseFloat(line[step])) ? -Infinity : parseFloat(line[step]);
                    });
                });
                break;
        }

        // add variables and instances list
        d3.selectAll('.dataInstances').remove();
        d3.selectAll('.variable1').remove();
        d3.selectAll('.variable2').remove();
        d3.selectAll('.myTime1').remove();
        d3.selectAll('.myTime2').remove();
        data.forEach((d,i)=>{
            d3.select('#dataInstances').append('option').attr('class','dataInstances').attr('value',i.toString()).text(mapsample2.get(i));
        });
        data[0].forEach((d,i)=>{
            let limitCondition = limitList.findIndex(element => element === i);
            if (limitCondition === -1)
                d3.select('#variable1').append('option').attr('class','variable1').attr('value',i.toString()).text(mapvar2.get(i));
                d3.select('#variable2').append('option').attr('class','variable2').attr('value',i.toString()).text(mapvar2.get(i));
        });
        timedata.forEach((t,i)=>{
            d3.select('#myTime1').append('option').attr('class','myTime1').attr('value',i).text(t);
            d3.select('#myTime2').append('option').attr('class','myTime2').attr('value',i).text(t);
        });
        if (visualizingOption === 'LMH') {
            d3.select('#dataInstances').attr('disabled','');
            d3.select('#variable1').attr('disabled','');
            d3.select('#variable2').attr('disabled','');
        }
        if (visualizingOption === 'tSNE'||visualizingOption === 'PCA'||visualizingOption === 'UMAP') {
            d3.select('#dataInstances').attr('disabled',null);
            d3.select('#variable1').attr('disabled',null);
            d3.select('#variable2').attr('disabled',null);
        }

        // let sampleList = [], varList = [];
        // data.forEach((d,i)=>{
        //     sampleList[i] = mapsample2.get(i);
        // });
        // data[0].forEach((d,i)=>{
        //     varList[i] = mapvar2.get(i);
        // });
        // d3.select('#dataInstances').data(sampleList);
        // d3.select('dataInstances').exit().remove();
        // d3.select('dataInstances').enter();


/////////////////////////
// END OF READING DATA
///////////////////////

///////////////////////
// CALCULATION CODE
/////////////////////

        // CONTROL CALCULATION

        // if(selecteddata!==4) normalization();
        normalization();
        calculateMeasure2D();

        initClusterObj();
        let kMeanGroup = $('#knum').val() || 6;
        let kMeanIterations = $('#kiteration').val() || 1;
        recalculateCluster( {clusterMethod: 'kmean',bin:{k:kMeanGroup,iterations:kMeanIterations}},function(){
            // clickArr = [];
            plotPosition = [];
            reCalculateTsne();
        });
        measures.forEach(function (m,mi) {
            newmeasures[measurename[mi]] = {};
            m.forEach(function (s,si) {
                newmeasures[measurename[mi]][`${si}`] = s.map(d => {return d[2] >= 0});
            });
        });
        // console.log(files[2]);
        // console.log(dataRadar2);

        // NORMALIZE DATA
        // find min and max of each series -> normalize
        // local normalization
        function normalization() {
            if (selecteddata !== 'hpcc') {
                data.forEach(function (sample, p) {
                    sample.forEach(function (variable, v) {
                        let numNonNegative = 0;
                        var svariable = variable.filter(function (d) {return d !== - Infinity});
                        var mymax = Math.max(...svariable);
                        var mymin = Math.min(...svariable);
                        var myrange = mymax - mymin;
                        if (myrange !== 0) {
                            variable.forEach(function (step, s) {
                                if (step !== -Infinity) numNonNegative += 1;
                                data[p][v][s] = (step !== -Infinity) ? (step - mymin) / myrange : -1;
                            });
                        } else {
                            variable.forEach(function (step, s) {
                                data[p][v][s] = -1;
                            });
                        }
                        if (numNonNegative < 30) {
                            // console.log('Country: '+mapvar2.get(v)+' has only '+numNonNegative+' time points.');
                            // console.log('data: '+data[p][v]);
                            data[p][v].forEach((element,index)=>data[p][v][index]=-1);
                        }
                    });
                });
            } else {
                // let xMax = -Infinity, yMax = -Infinity;
                // let xMin = Infinity, yMin = Infinity;
                // data.forEach((s,si)=>{
                //     s.forEach((v,vi)=>{
                //         if (vi === 0) {
                //             xMax = Math.max(...v.filter(e=>e!==-Infinity&&e!==-1)) > xMax ? Math.max(...v.filter(e=>e!==-Infinity&&e!==-1)) : xMax;
                //             xMin = Math.min(...v.filter(e=>e!==-Infinity&&e!==-1)) < xMin ? Math.min(...v.filter(e=>e!==-Infinity&&e!==-1)) : xMin;
                //         } else if (vi === 1) {
                //             yMax = Math.max(...v.filter(e=>e!==-Infinity&&e!==-1)) > yMax ? Math.max(...v.filter(e=>e!==-Infinity&&e!==-1)) : yMax;
                //             yMin = Math.min(...v.filter(e=>e!==-Infinity&&e!==-1)) < yMin ? Math.min(...v.filter(e=>e!==-Infinity&&e!==-1)) : yMin;
                //         }
                //     });
                // });
                // for (let si = 0; si < data.length; si++) {
                //     for (let vi = 0; vi < data[si].length; vi++) {
                //         for (let t = 0; t < data[si][vi].length; t++) {
                //             if (vi === 0) {
                //                 if (xMin < xMax) {
                //                     if (data[si][vi][t] !== -1 && data[si][vi][t] !== -Infinity) data[si][vi][t] = (data[si][vi][t] - xMin)/(xMax-xMin);
                //                 } else {
                //                     if (data[si][vi][t] !== -1 && data[si][vi][t] !== -Infinity) data[si][vi][t] = 0.5;
                //                 }
                //             } else if (vi === 1) {
                //                 if (yMin < yMax) {
                //                     if (data[si][vi][t] !== -1 && data[si][vi][t] !== -Infinity) data[si][vi][t] = (data[si][vi][t] - yMin)/(yMax-yMin);
                //                 } else {
                //                     if (data[si][vi][t] !== -1 && data[si][vi][t] !== -Infinity) data[si][vi][t] = 0.5;
                //                 }
                //             }
                //         }
                //     }
                // }
                data.forEach(function (sample, p) {
                    sample.forEach(function (variable, v) {
                        let numNonNegative = 0;
                        var svariable = variable.filter(function (d) {return d !== -1});
                        var mymax = Math.max(...svariable);
                        var mymin = Math.min(...svariable);
                        var myrange = mymax - mymin;
                        if (myrange !== 0) {
                            variable.forEach(function (step, s) {
                                if (step !== -1) numNonNegative += 1;
                                data[p][v][s] = (step !== -1) ? (step - mymin) / myrange : -1;
                            });
                        } else {
                            variable.forEach(function (step, s) {
                                data[p][v][s] = -1;
                            });
                        }
                        if (numNonNegative < 30) {
                            // console.log('Country: '+mapvar2.get(v)+' has only '+numNonNegative+' time points.');
                            // console.log('data: '+data[p][v]);
                            data[p][v].forEach((element,index)=>data[p][v][index]=-1);
                        }
                    });
                });
            }

        }

        // CALCULATE MEASURES FOR DOUBLY TIME SERIES
        function calculateMeasure2D() {
            for (let i=0; i<nummeasure; i++) {
                measures[i] = [];
            }
            data.forEach(function (sample, p) {

                // Declare measure structures
                for (let i = 0; i < nummeasure; i++) {
                    measures[i][p] = [];
                }
                var myIndex = 0;
                // Each plot
                for (let yvar = 0; yvar < mapvar0.size; yvar++) {
                    for (let xvar = 0; xvar < yvar; xvar++) {

                        // Initialize measure values
                        for (let i = 0; i < nummeasure; i++) {
                            measures[i][p][myIndex] = [xvar, yvar, -1];
                        }

                        // create calculation data
                        var xdata = sample[xvar].map(function (x) {return x});
                        var ydata = sample[yvar].map(function (y) {return y});
                        xdata.forEach(function (x, ix) {ydata[ix] = (x === -1 || x === -Infinity) ? -1 : ydata[ix];});
                        ydata.forEach(function (y, iy) {xdata[iy] = (y === -1 || y === -Infinity) ? -1 : xdata[iy];});
                        xdata = xdata.filter(function (x) {return x >= 0});
                        ydata = ydata.filter(function (y) {return y >= 0});
                        if (xdata.length !== ydata.length) {
                            console.log("2 series have different length at: sample = " + p + ", x-var = " + xvar + ", y-var = " + yvar);
                        }
                        // if (xdata.length === 0) {console.log(mapsample2.get(p)); console.log(xdata); console.log(ydata);}

                            // SMOOTH
                        // let sliding = 30;
                        // let xSmooth = [], ySmooth =[];
                        // for (let i = 0; i < xdata.length - sliding; i++) {
                        //     xSmooth[i] = 0;
                        //     ySmooth[i] = 0;
                        //     for (let j = 0; j < sliding; j++) {
                        //         xSmooth[i] += xdata[i+j];
                        //         ySmooth[i] += ydata[i+j];
                        //     }
                        //     xSmooth[i] /= sliding;
                        //     ySmooth[i] /= sliding;
                        // }

                        // CALCULATIONS RELATED LENGTH
                        var edgelength = [];
                        var sumlength = 0;
                        let meanX = 0;
                        let meanY = 0;
                        xdata.forEach(function (x, xi) {
                            if (xi) {
                                var xlength = x - xdata[xi - 1];
                                var ylength = ydata[xi] - ydata[xi - 1];
                                edgelength[xi - 1] = Math.sqrt(xlength * xlength + ylength * ylength);
                                sumlength += edgelength[xi - 1];
                            }
                            meanX += x;
                            meanY += ydata[xi];
                        });
                        meanX /= xdata.length;
                        meanY /= ydata.length;
                        var sortlength = edgelength.filter(function (v) {return v >= 0});
                        sortlength.sort(function (b, n) {return b - n});   // ascending

                        // OUTLYING
                        // measures[1][p][myIndex][2] = Math.sqrt(Math.pow(xdata[xdata.length - 1] - xdata[0], 2) + Math.pow(ydata[ydata.length - 1] - ydata[0], 2)) / sumlength;
                        if (xdata.length > 1) {
                            measures[0][p][myIndex][2] = 0;
                            var outlier = [];
                            var smyIndex = 0;
                            var q1 = sortlength[Math.floor(sortlength.length * 0.25)];
                            var q3 = sortlength[Math.floor(sortlength.length * 0.75)];
                            var upperlimit = q3 + 1.5 * (q3 - q1);
                            edgelength.forEach(function (e, ei) {
                                if (ei === 0) {
                                    if (e > upperlimit) {
                                        outlier[smyIndex] = ei;
                                        measures[0][p][myIndex][2] += e;
                                        smyIndex += 1;
                                    }
                                } else if (ei === edgelength.length - 1) {
                                    if (e > upperlimit) {
                                        outlier[smyIndex] = ei + 1;
                                        measures[0][p][myIndex][2] += e;
                                        smyIndex += 1;
                                        if (edgelength[ei - 1] > upperlimit) {
                                            outlier[smyIndex] = ei;
                                            measures[0][p][myIndex][2] += edgelength[ei - 1];
                                            smyIndex += 1;
                                        }
                                    }
                                } else {
                                    if (e > upperlimit && edgelength[ei - 1] > upperlimit) {
                                        outlier[smyIndex] = ei;
                                        if (outlier[smyIndex - 1] !== outlier[smyIndex] - 1) {
                                            measures[0][p][myIndex][2] += e + edgelength[ei - 1];
                                        } else {
                                            measures[0][p][myIndex][2] += e;
                                        }
                                        smyIndex += 1;
                                    }
                                }
                            });
                            measures[0][p][myIndex][2] /= sumlength;
                            if (measures[0][p][myIndex][2] > 1) measures[0][p][myIndex][2] = 1;
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
                        // if (xdata.length > 1) {
                        //     measures[7][p][myIndex][2] = 0;
                        //     var count = 0;
                        //     xdata.forEach(function (x, xi) {
                        //         if (xi) {
                        //             if (x === xdata[xi - 1] || ydata[xi] === ydata[xi - 1]) count += 1;
                        //         }
                        //     });
                        //     // L-SHAPE
                        //     measures[7][p][myIndex][2] = count / xdata.length;  // or timedata.length
                        // }

                        // CALCULATE SOME MEASURES
                        // do not consider outliers and L-shape plots
                        // The threshold here is 0.6
                        if (xdata.length > 1) {
                            var dir = [0, 0, 0, 0];    // count directions for Trend
                            var countcrossing = 0;  // count #intersections
                            var sumcos = 0;   // sum of cosine of angles
                            // var looparr = [];
                            // var looplength = Infinity;
                            var countcosine = 0;
                            xdata.forEach(function (x, xi) {
                                for (var i = xi + 1; i < xdata.length; i++) {   // for all data after x
                                    // count directions for MONOTONIC TREND
                                    var xx = xdata[i] - x;
                                    var yy = ydata[i] - ydata[xi];
                                    if (xx > 0 && yy > 0) {dir[0] += 1;}
                                    if (xx < 0 && yy > 0) {dir[1] += 1;}
                                    if (xx < 0 && yy < 0) {dir[2] += 1;}
                                    if (xx > 0 && yy < 0) {dir[3] += 1;}
                                    // check intersections for INTERSECTIONS
                                    // if (i > xi + 1 && i < xSmooth.length - 1 && xi < xSmooth.length - 3) {
                                    //     if (checkintersection(xSmooth[xi], ySmooth[xi], xSmooth[xi + 1], ySmooth[xi + 1], xSmooth[i], ySmooth[i], xSmooth[i + 1], ySmooth[i + 1])) {
                                    //         looplength = (looplength > (i - xi)) ? i - xi : looplength;
                                    //     }
                                    // }
                                    if (i > xi + 1 && i < xdata.length - 1 && xi < xdata.length - 3) {
                                        if (checkintersection(x, ydata[xi], xdata[xi + 1], ydata[xi + 1], xdata[i], ydata[i], xdata[i + 1], ydata[i + 1])) {
                                            countcrossing += 1;
                                        }
                                    }
                                }
                                if (xi > 0 && xi < xdata.length - 1) {
                                    // sumcos += Math.abs(calculatecos(xdata[xi - 1], ydata[xi - 1], x, ydata[xi], xdata[xi + 1], ydata[xi + 1]));
                                    sumcos += calculatecos(xdata[xi - 1], ydata[xi - 1], x, ydata[xi], xdata[xi + 1], ydata[xi + 1]);
                                    if(calculatecos(xdata[xi - 1], ydata[xi - 1], x, ydata[xi], xdata[xi + 1], ydata[xi + 1]) > 0.75) countcosine += 1;
                                }
                            });
                            // LENGTH
                            // measures[7][p][myIndex][2] = sumlengtha / (xdata.length - 1);
                            // measures[7][p][myIndex][2] = sumlength / (xdata.length - 1);
                            measures[6][p][myIndex][2] = 4 * sumlength / (xdata.length - 1);
                            if (measures[6][p][myIndex][2] > 1) measures[6][p][myIndex][2] = 1;
                            // MONOTONIC TREND
                            measures[3][p][myIndex][2] = (4/3)*Math.max(...dir) / (xdata.length*(xdata.length-1)/2)-1/3;
                            if (measures[3][p][myIndex][2] < 0) measures[3][p][myIndex][2] = 0;
                            // INTERSECTIONS
                            measures[7][p][myIndex][2] = 1 - Math.exp(-countcrossing / (xdata.length - 1));
                            // STRIATED
                            // measures[2][p][myIndex][2] = (sumcos / (xdata.length - 2))*0.5+0.5;   //Average cosine
                            measures[2][p][myIndex][2] = countcosine/(xdata.length-1);     // Sacgnostic
                            // STRAIGHT
                            // measures[1][p][myIndex][2] = Math.sqrt(Math.pow(xdata[xdata.length - 1] - xdata[0], 2) + Math.pow(ydata[ydata.length - 1] - ydata[0], 2)) / sumlength;
                            // SKEWED
                            // var q10 = sortlengtha[Math.floor(sortlengtha.length * 0.1)];
                            // var q50 = sortlengtha[Math.floor(sortlengtha.length * 0.5)];
                            // var q90 = sortlengtha[Math.floor(sortlengtha.length * 0.9)];
                            // measures[2][p][myIndex][2] = (q90 !== q10) ? (q90 - q50) / (q90 - q10) : 0;
                            // SPARSE
                            // measures[4][p][myIndex][2] = q90;
                            // if (measures[4][p][myIndex][2] > 1) measures[4][p][myIndex][2] = 1;

                            // CLUMPY
                            measures[1][p][myIndex][2] = 0;
                            let Q3 = sortlengtha[Math.floor(sortlengtha.length*0.75)];
                            // let Q3 = sortlength[Math.floor(sortlength.length*0.75)];
                            xdata.forEach(function (x, xi) {
                                if (edgelengtha[xi] >= Q3) {
                                // if (edgelength[xi] >= Q3) {
                                    var countleft = 0;
                                    var countright = 0;
                                    var maxleft = 0;
                                    var maxright = 0;
                                    let stepLeft = xi-1;
                                    while (edgelengtha[stepLeft] < edgelengtha[xi] && stepLeft >= 0) {
                                    // while (edgelength[stepLeft] < edgelength[xi] && stepLeft >= 0) {
                                        countleft += 1;
                                        // maxleft = (maxleft < edgelengtha[stepLeft]) ? edgelengtha[stepLeft] : maxleft;
                                        maxleft = (maxleft < edgelength[stepLeft]) ? edgelength[stepLeft] : maxleft;
                                        stepLeft -= 1;
                                    }
                                    let stepRight = xi+1;
                                    while (edgelengtha[stepRight] < edgelengtha[xi] && stepRight < xdata.length) {
                                    // while (edgelength[stepRight] < edgelength[xi] && stepRight < xdata.length) {
                                        countright += 1;
                                        // maxright = (maxright < edgelengtha[stepRight]) ? edgelengtha[stepRight] : maxright;
                                        maxright = (maxright < edgelength[stepRight]) ? edgelength[stepRight] : maxright;
                                        stepRight += 1;
                                    }
                                    if (countleft > 0 && countright > 0) {
                                        var maxxi = (countright > countleft) ? maxright : maxleft;
                                        maxxi /= edgelengtha[xi];
                                        // maxxi /= edgelength[xi];
                                        maxxi = 1 - maxxi;
                                        maxxi = maxxi*edgelengtha[xi]/0.3;
                                        maxxi = maxxi > 1 ? 1 : maxxi;
                                        measures[1][p][myIndex][2] = (measures[1][p][myIndex][2] < maxxi) ? maxxi : measures[1][p][myIndex][2];
                                    }
                                }
                            });

                            // LOOP
                            let instance, x_var, y_var, loop;
                            // switch (selecteddata) {
                            //     case 'employment':
                            //         instance = mapsample2.get(p);
                            //         x_var = mapvar2.get(xvar);
                            //         y_var = mapvar2.get(yvar);
                            //         loop = experiment.loop[instance].find(element=>element[0]===x_var&&element[1]===y_var);
                            //         if (loop[2].length === 0) measures[5][p][myIndex][2] = 0;
                            //         else measures[5][p][myIndex][2] = Math.max(...loop[2].map(element=>element[2]))*loop[2].length;
                            //         break;
                            //     case 'death_rate':
                            //         instance = mapsample2.get(p);
                            //         x_var = mapvar2.get(xvar);
                            //         y_var = mapvar2.get(yvar);
                            //         loop = experiment.loop[instance].find(element=>element[0]===x_var&&element[1]===y_var);
                            //         if (loop[2].length === 0) measures[5][p][myIndex][2] = 0;
                            //         else measures[5][p][myIndex][2] = Math.max(...loop[2].map(element=>element[2]))*loop[2].length;
                            //         break;
                            //     default:
                            //         measures[5][p][myIndex][2] = (looplength === Infinity) ? 0 : looplength/xdata.length;
                            //         break;
                            // }
                            instance = mapsample2.get(p);
                            x_var = mapvar2.get(xvar);
                            y_var = mapvar2.get(yvar);
                            loop = experiment.loop[instance].find(element=>element[0]===x_var&&element[1]===y_var);
                            if (!loop) measures[5][p][myIndex][2] = 0;
                            else if (loop) if (loop[2].length === 0) measures[5][p][myIndex][2] = 0;
                            else measures[5][p][myIndex][2] = Math.max(...loop[2].map(element=>element[2]))*loop[2].filter(e=>e[2]>0).length;
                            if (measures[5][p][myIndex][2] > 1) measures[5][p][myIndex][2] = 1;

                            // measures[5][p][myIndex][2] = (looplength === Infinity) ? 0 : looplength/xdata.length;
                            // measures[9][p][myIndex][2] = (looplength > 0) ? looplength / xdata.length : 0;

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
                            measures[4][p][myIndex][2] = maxr;

                            // SIMILARITY
                            // measures[10][p][myIndex][2] = 1 - minsim / (xdata.length-getLag);

                            // CALCULATE AREA
                            // set value of bins inside triangles is 1, outside triangles is 0
                            // count bin of 1, multiple it with cell area
                            // for (var i = 0; i < numcell; i++) {
                            //     cellval[i] = [];
                            //     for (var j = 0; j < numcell; j++) {
                            //         cellval[i][j] = 0;
                            //     }
                            // }
                            // if (xdata.length > 3) {
                            //     for (var i = 0; i < xdata.length - 2; i++) {
                            //         var xmax = Math.max(...[xdata[i], xdata[i + 1], xdata[i + 2]]);
                            //         var xmin = Math.min(...[xdata[i], xdata[i + 1], xdata[i + 2]]);
                            //         var ymax = Math.max(...[ydata[i], ydata[i + 1], ydata[i + 2]]);
                            //         var ymin = Math.min(...[ydata[i], ydata[i + 1], ydata[i + 2]]);
                            //         xmin = Math.floor(xmin / cellsize);
                            //         xmax = Math.ceil(xmax / cellsize);
                            //         ymin = Math.floor(ymin / cellsize);
                            //         ymax = Math.ceil(ymax / cellsize);
                            //         for (var j = xmin; j <= xmax; j++) {
                            //             for (var k = ymin; k <= ymax; k++) {
                            //                 var xcell = j * cellsize + cellsize / 2;
                            //                 var ycell = k * cellsize + cellsize / 2;
                            //                 if (checkinsidetriangle(xcell, ycell, xdata[i], ydata[i], xdata[i + 1], ydata[i + 1], xdata[i + 2], ydata[i + 2])) {
                            //                     cellval[j][k] = 1;
                            //                 }
                            //             }
                            //         }
                            //     }
                            //     measures[1][p][myIndex][2] = 0;
                            //     cellval.forEach(function (row) {
                            //         row.forEach(function (column) {
                            //             measures[1][p][myIndex][2] += column;
                            //         });
                            //     });
                            //     measures[1][p][myIndex][2] *= cellsize * cellsize;
                            //     measures[1][p][myIndex][2] = 1 -  measures[1][p][myIndex][2];
                            // }


                        }


                        // increase myIndex
                        myIndex += 1;
                    }
                }
            });
            doneCalculation = true;
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

        function initClusterObj(){
            hosts = [];
            sampleS = {};
            measures[0].forEach((s,si)=>{
                s.forEach((xy,index)=>{
                    let hname = `${si}-${index}`;
                    // hosts.push({
                    //     name: hname,
                    //     sample: si,
                    //     mindex: index
                    // });
                    let temp= {};
                    let invalid = false;
                    measures.find((m,i)=>{
                        temp[measurename[i]] =[[m[si][index][2]]];
                        invalid = temp[measurename[i]]<0;
                        return invalid;
                    });
                    if (!invalid) {
                        hosts.push({
                            name: hname,
                            sample: si,
                            mindex: index
                        });
                        sampleS[hname] = temp;
                    }
                })
            });

            sampleS.timespan = [new Date()];
        }
        needupdate = true;
///////////////////////
// END OF CALCULATION
///////////////////////
    });
    needcalculation = false;
}

// SORT MEASURES AND WRITE DISPLAYPLOT
function sortmeasures() {
    displayplot = [];
    // console.log(checkfilter);
    // console.log(valfilter);
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
            for (let j = 0; j < numplot; j++) {  // get the lowest paths
                displayplot[i][j] = sortarr[numplot-1-j];
            }
            for (let j = numplot; j < 2*numplot; j++) {  // get the middle paths
                displayplot[i][j] = sortarr[Math.floor(sortarr.length*0.5)+2*numplot-1-j];
            }
            for (let j = 2*numplot; j < 3*numplot; j++) {  // get the highest paths
                displayplot[i][j] = sortarr[sortarr.length-j+2*numplot-1];
            }
            newnumplot = 0;
        } else {
            newnumplot = sortarr.length;
            displayplot[i] = [];
            for (let j = 0; j < newnumplot; j++) {  // get the lowest paths
                displayplot[i][j] = sortarr[j];
            }
        }
    }
}

// Prepare data for RadarController_table

function prepareRadarTable() {
    dataRadar2 = [];    // [all plot][measures for each plot]
    dataRadar1 = [];    // [measure][all values]
    dataRadar = {};

    for (let i = 0; i < nummeasure; i++) {
        dataRadar1[i] =[];
        let count = 0;
        measures[i].forEach(function (s,si) {
           s.forEach(function (d,index) {
               let limitCondition = limitList.findIndex(element=>element === d[0] || element === d[1]);
             if (d[2] >= 0 && limitCondition === -1) {
                 dataRadar1[i][count] = d[2];
                 dataRadar2[count] = [];
                 dataRadar2[count].name = mapsample2.get(si);
                 dataRadar2[count].timestep = index;
                 dataRadar2[count].cluster = cluster_info.findIndex(c=>c.arr[0].find(d=>d===`${si}-${index}`));
                 dataRadar2[count].plot = `${si}-${index}`;
                 if (selecteddata === 'hpcc') dataRadar2[count].user = experiment.user.find(e=>e[0]===dataRadar2[count].name)[1];
                 count += 1;
             }
           });
        });
    }
    dataRadar1.forEach(function (m,mi) {
        m.forEach(function (d,i) {
           dataRadar2[i][mi] = d;
       });
    });
    dataRadar = getsummaryservice(dataRadar1);
    leaderList = [];
    cluster_info.forEach(function (c) {
        let mindis = + Infinity;
        let minObj;
        c.arr[0].find(m=>{
            const target = dataRadar2.find(d=>d.plot===m);
            if (typeof(target)!=="undefined"){
                if (Radarplot_opt.clusterMethod==="leaderbin") {
                    if (_.isEqual(target.slice(), c.__metrics.normalize)) {
                        leaderList.push(target.plot);
                        return true;
                    }
                }else{
                    let currentdis = distance(target.slice(),c.__metrics.normalize);
                    if(mindis> currentdis){
                        mindis = currentdis;
                        minObj = target.plot;
                    }
                }
            }
            return false;
        });
        if (Radarplot_opt.clusterMethod!=="leaderbin"){
            leaderList.push(minObj);
        }
    });
    d3.select('.cover').classed('hidden', true);
    // add element for drawing Violin chart
    // let svg_violin = d3.select('#myViolinChart');
    // d3.viiolinChart()
    //     .graphicopt({width:160,height:25,opt:{dataformated:true},
    //         margin: {top: 0, right: 30, bottom: 0, left: 30},
    //     }).data([dataRadar[measurename[selectedmeasure]]]).setTicksDisplay([0,1]).draw(svg_violin);
    firstTime = false;
}
// Calculate Cluster
function recalculateCluster (option,calback) {
    // hide the main screen
    d3.select('.cover').classed('hidden', true);

    Radarplot_opt.clusterMethod = option.clusterMethod;
    preloader(true,10,'Process grouping...','#clusterLoading');
    let group_opt = option;
    distance = group_opt.normMethod==='l1'?distanceL1:distanceL2;
    if (clustercalWorker)
        clustercalWorker.terminate();
    clustercalWorker = new Worker ('./lib/clustercal.js');
    clustercalWorker.postMessage({
        binopt:group_opt,
        sampleS:sampleS, // collection of data
        hosts:hosts, // instance list
        serviceFullList: serviceFullList, // parameter layout
        serviceLists:serviceLists, // TODO remove this
        serviceList_selected:serviceList_selected, // parameter layout
        serviceListattr:serviceListattr // parameter name in instance object
    });
    clustercalWorker.addEventListener('message',({data})=>{
        if (data.action==='done') {
            cluster_info = data.result;
            clusterDescription = {};
            recomendName (cluster_info);
            recomendColor (cluster_info);
            if (!calback) {
                cluster_map(cluster_info);
            }
            preloader(false, undefined, undefined, '#clusterLoading');
            clustercalWorker.terminate();
            if (calback)
                calback();
        }
        if (data.action==='returnData'){
            onloaddetermire({process:data.result.process,message:`# iterations: ${data.result.iteration}`},'#clusterLoading');
        }
    }, false);
}

function reCalculateTsne() {
    prepareRadarTable();
    tsneTS = d3.tsneTimeSpace();
    pcaTS = d3.pcaTimeSpace();
    umapTS = d3.umapTimeSpace();
    MetricController.data(dataRadar2).drawSummary(dataRadar2.length-1);
    MetricController.datasummary(dataRadar);
    cluster_map(cluster_info);
    onchangeVizType(visualizingOption);
    onchangeVizdata(visualizingOption);
}

function cluster_map (dataRaw) {
    let data = dataRaw.map((c,i)=>{
        let temp = c.__metrics.slice();
        temp.name = c.labels;
        temp.text = c.text;
        temp.total = c.total;
        temp.mse = c.mse;
        let temp_b = [temp];
        temp_b.id = c.name;
        temp_b.order = i;
        return temp_b;
    });
    let orderSimilarity = similarityCal(data);
    data.sort((a,b)=>( orderSimilarity.indexOf(a.order)-orderSimilarity.indexOf(b.order))).forEach((d,i)=>{
        d.order = i;
        dataRaw.find(c=>c.name===d.id).orderG = i;
    });
    //--shoudn't here
    dataRaw.forEach(c=>{
        let matchitem = data.find(d=>d.id===c.name);
        // c.text = c.text.replace(`Group ${c.index+1}`,`Group ${matchitem.order+1}`);
        matchitem[0].text =  c.text;
    });
    data.forEach(d=>d[0].name = dataRaw.find(c=>d.id===c.name).text);
    //--end
    let dir = d3.select('#clusterDisplay');
    setTimeout(()=>{
        let r_old = dir.selectAll('.radarCluster').data(data,d=>d.id);
        r_old.exit().remove();
        let r_new = r_old.enter().append('div').attr('class','radarCluster')
        // .on('mouseover',function(d){
        //     if (!jobMap.runopt().mouse.disable)
        //         jobMap.highlight(d.id);
        // }).on('mouseleave',function(d){
        //     if (!jobMap.runopt().mouse.disable)
        //         jobMap.unhighlight(d.id);
        // })
            .append('div')
            .attr('class','label')
            .styles({'position':'absolute',
                'color':'black',
                'width': radarChartclusteropt.w+'px',
                height: '1rem',
                padding: '10px'
                // overflow: 'hidden',
            });
        // r_new.append('span').attr('class','clusterlabel truncate center-align col s12');
        r_new.append('i').attr('class','editbtn material-icons tiny col s1').style('cursor', 'Pointer').text('edit').on('click',function(){
            let active = d3.select(this).classed('clicked');
            active = !active;
            d3.select(this).classed('clicked',active);
            const parent = d3.select(this.parentNode);
            parent.select('span.clusterlabel').classed('hide',active);
            parent.select('input.clusterlabel').classed('hide',!active);
        });
        r_new.append('span').attrs({'class':'clusterlabel truncate left-align col s11','type':'text'});
        r_new.append('input').attrs({'class':'clusterlabel browser-default hide truncate center-align col s11','type':'text'}).on('change',function(d){
            clusterDescription[d.id].text = $(this).val();
            d3.select(this).classed('hide',true);
            const parent = d3.select(this.parentNode);
            parent.select('.editbtn').classed('clicked',false);
            parent.select('span.clusterlabel').text(clusterDescription[d.id].text).classed('hide',false);
            updateclusterDescription(d.id,clusterDescription[d.id].text);
        });
        r_new.append('span').attr('class','clusternum center-align col s12');
        r_new.append('span').attr('class','clusterMSE center-align col s12');
        dir.selectAll('.radarCluster')
            .attr('class',(d,i)=>'flex_col valign-wrapper radarCluster radarh'+d.id)
            .each(function(d,i){
                radarChartclusteropt.color = function(){return colorCluster(d.id)};
                RadarChart_func(".radarh"+d.id, d, radarChartclusteropt,"").select('.axisWrapper .gridCircle').classed('hide',true);
            });
        d3.selectAll('.radarCluster').classed('first',(d,i)=>!i);
        d3.selectAll('.radarCluster').select('span.clusterlabel').attr('data-order',d=>d.order+1).text(d=>d[0].text);
        d3.selectAll('.radarCluster').select('input.clusterlabel').attr('value',d=>d[0].text);
        d3.selectAll('.radarCluster').select('span.clusternum').text(d=>(d[0].total||0).toLocaleString());
        d3.selectAll('.radarCluster').select('span.clusterMSE').classed('hide',!radarChartclusteropt.boxplot).text(d=>d3.format(".2")(d[0].mse||0));
    }, 0);
}
function recomendName (clusterarr){
    clusterarr.forEach((c,i)=>{
        c.index = i;
        c.axis = [];
        c.labels = ''+i;
        c.name = `group_${i+1}`;
        let zero_el = c.__metrics.filter(f=>!f.value);
        let name='';
        if (zero_el.length && zero_el.length<c.__metrics.normalize.length){
            c.axis = zero_el.map(z=>{return{id:z.axis,description:'undefined'}});
            name += `${zero_el.length} metric(s) undefined `;
        }else if(zero_el.length===c.__metrics.normalize.length){
            c.text = `undefined`;
            if(!clusterDescription[c.name])
                clusterDescription[c.name] = {};
            clusterDescription[c.name].id = c.name;
            clusterDescription[c.name].text = c.text;
            return;
        }
        name += c.__metrics.filter(f=>f.value>0.75).map(f=>{
            c.axis.push({id:f.axis,description:'high'});
            return 'High '+f.axis;
        }).join(', ');
        name = name.trim();
        if (name==='')
            c.text = ``;
        else
            c.text = `${name}`;
        if(!clusterDescription[c.name])
            clusterDescription[c.name] = {};
        clusterDescription[c.name].id = c.name;
        clusterDescription[c.name].text = c.text;
    });
}

function recomendColor (clusterarr) {
    const colorCa = colorScaleList['customschemeCategory'].slice();
    let colorcs = d3.scaleOrdinal().range(colorCa);
    let colorarray = [];
    let orderarray = [];
    // clusterarr.filter(c=>!c.text.match('undefined'))
    clusterarr.filter(c=>c.text!=='undefined')
        .forEach(c=>{
            colorarray.push(colorcs(c.name));
            orderarray.push(c.name);
        });
    clusterarr.filter(c=>c.text==='undefined').forEach(c=>{
        colorarray.push('black');
        orderarray.push(c.name);
    });
    // clusterarr.filter(c=>c.text!=='undefined' && c.text.match('undefined')).forEach(c=>{
    //     colorarray.push('#7f7f7f');
    //     orderarray.push(c.name);
    // });
    colorCluster.range(colorarray).domain(orderarray)
}

function similarityCal(data){
    const n = data.length;
    let simMatrix = [];
    let mapIndex = [];
    for (let i = 0;i<n; i++){
        let temp_arr = [];
        temp_arr.total = 0;
        for (let j=i+1; j<n; j++){
            let tempval = similarity(data[i][0],data[j][0]);
            temp_arr.total += tempval;
            temp_arr.push(tempval)
        }
        for (let j=0;j<i;j++)
            temp_arr.total += simMatrix[j][i-1-j];
        temp_arr.name = data[i][0].name;
        temp_arr.index = i;
        mapIndex.push(i);
        simMatrix.push(temp_arr)
    }
    mapIndex.sort((a,b)=> simMatrix[a].total-simMatrix[b].total);
    // let undefinedposition = data.findIndex(d=>d[0].text.match(': undefined'))
    // mapIndex.sort((a,b)=>
    //     b===undefinedposition?1:(a===undefinedposition?-1:0)
    // )
    let current_index = mapIndex.pop();
    let orderIndex = [simMatrix[current_index].index];

    do{
        let maxL = Infinity;
        let maxI = 0;
        mapIndex.forEach((d)=>{
            let temp;
            if (d>simMatrix[current_index].index ){
                temp = simMatrix[current_index][d-current_index-1];
            }else{
                temp = simMatrix[d][current_index-d-1]
            }
            if (maxL>temp){
                maxL = temp;
                maxI = d;
            }
        });
        orderIndex.push(simMatrix[maxI].index);
        current_index = maxI;
        mapIndex = mapIndex.filter(d=>d!=maxI);} while(mapIndex.length);
    return orderIndex;
    function similarity (a,b){
        return Math.sqrt(d3.sum(a,(d,i)=>(d.value-b[i].value)*(d.value-b[i].value)));
    }
}

function updateViztype (viztype_in){
    let viztype = viztype_in;
    $('#vizController span').text(`${viztype} Controller`);
    $('#mouseAction input[value="showseries"]+span').text(`Show ${viztype} series`);
    $('#vizController .icon').removeClass (function (index, className) {
        return (className.match (/(^|\s)icon-\S+/g) || []).join(' ');
    }).addClass(`icon-${viztype}Shape`);
    RadarChart_func = eval(`${viztype}Chart_func`);
    d3.selectAll('.radarPlot .radarWrapper').remove();
    if (!firstTime) {

        MetricController.charType(viztype).drawSummary();
        if (cluster_info) {
            cluster_map(cluster_info);
        }
    }
}



let serviceFull_selected =[];
function getsummaryservice(dataf_){
    var dataf = [];
    dataf_.forEach(function(m,mi){
        dataf[mi] =[];
        m.forEach(function (d,i) {
            dataf[mi][i] = d;
        });
    });
    let outlierMultiply = Infinity;
    let ob = {};
    dataf.forEach((d,i)=>{
        d=d.filter(e=>e!==undefined).sort((a,b)=>a-b);
        let r;
        if (d.length){
            var x = d3.scaleLinear()
                // .domain(d3.extent(d));
                .domain([0,1]);
            var histogram = d3.histogram()
                .domain(x.domain())
                .thresholds(x.ticks(20))    // Important: how many bins approx are going to be made? It is the 'resolution' of the violin plot
                .value(d => d);
            let hisdata = histogram(d);

            let sumstat = hisdata.map((d,i)=>[d.x0+(d.x1-d.x0)/2,(d||[]).length]);
            r = {
                axis: serviceFullList[i].text,
                q1: ss.quantileSorted(d,0.25) ,
                q3: ss.quantileSorted(d,0.75),
                median: ss.medianSorted(d) ,
                // median: d3.mean(d) ,
                // outlier: ,
                arr: sumstat};
            if (d.length>4)
            {
                const iqr = r.q3-r.q1;
                r.outlier = _.unique(d.filter(e=>e>(r.q3+outlierMultiply*iqr)||e<(r.q1-outlierMultiply*iqr)));
            }else{
                r.outlier =  _.unique(d);
            }
        }else{
            r = {
                axis: serviceFull_selected[i].text,
                q1: undefined ,
                q3: undefined,
                median: undefined ,
                outlier: [],
                arr: []};
        }
        ob[r.axis] = r;

    });
    return ob;
}

function initDataWorker(){
    getDataWorker.postMessage({action:"init",value:{
            hosts:hosts,
            db:db,
            cluster_info:cluster_info,
            serviceFullList:serviceFullList,
            serviceLists:serviceLists,
            serviceList_selected :serviceList_selected,
            serviceListattr:serviceListattr
        }});
    getDataWorker.addEventListener('message',({data})=>{
        if (data.status==='done') {
            isbusy = false;
        }
        if (imageRequest){
            playchange();
            d3.select('.cover').classed('hidden', false);
            d3.select('.progressDiv').classed('hidden', false);
            imageRequest = false;
            onSavingbatchfiles(data.result.arr,onSavingFile); // saveImages.js
        }
        if (data.action==='returnData'){
            if (data.result.hindex!==undefined && data.result.index < lastIndex) {
                if (graphicControl.sumType === "RadarSummary" ) {
                    Radarplot.data(data.result.arr).drawSummarypoint(data.result.index, data.result.hindex);
                }
            }

        }else if (data.action==='returnDataHistory'){
            if (data.result.hindex!==undefined&& data.result.index < lastIndex+1) {
                if (graphicControl.charType === "T-sne Chart")
                    TSneplot.data(data.result.arr).draw(data.result.nameh, data.result.index);
                jobMap.dataComp(data.result.arr);
                if(isanimation)
                    jobMap.drawComp();
                if (graphicControl.sumType === "RadarSummary") {
                    Radarplot.data(data.result.arr).drawSummarypoint(data.result.index, data.result.hindex);
                }
                MetricController.data(data.result.arr).drawSummary(data.result.hindex);
            }
        }
        if (data.action==='DataServices') {
            MetricController.datasummary(data.result.arr);
        }
    }, false);
}

function onchangeVizType(vizMode){
    tsneTS.stop();
    pcaTS.stop();
    umapTS.stop();
    switch (vizMode) {
        case 'tSNE':
            tsneTS.generateTable();
            return true;
        case 'PCA':
            pcaTS.generateTable();
            return true;
        case 'UMAP':
            umapTS.generateTable();
            return true;
        default:
            return false;
    }
}
function onchangeVizdata(vizMode){
    switch (vizMode) {
        case 'tSNE':
            handle_data_tsne(dataRadar2);
            return true;
        case 'PCA':
            handle_data_pca(dataRadar2);
            return true;
        case 'UMAP':
            handle_data_umap(dataRadar2);
            return true;
        default:
            return false;
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
let rPlotSize = 4*columnSize;
let xBlank = 2*columnSize;
let xgBlank = 3*columnSize;
let yBlank = 50;
let ygBlank = csPlotSize*0.3;
let groupSize = 2*(csPlotSize+xBlank)+rPlotSize+xgBlank;
let isMouseOVer = false;

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
    if(needcalculation && !videoOnly) {
        analyzedata();
    }
    if (needupdate && doneCalculation){

        background(255);

        // CHOOSE DISPLAY PLOTS
        sortmeasures();
        textFont('Arial Unicode MS');

        if (displayplot[selectedmeasure].length === 0) {
            textSize(30);
            text('There is no plot to display',xBlank,yBlank);
        } else {
            numColumn = 72;
            columnSize = width/numColumn;
            let correctnumplot = (newnumplot === 0) ? numplot : Math.floor(newnumplot/3);

            // main draw
            // Write group notation
            fill(0);
            noStroke();
            textSize(30);
            text('Lowest values',xBlank+0.3*groupSize,yBlank);
            text('Medium values',xBlank+1.3*groupSize,yBlank);
            text('Highest values',xBlank+2.3*groupSize,yBlank);
            // Draw plots
            for (var i = 0; i < correctnumplot; i++) {
                for (var j = 0; j < 3; j++) {

                    var sample = displayplot[selectedmeasure][i+j*correctnumplot][0];
                    var xvar = displayplot[selectedmeasure][i+j*correctnumplot][1];
                    var yvar = displayplot[selectedmeasure][i+j*correctnumplot][2];
                    var value = displayplot[selectedmeasure][i+j*correctnumplot][3];
                    var mindex = displayplot[selectedmeasure][i+j*correctnumplot][4];

                    let instance = mapsample2.get(sample);
                    let x_var = mapvar2.get(xvar);
                    let y_var = mapvar2.get(yvar);
                    let loop = experiment.loop[instance].find(element=>element[0]===x_var&&element[1]===y_var);

                    // draw rectangles for CS - X(t) for 1D
                    // fill(255);
                    fill(200);  // for paper
                    stroke(0);
                    strokeWeight(2);    // for paper
                    rect(xBlank+csPlotSize+xBlank+j*groupSize,yBlank+50+i*(csPlotSize+ygBlank),csPlotSize,csPlotSize);

                    // draw rectangles for time series
                    // fill(255);
                    fill(200);  // for paper
                    noStroke();
                    rect(xBlank+j*groupSize,yBlank+50+oPlotSize+2+i*(csPlotSize+ygBlank),csPlotSize,oPlotSize); // x-data
                    stroke(0);
                    line(xBlank+j*groupSize,yBlank+50+oPlotSize+2+i*(csPlotSize+ygBlank),xBlank+j*groupSize,yBlank+50+2*oPlotSize+2+i*(csPlotSize+ygBlank));
                    line(xBlank+j*groupSize,yBlank+50+2*oPlotSize+2+i*(csPlotSize+ygBlank),xBlank+csPlotSize+j*groupSize,yBlank+50+2*oPlotSize+2+i*(csPlotSize+ygBlank));
                    noFill();
                    bezier(xBlank+csPlotSize+j*groupSize,yBlank+50+1.5*oPlotSize+2+i*(csPlotSize+ygBlank),1.5*xBlank+csPlotSize+j*groupSize,yBlank+50+1.5*oPlotSize+2+i*(csPlotSize+ygBlank),xBlank+csPlotSize+j*groupSize,yBlank+50+oPlotSize+2+i*(csPlotSize+ygBlank),1.7*xBlank+csPlotSize+j*groupSize,yBlank+50+oPlotSize+i*(csPlotSize+ygBlank));
                    // fill(255);
                    fill(200);  // for paper
                    noStroke();
                    rect(xBlank+j*groupSize,yBlank+48+i*(csPlotSize+ygBlank),csPlotSize,oPlotSize); // y-data
                    stroke(0);
                    line(xBlank+j*groupSize,yBlank+48+i*(csPlotSize+ygBlank),xBlank+j*groupSize,yBlank+48+oPlotSize+i*(csPlotSize+ygBlank));
                    line(xBlank+j*groupSize,yBlank+48+oPlotSize+i*(csPlotSize+ygBlank),xBlank+csPlotSize+j*groupSize,yBlank+48+oPlotSize+i*(csPlotSize+ygBlank));
                    noFill();
                    bezier(xBlank+csPlotSize+j*groupSize,yBlank+48+0.5*oPlotSize+i*(csPlotSize+ygBlank),1.5*xBlank+csPlotSize+j*groupSize,yBlank+48+0.5*oPlotSize+i*(csPlotSize+ygBlank),xBlank+csPlotSize+j*groupSize,yBlank+50+oPlotSize+i*(csPlotSize+ygBlank),1.7*xBlank+csPlotSize+j*groupSize,yBlank+50+oPlotSize+i*(csPlotSize+ygBlank));

                    //  DRAW RADAR CHART
                    var xCenter = 2*xBlank+2*csPlotSize+rPlotSize+j*groupSize;
                    var yCenter = yBlank+50+csPlotSize*0.5+i*(ygBlank+csPlotSize);
                    for (let k = 5; k > 0; k--) {
                        fill(205,205,205,25);
                        stroke(0);
                        strokeWeight(0.15)
                        ellipse(xCenter,yCenter,rPlotSize*0.2*k,rPlotSize*0.2*k);
                    }
                    for (let k = 0; k < nummeasure-1; k++) {
                        var xp1 = xCenter+rPlotSize*Math.sin(Math.PI*2*k/nummeasure)/2;
                        var yp1 = yCenter-rPlotSize*Math.cos(Math.PI*2*k/nummeasure)/2;
                        stroke(255,255,255);
                        strokeWeight(1);
                        line(xCenter,yCenter,xp1,yp1);
                        textSize(8);
                        noStroke();
                        if (k>nummeasure/2-1) {
                            textAlign(RIGHT);
                        }
                        fill(0);
                        text(measurename[k]+': '+Math.round(measures[k][sample][mindex][2]*10)/10,xCenter+(rPlotSize+10)*Math.sin(Math.PI*2*k/nummeasure)/2,yCenter-(rPlotSize+10)*Math.cos(Math.PI*2*k/nummeasure)/2);
                        textAlign(LEFT);
                    }
                    var xp1 = xCenter+rPlotSize*Math.sin(Math.PI*2*(nummeasure-1)/nummeasure)/2;
                    var yp1 = yCenter-rPlotSize*Math.cos(Math.PI*2*(nummeasure-1)/nummeasure)/2;
                    stroke(255,255,255);
                    strokeWeight(1);
                    line(xCenter,yCenter,xp1,yp1);
                    fill(0);    // for paper
                    stroke(0);  // for paper
                    textSize(8);
                    noStroke();
                    textAlign(RIGHT);
                    text(measurename[nummeasure-1]+': '+Math.round(measures[nummeasure-1][sample][mindex][2]*100)/100,xCenter+(rPlotSize+10)*Math.sin(Math.PI*2*(nummeasure-1)/nummeasure)/2,yCenter-(rPlotSize+10)*Math.cos(Math.PI*2*(nummeasure-1)/nummeasure)/2);
                    textAlign(LEFT);
                    // draw radar, not rose
                    myRadarChartClusterOpt.pos = {x:xCenter,y:yCenter};
                    myRadarChartClusterOpt.w = rPlotSize;
                    myRadarChartClusterOpt.h = rPlotSize;
                    let datum = serviceList.map((s,si)=>{
                        return {axis:s,value:measures[si][sample][mindex][2]}
                    });
                    RadarChart_c_func('#mainCanvasHolder canvas',[datum],myRadarChartClusterOpt,'');
                    // write value of measure
                    noStroke();
                    fill(255);
                    // textSize(csPlotSize/12);
                    textSize(12);
                    fill(0);    // for paper
                    text(measurename[selectedmeasure]+' = '+Math.round(value*100)/100,xBlank+csPlotSize+xBlank+j*groupSize,yBlank+45+i*(csPlotSize+ygBlank));
                    // write sample notation
                    noStroke();
                    fill(0);
                    // textSize(csPlotSize/12);
                    textSize(12);
                    text(mapsample2.get(sample),xBlank+j*groupSize,yBlank+45+i*(ygBlank+csPlotSize));
                    // write x-variable notation
                    noStroke();
                    fill(0);
                    // textSize(csPlotSize/14);
                    textSize(9);
                    if (mapvar2.get(xvar).split("").length <= 27) {
                        text(mapvar2.get(xvar),2*xBlank+csPlotSize+j*groupSize,yBlank+50+csPlotSize*1.1+i*(ygBlank+csPlotSize));
                    } else {
                        text(mapvar2.get(xvar).substr(0,27)+'...',2*xBlank+csPlotSize+j*groupSize,yBlank+50+csPlotSize*1.1+i*(ygBlank+csPlotSize));
                    }
                    text("time",xBlank+j*groupSize,yBlank+50+i*(ygBlank+csPlotSize)+csPlotSize*1.1);
                    //write y-variable notation
                    push();
                    noStroke();
                    fill(0);
                    // textSize(csPlotSize/14);
                    textSize(9);
                    translate(xBlank+j*groupSize,yBlank+50+csPlotSize+i*(csPlotSize+ygBlank));
                    rotate(-PI/2);
                    if(mapvar2.get(xvar).split("").length <= 17) {
                        text(mapvar2.get(yvar),0,csPlotSize+xBlank-5);
                    } else {
                        text(mapvar2.get(yvar).substr(0,17)+'...',0,csPlotSize+xBlank-5);
                    }
                    if(mapvar2.get(xvar).split("").length <= 20) {
                        text(mapvar2.get(xvar),0,-5);
                    } else {
                        text(mapvar2.get(xvar).substr(0,17)+'...',0,-5);
                    }
                    if(mapvar2.get(yvar).split("").length <= 20) {
                        text(mapvar2.get(yvar),oPlotSize,-5);
                    } else {
                        text(mapvar2.get(yvar).substr(0,17)+'...',oPlotSize,-5);
                    }
                    pop();
                    timedata.forEach(function (time,step) {
                        // for paper
                        let bP1 = '2000', bP2 = '2005', bP3 = '2012', bP4 = '1987';
                        let bC1 = '#542788', bC2 = '#e08214', bC3 = '#d53e4f', bC4 = '#ff0000';
                        if(step) {
                            let radius = interactionOption.time1 === step || interactionOption.time2 === step ? 3 : 1;
                            // CS plots - X(t) for 1D
                            if(data[sample][xvar][step]>=0 && data[sample][xvar][step-1]>=0 && data[sample][yvar][step]>=0 && data[sample][yvar][step-1]>=0) {
                                let x1 = 0.05*csPlotSize+xBlank+csPlotSize+xBlank+j*groupSize+0.9*csPlotSize*data[sample][xvar][step-1];
                                let x2 = 0.05*csPlotSize+xBlank+csPlotSize+xBlank+j*groupSize+0.9*csPlotSize*data[sample][xvar][step];
                                let y1 = 0.05*csPlotSize+yBlank+50+i*(csPlotSize+ygBlank)+0.9*csPlotSize*(1-data[sample][yvar][step-1]);
                                let y2 = 0.05*csPlotSize+yBlank+50+i*(csPlotSize+ygBlank)+0.9*csPlotSize*(1-data[sample][yvar][step]);
                                if (selectedmeasure===5 && loop) {
                                    let checkLoop = 0;
                                    for (let n = 0; n < loop[2].length; n++) {
                                        if (loop[2][n][0]<=step&&loop[2][n][1]+1>=step) {
                                            checkLoop = n+1;
                                            break;
                                        }
                                    }
                                    if (checkLoop>0) {
                                        let color = d3.color(experiment.colorList[checkLoop-1]);
                                        fill(color.r,color.g,color.b);
                                        stroke(color.r,color.g,color.b);
                                        if (time === bP1) {fill(bC1); stroke(bC1);} // paper
                                        if (time === bP2) {fill(bC2); stroke(bC2);}
                                        if (time === bP3) {fill(bC3); stroke(bC3);}
                                        if (time === bP4) {fill(bC4); stroke(bC4);}
                                        circle(x1,y1,radius);
                                        circle(x2,y2,radius);
                                        fill(color.r,color.g,color.b);  // paper
                                        stroke(color.r,color.g,color.b);
                                        strokeWeight(0.3);
                                        line(x1,y1,x2,y2);
                                        strokeWeight(1);
                                    } else {
                                        if (step<timedata.length/2) {stroke(0,0,255-255*step/(timedata.length/2)); fill(0,0,255-255*step/(timedata.length/2));}
                                        else {stroke((step-timedata.length/2)*255/(timedata.length/2),0,0); fill((step-timedata.length/2)*255/(timedata.length/2),0,0);}
                                        circle(x1,y1,radius);
                                        circle(x2,y2,radius);
                                        strokeWeight(0.3);
                                        line(x1,y1,x2,y2);
                                        strokeWeight(1);
                                    }
                                } else {
                                    if (step<timedata.length/2) {stroke(0,0,255-255*step/(timedata.length/2)); fill(0,0,255-255*step/(timedata.length/2));}
                                    else {stroke((step-timedata.length/2)*255/(timedata.length/2),0,0); fill((step-timedata.length/2)*255/(timedata.length/2),0,0);}
                                    circle(x1,y1,radius);
                                    circle(x2,y2,radius);
                                    strokeWeight(0.3);
                                    line(x1,y1,x2,y2);
                                    strokeWeight(1);
                                }
                                // draw notations
                                if (isMouseOVer) {
                                    let myCheck = x2 <= mouseX + 3 && x2 >= mouseX - 3 && y2 <= mouseY + 3 && y2 >= mouseY - 3;
                                    if (myCheck) {
                                        var xV = Math.round(dataRaw[sample][xvar][step]);
                                        var yV = Math.round(dataRaw[sample][yvar][step]);
                                        var myL = time.split('').length + xV.toString().split('').length + yV.toString().split('').length+2;
                                        fill(0);
                                        noStroke();
                                        triangle(mouseX,mouseY,mouseX+3,mouseY-3,mouseX+3,mouseY+3);
                                        rect(mouseX+3,mouseY-8,myL*7,16);
                                        fill(255);
                                        textSize(12);
                                        text(time+'; '+xV+'; '+yV.toString(),mouseX+5,mouseY+6);

                                    }
                                }
                            }
                            // X-var plots
                            if(data[sample][xvar][step]>=0 && data[sample][xvar][step-1]>=0) {
                                var x1 = 0.05*oPlotSize+xBlank+j*groupSize+1.9*oPlotSize*(step-1)/timedata.length;
                                var x2 = 0.05*oPlotSize+xBlank+j*groupSize+1.9*oPlotSize*step/timedata.length;
                                var y1 = 0.05*oPlotSize+yBlank+50+oPlotSize+2+i*(csPlotSize+ygBlank)+0.9*oPlotSize*(1-data[sample][xvar][step-1]);
                                var y2 = 0.05*oPlotSize+yBlank+50+oPlotSize+2+i*(csPlotSize+ygBlank)+0.9*oPlotSize*(1-data[sample][xvar][step]);
                                if (selectedmeasure===5 && loop) {
                                    let checkLoop = 0;
                                    for (let n = 0; n < loop[2].length; n++) {
                                        if (loop[2][n][0]<=step&&loop[2][n][1]+1>=step) {
                                            checkLoop = n+1;
                                            break;
                                        }
                                    }
                                    if (checkLoop>0) {
                                        let color = d3.color(experiment.colorList[checkLoop-1]);
                                        fill(color.r,color.g,color.b);
                                        stroke(color.r,color.g,color.b);
                                        if (time === bP1) {fill(bC1); stroke(bC1);} // paper
                                        if (time === bP2) {fill(bC2); stroke(bC2);}
                                        if (time === bP3) {fill(bC3); stroke(bC3);}
                                        if (time === bP4) {fill(bC4); stroke(bC4);}
                                        circle(x1,y1,radius);
                                        circle(x2,y2,radius);
                                        fill(color.r,color.g,color.b);  // paper
                                        stroke(color.r,color.g,color.b);
                                        strokeWeight(0.3);
                                        line(x1,y1,x2,y2);
                                        strokeWeight(1);
                                    } else {
                                        if (step<timedata.length/2) {stroke(0,0,255-255*step/(timedata.length/2)); fill(0,0,255-255*step/(timedata.length/2));}
                                        else {stroke((step-timedata.length/2)*255/(timedata.length/2),0,0); fill((step-timedata.length/2)*255/(timedata.length/2),0,0);}
                                        circle(x1,y1,radius);
                                        circle(x2,y2,radius);
                                        strokeWeight(0.3);
                                        line(x1,y1,x2,y2);
                                        strokeWeight(1);
                                    }
                                } else {
                                    if (step<timedata.length/2) {stroke(0,0,255-255*step/(timedata.length/2)); fill(0,0,255-255*step/(timedata.length/2));}
                                    else {stroke((step-timedata.length/2)*255/(timedata.length/2),0,0); fill((step-timedata.length/2)*255/(timedata.length/2),0,0);}
                                    circle(x1,y1,radius);
                                    circle(x2,y2,radius);
                                    strokeWeight(0.3);
                                    line(x1,y1,x2,y2);
                                    strokeWeight(1);
                                }
                                // draw notations
                                if (isMouseOVer) {
                                    let myCheckX = x2 <= mouseX + 3 && x2 >= mouseX - 3 && y2 <= mouseY + 3 && y2 >= mouseY - 3;
                                    if (myCheckX) {
                                        var xV = time;
                                        var yV = Math.round(dataRaw[sample][xvar][step]);
                                        var myL = xV.split('').length + yV.toString().split('').length+2;
                                        fill(0);
                                        noStroke();
                                        triangle(mouseX,mouseY,mouseX+3,mouseY-3,mouseX+3,mouseY+3);
                                        rect(mouseX+3,mouseY-8,myL*7,16);
                                        fill(255);
                                        textSize(12);
                                        text(xV+'; '+yV.toString(),mouseX+5,mouseY+6);
                                    }
                                }
                            }
                            // Y-var plots
                            // xBlank+j*groupSize,yBlank+48+i*(csPlotSize+ygBlank)
                            if(data[sample][yvar][step]>=0 && data[sample][yvar][step-1]>=0) {
                                var x1 = 0.05*oPlotSize+xBlank+j*groupSize+1.9*oPlotSize*(step-1)/timedata.length;
                                var x2 = 0.05*oPlotSize+xBlank+j*groupSize+1.9*oPlotSize*step/timedata.length;
                                var y1 = 0.05*oPlotSize+yBlank+48+i*(csPlotSize+ygBlank)+0.9*oPlotSize*(1-data[sample][yvar][step-1]);
                                var y2 = 0.05*oPlotSize+yBlank+48+i*(csPlotSize+ygBlank)+0.9*oPlotSize*(1-data[sample][yvar][step]);
                                if (selectedmeasure===5 && loop) {
                                    let checkLoop = 0;
                                    for (let n = 0; n < loop[2].length; n++) {
                                        if (loop[2][n][0]<=step&&loop[2][n][1]+1>=step) {
                                            checkLoop = n+1;
                                            break;
                                        }
                                    }
                                    if (checkLoop>0) {
                                        let color = d3.color(experiment.colorList[checkLoop-1]);
                                        fill(color.r,color.g,color.b);
                                        stroke(color.r,color.g,color.b);
                                        if (time === bP1) {fill(bC1); stroke(bC1);} // paper
                                        if (time === bP2) {fill(bC2); stroke(bC2);}
                                        if (time === bP3) {fill(bC3); stroke(bC3);}
                                        if (time === bP4) {fill(bC4); stroke(bC4);}
                                        circle(x1,y1,radius);
                                        circle(x2,y2,radius);
                                        fill(color.r,color.g,color.b);  // paper
                                        stroke(color.r,color.g,color.b);
                                        strokeWeight(0.3);
                                        line(x1,y1,x2,y2);
                                        strokeWeight(1);
                                    } else {
                                        if (step<timedata.length/2) {stroke(0,0,255-255*step/(timedata.length/2)); fill(0,0,255-255*step/(timedata.length/2));}
                                        else {stroke((step-timedata.length/2)*255/(timedata.length/2),0,0); fill((step-timedata.length/2)*255/(timedata.length/2),0,0);}
                                        circle(x1,y1,radius);
                                        circle(x2,y2,radius);
                                        strokeWeight(0.3);
                                        line(x1,y1,x2,y2);
                                        strokeWeight(1);
                                    }
                                } else {
                                    if (step<timedata.length/2) {stroke(0,0,255-255*step/(timedata.length/2)); fill(0,0,255-255*step/(timedata.length/2));}
                                    else {stroke((step-timedata.length/2)*255/(timedata.length/2),0,0); fill((step-timedata.length/2)*255/(timedata.length/2),0,0);}
                                    circle(x1,y1,radius);
                                    circle(x2,y2,radius);
                                    strokeWeight(0.3);
                                    line(x1,y1,x2,y2);
                                    strokeWeight(1);
                                }
                                // draw notations
                                if (isMouseOVer) {
                                    let myCheckY = x2 <= mouseX + 3 && x2 >= mouseX - 3 && y2 <= mouseY + 3 && y2 >= mouseY - 3;
                                    if (myCheckY) {
                                        var xV = time;
                                        var yV = Math.round(dataRaw[sample][yvar][step]);
                                        var myL = xV.split('').length + yV.toString().split('').length+2;
                                        fill(0);
                                        noStroke();
                                        triangle(mouseX,mouseY,mouseX+3,mouseY-3,mouseX+3,mouseY+3);
                                        rect(mouseX+3,mouseY-8,myL*7,16);
                                        fill(255);
                                        textSize(12);
                                        text(xV+'; '+yV.toString(),mouseX+5,mouseY+6);
                                    }
                                }
                            }
                        }
                    });
                }
            }

            needupdate = false;
        }
    }
}

function mouseMoved() {
    let x = mouseX;
    let y = mouseY;
    let checkX0 = x >= 0.05*oPlotSize+xBlank && x <= 1.95*oPlotSize+xBlank;
    let checkX00 = x >= 0.05*csPlotSize+xBlank+csPlotSize+xBlank && x <= 0.95*csPlotSize+xBlank+csPlotSize+xBlank;
    let checkX1 = x >= 0.05*oPlotSize+xBlank+groupSize && x <= 1.95*oPlotSize+xBlank+groupSize;
    let checkX10 = x >= 0.05*csPlotSize+xBlank+csPlotSize+xBlank+groupSize && x <= 0.95*csPlotSize+xBlank+csPlotSize+xBlank+groupSize;
    let checkX2 = x >= 0.05*oPlotSize+xBlank+2*groupSize && x <= 1.95*oPlotSize+xBlank+2*groupSize;
    let checkX20 = x >= 0.05*csPlotSize+xBlank+csPlotSize+xBlank+2*groupSize && x <= 0.95*csPlotSize+xBlank+csPlotSize+xBlank+2*groupSize;
    let checkX = checkX0||checkX1||checkX2||checkX00||checkX10||checkX20;
    let correctnumplot = (newnumplot === 0) ? numplot : Math.floor(newnumplot/3);
    let checkYi = [];
    let checkY = false;
    for (let i = 0; i < correctnumplot; i++) {
        checkYi[i] = y >= 0.05*oPlotSize+yBlank+48+i*(csPlotSize+ygBlank) && y <= 0.95*oPlotSize+yBlank+50+oPlotSize+2+i*(csPlotSize+ygBlank);
        checkY = checkY || checkYi[i];
    }
    if (checkX&&checkY) {
        isMouseOVer = true;
        needupdate = true;
    } else {
        isMouseOVer = false;
        needupdate = true;
    }
}