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
            // store data in format: instance -> variable -> time series
            let data;
            if (type === 'BLS') data = ReadFile.BLSType(files);
            // normalize data
            DataProcessing.NormalizationType1(data);
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
                        mean_length: 0,
                        mean_angle: 0,
                        sd_length: 0,
                        sd_angle: 0,
                        outlying_length: {},
                        outlying_angle: {},
                    },
                    data: [],
                }
            }
            // store data point to every net scatter plot
            DataProcessing.NetScatterPlot(data);
            // Compute quantities and metrics for every plot
            netSP.plots.forEach((e,i)=>{
                e.quantities.edgeLength = ComputeQuantities.EdgeLength(e.data);
                e.quantities.angle = ComputeQuantities.Angle(e.data);
                e.metrics.mean_length = ComputeMetrics.MeanValue(e.quantities.edgeLength);
                e.metrics.mean_angle = ComputeMetrics.MeanValue(e.quantities.angle);
                e.metrics.sd_length = ComputeMetrics.StandardDeviation(e.quantities.edgeLength);
                e.metrics.sd_angle = ComputeMetrics.StandardDeviation(e.quantities.angle);
                e.metrics.outlying_length = ComputeMetrics.Outlying(e.quantities.edgeLength,true);
                e.metrics.outlying_angle = ComputeMetrics.Outlying(e.quantities.angle,false);
            });
            codeManager.isComputing = false;
        });
    }

    // Visualization
    static Visualization() {
        if (!codeManager.isComputing) {
            // Filtering
            let filteredPlots = Interaction.Filtering(netSP.plots,netSP.filter);
            // Sorting
            let sortedPlots = Interaction.Sorting(netSP.plots,filteredPlots,'outlying_angle');
            // Pick plots to display
            let displayPlots = {
                high: [],
                median: [],
                low: [],
            }
            let nDisplay = 5;
            for (let p = 0; p < nDisplay; p++) {
                displayPlots.high.push(sortedPlots[p]);
                displayPlots.median.push(sortedPlots[Math.floor(sortedPlots.length*0.5)+p]);
                displayPlots.low.push(sortedPlots[sortedPlots.length-nDisplay+p]);
            }
            // Create canvas
            DesignApplication.CreateCanvas('rightSide','HMLCanvas','myCanvas',1000,1800,'#ffffff');
            // Draw plots
            let headerInfo = {
                font: 'Arial',
                size: 30,
                position: {
                    high: [100,100],
                    median: [400,100],
                    low: [700,100],
                }
            };
            let plotInfo = {
                size: [200,200],
                position: [100,200],
                notations: {
                    font: 'Arial',
                    size: 13,
                    color: '#000000',
                }
            }
            let blankSize = [100,100];
            DesignApplication.HMLView('HMLCanvas',headerInfo,plotInfo,blankSize,nDisplay,displayPlots);
            clearInterval(codeManager.needRepeat);
        } else {
            d3.select('body').append('p').text('Computing ...');
        }

    }
}