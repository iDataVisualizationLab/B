function metricDropDown () {
    d3.selectAll('.metricName').remove();
    for (let i = 0; i < mKey.length; i++) {
        d3.select('#metric').append('option').attr('class','metricName').attr('value',mKey[i]).text(mKey[i]);
    }
}

function plotDropDown () {
    d3.selectAll('.plotName').remove();
    for (let i = 0; i < pKey.length; i++) {
        d3.select('#plot').append('option').attr('class','plotName').attr('value',pKey[i]).text(pKey[i]);
    }
}

// SELECTION OF DATASET
d3.select('#dataset').on('change',function (){
    selectedData = this.value;
    clicked = false;
    highlighted = false;
    // modify parameters
    switch (selectedData) {
        case 'employment':
            ds = [1,2,3,4,5,6,7,8,9,10,11,12];
            selectedPlot = 'Total Nonfarm vs. Total Private';
            timelineStep = 12;
            timelineText = 1;
            break;
        case 'HPCC':
            ds = [1,2,3,4,5,6];
            selectedPlot = 'CPU1 Temp vs. CPU2 Temp';
            timelineStep = 6;
            timelineText = 'full';
            break;
        case 'stock':
            ds = [1,2,3,4,5,6,7,8,9,10,11,12];
            selectedPlot = 'Open vs. High';
            timelineStep = 20;
            timelineText = 'full';
            break;
        case 'death-birth':
            ds = [1,2,3,4,5,6,7,8,9,10];
            selectedPlot = 'Death rate vs. Birth rate';
            timelineStep = 10;
            timelineText = 'full';
            break;
        case 'life-expectancy':
            ds = [1,2,3,4,5,6,7,8,9,10];
            selectedPlot = 'male vs. female';
            timelineStep = 10;
            timelineText = 'full';
            break;
    }
    // call main function
    main();
})

// SELECTION OF METRIC
d3.select('#metric').on('change',function (){
    selectedMetric = this.value;
    computations();
    drawInterface(false);
    noPlot();
    clicked = false;
    highlighted = false;
});

// SELECTION OF PLOT
d3.select('#plot').on('change',function (){
    selectedPlot = this.value;
    computations();
    drawInterface(false);
    noPlot();
    clicked = false;
    highlighted = false;
});