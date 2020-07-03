class Management {
    constructor() {
    }

    // Load and compute
    // run before any interactive activities
    static LoadAndComputation(dataFile,instanceFile,variableFile,type) {
        codeManager.isComputing = true;
        Promise.all([
            d3.csv(dataFile),
            d3.csv(instanceFile),
            d3.csv(variableFile),
        ]).then(files=>{
            // reset variables
            netSP.plots = [];
            netSP.encode = [];
            // store data in format: instance -> variable -> time series
            netSP.data = ReadFile.IVTFormat(files,type);
            // add information to interaction tab
            Interaction.dropDownMenuForInteraction();
            // get percentages
            // DataProcessing.Percentages(data);
            // get z-score
            // DataProcessing.GetZScore(data);
            // get relative change
            // DataProcessing.GetRelativeChange(data);
            // Normalize the net scatter plot
            DataProcessing.NormalizationNetScatterPlot(netSP.data);
            // DataProcessing.Z_Normalization2D(netSP.data);
            // encode the plots
            netSP.encode = EncodePlots.NetScatterPlot(files[2]);
            // attributes for every plot
            for (let p = 0; p < netSP.encode.length; p++) {
                netSP.plots[p] = {
                    quantities: {
                        edgeLength: [],
                        angle: [],
                    },
                    metrics: {
                        'Mean length': 0,
                        'Mean angle': 0,
                        'Standard deviation length': 0,
                        'Standard deviation angle': 0,
                        'Outlying length': 0,
                        'Outlying angle': 0,
                        'Intersection': 0,
                        'Translation': 0,
                        'Complexity': 0,
                    },
                    outliers: {
                        length: [],
                        angle: [],
                    },
                    data: [],
                }
            }
            // store data point to every net scatter plot
            DataProcessing.NetScatterPlot(netSP.data);
            // Compute quantities and metrics for every plot
            netSP.plots.forEach((e,i)=>{
                e.quantities.edgeLength = ComputeQuantities.EdgeLength(e.data);
                e.quantities.angle = ComputeQuantities.Angle(e.data);
                e.metrics['Mean length'] = ComputeMetrics.MeanValue(e.quantities.edgeLength);
                e.metrics['Mean angle'] = ComputeMetrics.MeanValue(e.quantities.angle);
                e.metrics['Standard deviation length'] = ComputeMetrics.StandardDeviation(e.quantities.edgeLength);
                e.metrics['Standard deviation angle'] = ComputeMetrics.StandardDeviation(e.quantities.angle);
                e.metrics['Outlying length'] = ComputeMetrics.Outlying(e.quantities.edgeLength,true).score;
                e.metrics['Outlying angle'] = ComputeMetrics.Outlying(e.quantities.angle,false).score;
                e.outliers.length = ComputeMetrics.Outlying(e.quantities.edgeLength,true).outliers;
                e.outliers.angle = ComputeMetrics.Outlying(e.quantities.angle,false).outliers;
                e.metrics['Intersection'] = ComputeMetrics.Intersection(e.data);
                e.metrics['Translation'] = ComputeMetrics.Translation(e.data);
                e.metrics['Complexity'] = ComputeMetrics.Complexity(e.quantities.angle);
            });

            // initClusterObj();
            // let kMeanGroup = $('#knum').val() || 6;
            // let kMeanIterations = $('#kiteration').val() || 1;
            // recalculateCluster( {clusterMethod: 'kmean',bin:{k:kMeanGroup,iterations:kMeanIterations}},function(){
            //     clickArr = [];
            //     plotPosition = [];
            //     reCalculateTsne();
            //     prepareRadarTable();
            // });
            //

            Management.Visualization();

            codeManager.isComputing = false;
            codeManager.needComputation = false;
            codeManager.needUpdate = true;
            d3.select('.cover').classed('hidden', true);
        });
    }

    // Visualization
    static Visualization() {
        // Filtering
        let filteredPlots = Interaction.Filtering(netSP.plots,netSP.filter);
        // Sorting
        let sortedPlots = Interaction.Sorting(netSP.plots,filteredPlots,controlVariable.selectedMetric);
        // Pick plots to display
        let displayPlots = {
            high: [],
            median: [],
            low: [],
        }
        let nDisplay = 5;
        if (sortedPlots.length >= nDisplay) {
            for (let p = 0; p < nDisplay; p++) {
                displayPlots.high.push(sortedPlots[p]);
                displayPlots.median.push(sortedPlots[Math.floor(sortedPlots.length * 0.5) - Math.floor(nDisplay*0.5) + p]);
                displayPlots.low.push(sortedPlots[sortedPlots.length - nDisplay + p]);
            }
        }
        // Create canvas
        DesignApplication.CreateCanvas('mainCanvasHolder','HMLCanvas','myCanvas',1000,1800,'#ffffff');
        // Draw plots
        let headerInfo = {
            font: 'Arial',
            size: 30,
            position: {
                high: controlVariable.displaySeries ? [100,600] : [100,100],
                median: controlVariable.displaySeries ? [400,600] : [400,100],
                low: controlVariable.displaySeries ? [700,600] : [700,100],
            }
        };
        let plotInfo = {
            size: [200,200],
            position: controlVariable.displaySeries ? [100,700] : [100,200],
            notations: {
                font: 'Arial',
                size: 13,
                color: '#000000',
            }
        }
        let blankSize = [100,100];
        DesignApplication.HMLView('HMLCanvas',headerInfo,plotInfo,blankSize,displayPlots);

    }
}