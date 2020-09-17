class Graph {
    constructor() {
    }

    // Find MST
    // Kruskal's algorithm
    // graphData is array of vertex
    // each element is an object {name, x, y}
    static KruskalMST (graphData) {
        // Compute distances
        let distances = [];
        for (let i = 0; i < graphData.length-1; i++) {
            for (let j = i+1; j < graphData.length; j++) {
                let d = Math.sqrt((graphData[i].x-graphData[j].x)*(graphData[i].x-graphData[j].x)+(graphData[i].y-graphData[j].y)*(graphData[i].y-graphData[j].y));
                distances.push([graphData[i].name,graphData[j].name,d]);
            }
        }
        // Sort edges
        SortAlgorithms.MergeSort(distances,2);
        // initialize the set of vertices added to MST
        let vertexMST = [];
        let MST = [];
        // add edges and vertices to MST
        while (vertexMST.length < graphData.length) {
            let v1 = distances[0][0];
            let v2 = distances[0][1];
            let edge = distances[0][2];
            let check1 = vertexMST.findIndex(e=>e===v1) === -1;
            let check2 = vertexMST.findIndex(e=>e===v2) === -1;
            if (check1||check2) {
                MST.push([v1,v2,edge]);
                if (check1) vertexMST.push(v1);
                if (check2) vertexMST.push(v2);
            }
            distances.splice(0,1);
        }
        return MST;
    }



    // Find Outliers for a graph
    // return vertices that are outliers
    // graphData is array of vertex
    // each element is an object {name, x, y}
    static Outliers (graphData) {
        let outliers = [];
        let MST = [];
        MST = Graph.KruskalMST(graphData);
        if (MST.length > 0) {
            SortAlgorithms.MergeSort(MST,2);
            let q1 = MST[Math.floor(0.25*MST.length)][2];
            let q3 = MST[Math.floor(0.75*MST.length)][2];
            let index = MST.findIndex(e=>e[2]>q3+1.5*(q3-q1));
            if (index !== -1) {
                for (let i = index; i < MST.length; i++) {
                    let v1 = MST[i][0];
                    let v2 = MST[i][1];
                    let count1 = 0, count2 = 0;
                    MST.forEach(e=>{
                        if (e[0] === v1 || e[1] === v1) count1 += 1;
                        if (e[0] === v2 || e[1] === v2) count2 += 1;
                    });
                    if (count1 === 1) outliers.push(v1);
                    if (count2 === 1) outliers.push(v2);
                }
            }
        }
        return outliers;
    }
}