/*
INPUT:
Points: array of points
Each point: array of coordinates || null if this point is removed from the array
Tree: array of edges
Each edge: objects with three attributes: parent: index of parent node, child: index of child node, weight

OUTPUT:
score: striated score from 0 to 1
*/

function striated (Points,Tree) {
    let degreeArray_entering = Points.map((e,i)=>{
        if (e === null || i === 0) return undefined;
        else return 0;
    });
    let degreeArray_outgoing = Points.map((e,i)=>{
        if (e === null) return undefined;
        else return 0;
    });
    let neighborArray = Points.map((e,i)=>{
        if (e === null || i === 0) return null;
        else return {parent: undefined, child: undefined};
    });
    for (let i = 0; i < Tree.length; i++) {
        let parent = Tree[i].parent;
        let child = Tree[i].child;
        if (degreeArray_outgoing[parent] !== undefined) degreeArray_outgoing[parent] += 1;
        if (degreeArray_entering[child] !== undefined) degreeArray_entering[child] += 1;
        if (neighborArray[parent] !== null) neighborArray[parent].child = child;
        if (neighborArray[child] !== null) neighborArray[child].parent = parent;
    }
    let I = 0;
    for (let i = 0; i < degreeArray_entering.length; i++) {
        if (degreeArray_entering[i] === 1 && degreeArray_outgoing[i] === 1) {
            let x0 = Points[i][0];
            let y0 = Points[i][1];
            let x1 = Points[neighborArray[i].parent][0];
            let y1 = Points[neighborArray[i].parent][1];
            let x2 = Points[neighborArray[i].child][0];
            let y2 = Points[neighborArray[i].child][1];
            let check1 = x0 !== x1 || y0 !== y1;
            let check2 = x0 !== x2 || y0 !== y2;
            if (check1 && check2) {
                if (cosine(x0,y0,x1,y1,x2,y2) < -0.75) I += 1;
            }
        }
    }
    return I/(Tree.length+1);
}