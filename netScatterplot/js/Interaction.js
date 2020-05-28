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
                    if (m === 'Outlying length' || m === 'Outlying angle') check = check && e.metrics[m].score >= lowerLimit && e.metrics[m].score <= upperLimit;
                    else check = check && e.metrics[m] >= lowerLimit && e.metrics[m] <= upperLimit;
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
       let array = [];
       if (chosenMetric === 'Outlying length' || chosenMetric === 'Outlying angle') array = filteredData.map(e=>[e,plotData[e].metrics[chosenMetric].score]);
       else array = filteredData.map(e=>[e,plotData[e].metrics[chosenMetric]]);
       array.sort((a,b)=>b[1]-a[1]);
       return array.map(e => e[0]);
    }

}