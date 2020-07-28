/////////////////////
/////////////////////
// DECLARE VARIABLES
/////////////////////
////////////////////

// VARIABLES FOR CONTROLLING
let videoOnly = false;
let isFirstTime = true;

// VARIABLES FOR VISUALIZATION
let width = 2000;
let height = 6000;
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
        .data(netSP.metricName); // update data
    mc_o.exit().remove(); // remove exit data
    let mc = mc_o.enter().append('div').attr('class', 'measureControl row valign-wrapper')
        .attr('disabled', 'disabled'); // new data

    let mc_labelr = mc.append('label').attr('class', 'col s2 measureName');
    mc_labelr.append('input').attr('type', 'radio').attr('name', 'orderMeasure').attr('class', 'with-gap');
    mc_labelr.append('span');
    let mc_labeln = mc.append('label').attr('class', 'col s6 measureFilter');
    mc_labeln.append('span').attr('class', 'col measureLabel');
    // let mc_label = mc.append('label').attr('class', 'col s1 measureFilterCheck');
    // mc_label.append('input').attr('type', 'checkbox').attr('class', 'filled-in enableCheck');
    // mc_label.append('span');
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
            // change filter values
            netSP.filter[d3.select(this.target).datum()][0] = +(values[0]);
            netSP.filter[d3.select(this.target).datum()][1] = +(values[1]);
            // codeManager.needUpdate = true;
            Management.Visualization();
        });
    });

    mc = d3.select('#measureControl').selectAll('.measureControl'); // reselect
    mc.select('label.measureName').select('input')
        .attr('checked', d => controlVariable.selectedMetric === d ? '' : null)
        .on('change', function (d) {
            // select metrics
            controlVariable.selectedMetric = d;
            // codeManager.needUpdate = true;
            Management.Visualization();
        });
    mc.select('label.measureFilter').select('span')
        // .style('color', d => 'rgb(' + getcolor(measureObj[d]).join(',') + ')').style('font-family', 'Arial')
        .style('color','rgb(0,0,0)').style('font-family', 'Arial')
        .text(d => d);
    // mc.select('label.measureFilterCheck')
    //     .on('change', function (d) {
    //         checkfilter[measureObj[d]] = !checkfilter[measureObj[d]];
            // d3.select(this.parentNode.parentNode).attr('disabled', this.checked ? null : 'disabled');
            // codeManager.needUpdate = true;
        // });
}

function onTabChange (myTab_) {
    // let myVideo = document.getElementById('videoIn');
    if (myTab_==='video') {
        preloader(false);
        closeNav();
        videoOnly = true;
        $('#videoIn')[0].play();

        d3.select('#video').classed('hide',false);
        d3.select('#demo').classed('hide',true);

    } else if (myTab_==='demo') {
        if (isFirstTime) preloader(true);
        openNav();
        videoOnly = false;
        isFirstTime = false;
        $('#videoIn')[0].pause();

        d3.select('#video').classed('hide',true);
        d3.select('#demo').classed('hide',false);

        // $('.sidenav').sidenav();
        discovery('#sideNavbtn');
        // openNav();
        d3.select("#DarkTheme").on("click", switchTheme);
        // $('input[type=radio][name=viztype]').change(function() {
        //     updateViztype(this.value);
        // });
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
            controlVariable.selectedData = this.value;
            if (controlVariable.selectedData === 'ECG' || controlVariable.selectedData === 'Bao') {
                d3.select('#pca').attr('disabled',true);
                d3.select('#t_sne').attr('disabled',true);
                d3.select('#umap').attr('disabled',true);
            } else {
                d3.select('#pca').attr('disabled',null);
                d3.select('#t_sne').attr('disabled',null);
                d3.select('#umap').attr('disabled',null);
            }
            codeManager.needComputation = true;
            d3.select('.cover').classed('hidden', false);
            if(controlVariable.visualizing === 'LMH') {
                d3.select('#mainCanvasHolder').classed('hide',false);
                d3.select('#tSNE').classed('hide',true);
                d3.select('#dataInstances').attr('disabled','');
                d3.select('#variable1').attr('disabled',null);
                d3.select('#variable2').attr('disabled',null);
                d3.select('#time').attr('disabled',null);
            }
            if(controlVariable.visualizing === 'tSNE'||controlVariable.visualizing === 'PCA'||controlVariable.visualizing === 'UMAP') {
                d3.select('#mainCanvasHolder').classed('hide', true);
                d3.select('#tSNE').classed('hide', false);
                recalculateCluster( {clusterMethod: $('#clusterMethod').val() || 'kmean',bin:{k:$('#knum').val() || 6,iterations:$('#kiteration').val() || 1}},function(){
                    clickArr = [];
                    plotPosition = [];
                    reCalculateTsne();
                });
                d3.select('#dataInstances').attr('disabled','');
                d3.select('#variable1').attr('disabled','');
                d3.select('#variable2').attr('disabled','');
                d3.select('#time').attr('disabled','');
            }
            clickArr = [];      // delete clickArr after changing mode
            controlVariable.interaction.instance = 'noOption';
            controlVariable.interaction.variable1 = 'noOption';
            controlVariable.interaction.variable2 = 'noOption';
            controlVariable.interaction.time = 'noOption';
            controlVariable.displaySeries = false;
            $('#dataInstances').val('noOption').selected = true;
            $('#variable1').val('noOption').selected = true;
            $('#variable2').val('noOption').selected = true;
            $('#time').val('noOption').selected = true;

            ComputingData();
        });
        // visualizing option
        d3.select('#mainCanvasHolder').classed('hide',false);
        d3.select('#visualizing').on('change',function(){
            controlVariable.visualizing = this.value;
            if (controlVariable.visualizing !== 'LHM') {
                d3.select('#ecg').attr('disabled',true);
                d3.select('#test').attr('disabled',true);
            } else {
                d3.select('#ecg').attr('disabled',null);
                d3.select('#test').attr('disabled',null);
            }
            if(controlVariable.visualizing === 'LMH') {
                d3.select('#mainCanvasHolder').classed('hide',false);
                d3.select('#tSNE').classed('hide',true);
                d3.select('#dataInstances').attr('disabled','');
                d3.select('#variable').attr('disabled','');
                d3.select('#metrics').classed('hidden',false);
            }
            if(controlVariable.visualizing === 'PCA') {
                d3.select('#mainCanvasHolder').classed('hide',true);
                d3.select('#tSNE').classed('hide',false);
                d3.select('#metrics').classed('hidden',true);
                onchangeVizType(controlVariable.visualizing);
                onchangeVizdata(controlVariable.visualizing);
                d3.select('#dataInstances').attr('disabled',null);
                d3.select('#variable').attr('disabled',null);
                clickArr = [];
            }
            if(controlVariable.visualizing === 'UMAP') {
                d3.select('#mainCanvasHolder').classed('hide',true);
                d3.select('#tSNE').classed('hide',false);
                d3.select('#metrics').classed('hidden',true);
                onchangeVizType(controlVariable.visualizing);
                onchangeVizdata(controlVariable.visualizing);
                d3.select('#dataInstances').attr('disabled',null);
                d3.select('#variable').attr('disabled',null);
                clickArr = [];
            }
            if(controlVariable.visualizing === 'tSNE') {
                d3.select('#mainCanvasHolder').classed('hide',true);
                d3.select('#tSNE').classed('hide',false);
                d3.select('#metrics').classed('hidden',true);
                onchangeVizType(controlVariable.visualizing);
                onchangeVizdata(controlVariable.visualizing);
                d3.select('#dataInstances').attr('disabled',null);
                d3.select('#variable').attr('disabled',null);
                clickArr = [];
            }
        });
        // interaction option - instance
        d3.select('#dataInstances').on('change',function(){
            // new chosen value
            controlVariable.interaction.instance = this.value;
            // redraw
            controlVariable.displaySeries = true;
            Management.Visualization();
        });
        // interaction option - variable1
        d3.select('#variable1').on('change',function(){
            controlVariable.interaction.variable1 = this.value;
            if (controlVariable.interaction.variable1 === 'noOption' || controlVariable.interaction.variable2 === 'noOption' || controlVariable.interaction.time === 'noOption') {
                d3.select('#dataInstances').attr('disabled','');
                controlVariable.displaySeries = false;
            } else {
                d3.select('#dataInstances').attr('disabled',null);
                // create instance list
                let index = netSP.encode.findIndex(e=>{
                   let check1 = controlVariable.interaction.variable1 === e[0] && controlVariable.interaction.variable2 === e[1] && controlVariable.interaction.time === e[2];
                   let check2 = controlVariable.interaction.variable1 === e[1] && controlVariable.interaction.variable2 === e[0] && controlVariable.interaction.time === e[2];
                   return check1 || check2;
                });
                d3.selectAll('.dataInstances').remove();
                let list = [];
                if (netSP.plots[index].outliers.angle.length > 0) {
                    netSP.plots[index].outliers.angle.forEach(e=>list.push(e));
                }
                if (netSP.plots[index].outliers['length'].length > 0) {
                    netSP.plots[index].outliers['length'].forEach(e=>{
                        if (list.findIndex(e_=>e_===e) === -1) list.push(e);
                    });
                }
                if (list.length > 0) {
                    list.forEach(d=>{
                        d3.select('#dataInstances').append('option').attr('class','dataInstances').attr('value',d).text(d);
                    });
                }
                controlVariable.displaySeries = true;
            }
            if (controlVariable.visualizing === 'LMH') Management.Visualization();
            else if (controlVariable.visualizing === 'UMAP') umapTS.renderUMAP();
            else if (controlVariable.visualizing === 'PCA') pcaTS.renderPCA();
            else if (controlVariable.visualizing === 'tSNE') tsneTS.renderTSNE();
        });
        // interaction option - variable2
        d3.select('#variable2').on('change',function(){
            controlVariable.interaction.variable2 = this.value;
            if (controlVariable.interaction.variable1 === 'noOption' || controlVariable.interaction.variable2 === 'noOption' || controlVariable.interaction.time === 'noOption') {
                d3.select('#dataInstances').attr('disabled','');
                controlVariable.displaySeries = false;
            } else {
                d3.select('#dataInstances').attr('disabled',null);
                // create instance list
                let index = netSP.encode.findIndex(e=>{
                    let check1 = controlVariable.interaction.variable1 === e[0] && controlVariable.interaction.variable2 === e[1] && controlVariable.interaction.time === e[2];
                    let check2 = controlVariable.interaction.variable1 === e[1] && controlVariable.interaction.variable2 === e[0] && controlVariable.interaction.time === e[2];
                    return check1 || check2;
                });
                d3.selectAll('.dataInstances').remove();
                let list = [];
                if (netSP.plots[index].outliers.angle.length > 0) {
                    netSP.plots[index].outliers.angle.forEach(e=>list.push(e));
                }
                if (netSP.plots[index].outliers['length'].length > 0) {
                    netSP.plots[index].outliers['length'].forEach(e=>{
                        if (list.findIndex(e_=>e_===e) === -1) list.push(e);
                    });
                }
                if (list.length > 0) {
                    list.forEach(d=>{
                        d3.select('#dataInstances').append('option').attr('class','dataInstances').attr('value',d).text(d);
                    });
                }
                controlVariable.displaySeries = true;
            }
            if (controlVariable.visualizing === 'LMH') Management.Visualization();
            else if (controlVariable.visualizing === 'UMAP') umapTS.renderUMAP();
            else if (controlVariable.visualizing === 'PCA') pcaTS.renderPCA();
            else if (controlVariable.visualizing === 'tSNE') tsneTS.renderTSNE();
        });
        // interaction option - time
        d3.select('#time').on('change',function(){
            controlVariable.interaction.time = this.value;
            if (controlVariable.interaction.variable1 === 'noOption' || controlVariable.interaction.variable2 === 'noOption' || controlVariable.interaction.time === 'noOption') {
                d3.select('#dataInstances').attr('disabled','');
                controlVariable.displaySeries = false;
            } else {
                d3.select('#dataInstances').attr('disabled',null);
                // create instance list
                let index = netSP.encode.findIndex(e=>{
                    let check1 = controlVariable.interaction.variable1 === e[0] && controlVariable.interaction.variable2 === e[1] && controlVariable.interaction.time === e[2];
                    let check2 = controlVariable.interaction.variable1 === e[1] && controlVariable.interaction.variable2 === e[0] && controlVariable.interaction.time === e[2];
                    return check1 || check2;
                });
                d3.selectAll('.dataInstances').remove();
                let list = [];
                if (netSP.plots[index].outliers.angle.length > 0) {
                    netSP.plots[index].outliers.angle.forEach(e=>list.push(e));
                }
                if (netSP.plots[index].outliers['length'].length > 0) {
                    netSP.plots[index].outliers['length'].forEach(e=>{
                        if (list.findIndex(e_=>e_===e) === -1) list.push(e);
                    });
                }
                if (list.length > 0) {
                    list.forEach(d=>{
                        d3.select('#dataInstances').append('option').attr('class','dataInstances').attr('value',d).text(d);
                    });
                }
                controlVariable.displaySeries = true;
            }
            if (controlVariable.visualizing === 'LMH') Management.Visualization();
            else if (controlVariable.visualizing === 'UMAP') umapTS.renderUMAP();
            else if (controlVariable.visualizing === 'PCA') pcaTS.renderPCA();
            else if (controlVariable.visualizing === 'tSNE') tsneTS.renderTSNE();
        });
        // display chart options
        // need check
        $('input[type=radio][name=displayType]').change(function() {
            controlVariable.displayType = this.value;
            switch (controlVariable.visualizing) {
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

        // change type of chart in dimension reduction techniques
        d3.select('#tsneScreen_svg').on('click',Interaction.MouseClickFunction).on('mousemove',Interaction.mouseOverFunction);
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
        // return;
    }
    this.setAttribute('value', "light");
    this.querySelector('span').textContent = "Dark";
    d3.select('body').classed('light',true);
    d3.select('.logoLink').select('img').attr('src',"https://idatavisualizationlab.github.io/HPCC/HPCViz/images/TTUlogo.png");
    // return;
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
function ComputingData() {
    let filename0;
    let filename1;
    let filename2;
    let type = '';
    switch (controlVariable.selectedData) {
        case 'employment':
            filename0 = "data/US_employment_July.txt";
            filename1 = "data/stateCode.txt";
            filename2 = "data/Industrycode_reduced.txt";
            type = 'BLS';
            break;
        case 'RUL':
            filename0 = "data/RUL_data.txt";
            filename1 = "data/engine_code.txt";
            filename2 = "data/sensor_code.txt";
            type = 'normal';
            break;
        case 'stock':
            filename0 = "data/stock_data.txt";
            filename1 = "data/year_code.txt";
            filename2 = "data/var_code.txt";
            type = 'normal';
            break;
        case 'ECG':
            filename0 = "data/ECG_dog.txt";
            filename1 = "data/ECG_sample_code.txt";
            filename2 = "data/ECG_varCode.txt";
            type = 'normal';
            break;
        case 'EEG':
            filename0 = "data/eeg_data.txt";
            filename1 = "data/eeg_code.txt";
            filename2 = "data/eeg_v_code.txt";
            type = 'normal';
            break;
        case 'Bao':
            filename0 = "data/Bao_dataset.txt";
            filename1 = "data/Bao_data_sample.txt";
            filename2 = "data/Bao_data_var.txt";
            type = 'normal';
            break;
        case 'death_rate':
            filename0 = "data/birth_death_rate.csv";
            filename1 = "data/death_rate_code.txt";
            filename2 = "data/death_rate_var.txt";
            type = 'death-birth';
            break;
        case 'house_price':
            filename0 = 'data/house_financial.txt';
            filename1 = 'data/state_code.txt';
            filename2 = 'data/house_financial_code.txt';
            type = 'normal';
            break;
        case 'Life_expectancy':
            filename0 = 'data/Life_expectancy.txt';
            filename1 = 'data/Country_code.txt';
            filename2 = 'data/Gender_code.txt';
            type = 'normal';
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
        case 'HPCC':
            filename0 = 'data/chillwater_value.txt';
            filename1 = 'data/chillwater_host.txt';
            filename2 = 'data/chillwater_services.txt';
            type = 'normal';
            break;
    }
    Management.LoadAndComputation(filename0,filename1,filename2,type);
}

    // Prepare data for RadarController_table

function prepareRadarTable() {
    dataRadar2 = [];    // [all plot][measures for each plot]
    dataRadar1 = [];    // [measure][all values]
    dataRadar = {};
    // compute dataRadar1
    for (let i = 0; i < netSP.metricName.length; i++) {
        dataRadar1[i] = [];
        netSP.plots.forEach(e=>{
            dataRadar1[i].push(e.metrics[netSP.metricName[i]]);
        });
    }

    // compute dataRadar2
    netSP.plots.forEach((e,i)=>{
        dataRadar2[i] = [];
        netSP.metricName.forEach(e_=>{
            dataRadar2[i].push(e.metrics[e_]);
        });
        dataRadar2[i].cluster = cluster_info.findIndex(e_=>e_.arr[0].find(e__=>e__===`${0}-${i}`));
        dataRadar2[i].plot = i;
        dataRadar2[i].name = `${netSP.encode[i][0]}-${netSP.encode[i][1]}-${netSP.encode[i][2]}`;
        dataRadar2[i].timestep = netSP.encode[i][2];
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
    firstTime = false;
}

function initClusterObj(){
    hosts = [];
    sampleS = {};
    netSP.plots.forEach((e,i)=>{
        let hName = `${0}-${i}`;
        sampleS[hName] = {};
        netSP.metricName.forEach(e_=>{
            sampleS[hName][e_] = [[e.metrics[e_]]];
        });
        hosts.push({
            name: hName,
            sample: 0,
            mindex: i,
        });
    });
    sampleS.timespan = [new Date()];
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
    onchangeVizType(controlVariable.visualizing);
    onchangeVizdata(controlVariable.visualizing);
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
    let outlierMultiply = 1.5;
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
                // median: ss.medianSorted(d) ,
                median: d3.mean(d) ,
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
// function setup() {
//     frameRate(30);
// }

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

// function draw() {
//     if (codeManager.needComputation && !videoOnly) {
//         ComputingData();
//     } else {
//         if (codeManager.needUpdate) {
//             Management.Visualization();
//             codeManager.needUpdate = false;
//         }
//     }
// }

// do the functions
ComputingData();