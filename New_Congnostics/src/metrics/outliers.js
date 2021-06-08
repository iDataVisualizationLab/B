/*
INPUT:
Tree: array of edges
Each edge: objects with three attributes: parent: index of parent node, child: index of child node, weight

OUTPUT:

outlying: outlying score from 0 to 1
outliers: array of index of outliers
*/

function determineOutliers (Tree) {
    let result = {outlying: 0, outliers: []};
    let To = 0, T = 0;
    let weightArray = Tree.map(e=>e.weight);
    weightArray.sort((a,b)=>a-b);
    let q = quartile(weightArray);
    let limit = q.q3 + 1.5*(q.q3-q.q1);
    let degreeArray = [];       // store #edges both entering and outgoing
    let checkArray = [];        // store #edges exceed the limit
    for (let i = 0; i < Tree.length; i++) {
        let parent = Tree[i].parent;
        let child = Tree[i].child;
        let weight = Tree[i].weight;
        if (degreeArray[parent]) degreeArray[parent] += 1;
        else {degreeArray[parent] = 1; checkArray[parent] = 0;}
        if (degreeArray[child]) degreeArray[child] += 1;
        else {degreeArray[child] = 1; checkArray[child] = 0;}
        if (weight > limit) {
            checkArray[child] += 1;
            checkArray[parent] += 1;
        }
        T += weight;                                 // Wilkinson formula
        // T += Math.abs(weight-q.q2);               // Bao formula
    }
    for (let i = 0; i < Tree.length; i++) {
        let parent = Tree[i].parent;
        let child = Tree[i].child;
        let weight = Tree[i].weight;
        let isParentOutlier = checkArray[parent] > 0 && degreeArray[parent] === checkArray[parent];
        let isChildOutlier = checkArray[child] > 0 && degreeArray[child] === checkArray[child];
        if (isChildOutlier || isParentOutlier) {
            To += weight;                            // Wilkinson formula
            // To += Math.abs(weight-q.q2);          // Bao formula
        }
        if (parent === 0 && result.outliers.length === 0 && isParentOutlier) result.outliers.push(0);
        if (isChildOutlier) result.outliers.push(child);
    }
    result.outlying = (T!==0) ? To/T : 0;
    return result;
}