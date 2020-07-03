class Interaction {
   constructor() {
   }

    // Filtering
    // return index/code of plots that satisfy netSP.filter
    // plotData: array of plots whose element is a plot and contains metrics information
    // filters: objects of all metrics, each element is array [lowerLimit,upperLimit]
    static Filtering (plotData,filters) {
        let filterPlots = [];
        plotData.forEach((e,i)=>{
            if (e.data.length > 0) {
                let check = true;
                for (let m in filters) {
                    let lowerLimit = filters[m][0];
                    let upperLimit = filters[m][1];
                    check = check && e.metrics[m] >= lowerLimit && e.metrics[m] <= upperLimit;
                }
                if (check) filterPlots.push(i);
            }
        });
        return filterPlots;
    }

    // Sorting
    // sort chosen metric after filtering in descending order
    // plotData: array of plots whose element is a plot and contains metrics information
    // filteredData: array of index of filtered plots
    static Sorting(plotData,filteredData,chosenMetric) {
       let array = filteredData.map(e=>[e,plotData[e].metrics[chosenMetric]]);
       array.sort((a,b)=>b[1]-a[1]);
       return array.map(e => e[0]);
    }

    //
    static dropDownMenuForInteraction() {
        // add variables list

        d3.selectAll('.variable1').remove();
        d3.selectAll('.variable2').remove();
        d3.selectAll('.time').remove();

        netSP.variableInfo.forEach(d=>{
            d3.select('#variable1').append('option').attr('class','variable1').attr('value',d[1]).text(d[1]);
            d3.select('#variable2').append('option').attr('class','variable2').attr('value',d[1]).text(d[1]);
        });
        netSP.timeInfo.forEach(d=>{
            d3.select('#time').append('option').attr('class','time').attr('value',d).text(d);
        });
        // if (visualizingOption === 'LMH') {
        //     d3.select('#dataInstances').attr('disabled','');
        //     d3.select('#variable').attr('disabled','');
        // }
        // if (visualizingOption === 'tSNE'||visualizingOption === 'PCA'||visualizingOption === 'UMAP') {
        //     d3.select('#dataInstances').attr('disabled',null);
        //     d3.select('#variable').attr('disabled',null);
        // }
    }

}