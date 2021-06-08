/*
INPUT:
Points: array of points
Each point: array of coordinates || null if this point is removed from the array

OUTPUT:
Tree: array of edges
Each edge: objects with three attributes: parent: index of parent node, child: index of child node, weight
*/
function min_arborescence (Points) {
    let Tree = [];
    for (let i = 1; i < Points.length; i++) {
        if (Points[i] !== null) {
            let minWeight = Infinity;
            let parent = null;
            for (let j = 0; j < i; j++) {
                if (Points[j] !== null) {
                    let Di = Points[i].length;
                    let Dj = Points[j].length;
                    if (Di === Dj) {
                        let d = 0;
                        for (let n = 0; n < Di; n++) {
                            d = d + (Points[i][n] - Points[j][n])*(Points[i][n] - Points[j][n]);
                        }
                        d = Math.sqrt(d);
                        if (d < minWeight) {
                            minWeight = d;
                            parent = j;
                        }
                    } else {
                        console.log('From function min_arborescence: node '+i+' has '+Di+' dimensions, while node '+j+' has '+Dj+' dimensions.');
                    }
                }
            }
            if (parent !== null) {
                Tree.push({
                    parent: parent,
                    child: i,
                    weight: minWeight,
                });
            }
        }
    }
    return Tree;
}