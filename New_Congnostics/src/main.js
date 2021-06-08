// Promise.all([
//     d3.csv('data/US_employment_July.txt'),
//     d3.csv('data/stateCode.txt'),
//     d3.csv('data/Industrycode_reduced.txt'),
// ]).then(file=>{
//     // make plot data
//     let data = plot_data(file);
//
//     // compute visual metrics
//     let plots = [];
//     let count = 0;
//     for (let s in data) {
//         for (let p in data[s]) {
//             let points = data[s][p].map(e=>{
//                 if (e!==null) return e.map(e_=>e_);
//                 else return null;
//             });
//             let norPoints = normalization(points);
//             let tree = min_arborescence(norPoints);
//             // determine outliers
//             let outliers = determineOutliers(tree);
//             let outlying = outliers.outlying;
//             let outlierArray = outliers.outliers;
//             // remove outliers
//             let tree_noOutlier = null, points_noOutlier = null;
//             if (outlierArray.length > 0) {
//                 points_noOutlier = remove_outliers(norPoints,outlierArray);
//                 tree_noOutlier = min_arborescence(points_noOutlier);
//             }
//             // compute other metrics
//             let clumpyScore = undefined, striatedScore = undefined;
//             if (outlierArray.length > 0) {
//                 clumpyScore = clumpy(tree_noOutlier).score;
//                 striatedScore = striated(points_noOutlier,tree_noOutlier);
//             } else {
//                 clumpyScore = clumpy(tree).score;
//                 striatedScore = striated(norPoints,tree);
//             }
//             plots[count] = [outlying,clumpyScore,striatedScore];
//             count += 1;
//         }
//     }
//
//     // visualization
//     parallel_coordinates(plots);
//
//     console.log(plots.length);
//
// });

function main() {
    // compute metrics for plots
    let plots = [];
    let options = [
        {metric:'striated',score:'high'},
    ];
    for (let i = 0; i < options.length; i++) {
        let data = make_Data(options[i].metric,options[i].score);
        let points = normalization(data);
        let tree = min_arborescence(points);
        // determine outliers
        let outlierResult = determineOutliers(tree);
        let outlyingScore = outlierResult.outlying;
        let outliers = outlierResult.outliers;
        // other scores
        let clumpyScore = undefined, striatedScore = undefined;
        if (outliers.length > 0) {
            let points_noOutlier = remove_outliers(points,outliers);
            let tree_noOutlier = min_arborescence(points_noOutlier);
            clumpyScore = clumpy(tree_noOutlier).score;
            striatedScore = striated(points_noOutlier,tree_noOutlier);
        } else {
            clumpyScore = clumpy(tree).score;
            striatedScore = striated(points,tree);
        }
        plots[i] = [outlyingScore,clumpyScore,striatedScore];
        plots[i].points = points;
        plots[i].tree = tree;
    }
    // visualization
    parallel_coordinates(plots);
}

main();