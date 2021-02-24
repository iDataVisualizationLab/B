function Prim (vertexArray) {
    let MST = [];
    let Q = vertexArray.map((e,i)=>{
        return {key:Infinity,pi:null,id:i};
    });
    Q[0].key = 0;
    buildMinHeap(Q);
    while (Q.heapSize > 0) {
        let u = heapExtractMin(Q);
        if (u.pi!==null) MST.push([u.pi,u.id,u.key]);
        for (let i = 0; i < Q.heapSize; i++) {
            let w = Similarity(vertexArray[u.id],vertexArray[Q[i].id]);
            if (w!==null && w < Q[i].key) {
                Q[i].pi = u.id;
                Q[i].key = w;
            }
        }
    }
    return MST;
}

function buildMinHeap(array) {
    array.heapSize = array.length;
    let N = Math.floor(array.length/2)-1;
    for (let i = N; i >= 0; i--) {
        minHeapify(array,i);
    }
}

function minHeapify (array,i) {
    let l = 2*i+1;
    let r = 2*(i+1);
    let smallest = null;
    if (l < array.heapSize && array[l].key < array[i].key) smallest = l;
    else smallest = i;
    if (r < array.heapSize && array[r].key < array[smallest].key) smallest = r;
    if (smallest !== i) {
        let sp = array[i];
        array[i] = array[smallest];
        array[smallest] = sp;
        minHeapify(array,smallest);
    }
}

function heapExtractMin (array) {
    let m = null;
    if (array.heapSize >= 1) {
        m = array[0];
        array[0] = array[array.heapSize-1];
        array.heapSize = array.heapSize - 1;
        minHeapify(array,0);
    }
    return m;
}

function Similarity (point1,point2) {
    let s = null;       // return null if point1.length !== point2.length
    let N = point1.length;
    if (N === point2.length) {
        let d = [];
        for (let i = 0; i < N; i++) {
            d[i] = point2[i] - point1[i];
        }
        s = 0;
        d.forEach(e=>{
            s = s + e*e;
        });
        s = Math.sqrt(s);
    }
    return s;
}