/*
INPUT:
Tree: array of edges
Each edge: objects with three attributes: parent: index of parent node, child: index of child node, weight

OUTPUT:
score: clumpy score from 0 to 1
bridge: index of the longest bridge connecting clusters
*/

function clumpy (Tree) {
    let result = {score: 0, bridge: undefined};
    // build linked list for backward side and forward size
    let enteringList = [];
    let nodeToIndex_entering = new Map();
    let outgoingList = [];
    let nodeToIndex_outgoing = new Map();
    let count = 0;
    for (let i = 0; i < Tree.length; i++) {
        let parent = Tree[i].parent;
        let child = Tree[i].child;
        let weight = Tree[i].weight;
        nodeToIndex_entering.set(child,i);
        enteringList[i] = new LinkedList();
        enteringList[i].add({node: parent, weight: weight});
        if (!nodeToIndex_outgoing.has(parent)) {
            nodeToIndex_outgoing.set(parent,count);
            outgoingList[count] = new LinkedList();
            outgoingList[count].add({node: child, weight: weight});
            count += 1;
        } else {
            outgoingList[nodeToIndex_outgoing.get(parent)].add({node: child, weight: weight});
        }
    }
    // check every edge
    for (let i = 0; i < Tree.length; i++) {
        let parent = Tree[i].parent;
        let child = Tree[i].child;
        let weight = Tree[i].weight;
        let backward = {size: 0, max: -Infinity};
        runt_graph(enteringList,nodeToIndex_entering,parent,weight,backward);
        let forward = {size: 0, max: -Infinity};
        runt_graph(outgoingList,nodeToIndex_outgoing,child,weight,forward);
        if (backward.size > 0 && forward.size > 0) {
            if (backward.size < forward.size) {
                let score = 1 - backward.max/weight;
                if (score > result.score) {
                    result.score = score;
                    result.bridge = i;
                }
            } else if (forward.size < backward.size) {
                let score = 1 - forward.max/weight;
                if (score > result.score) {
                    result.score = score;
                    result.bridge = i;
                }
            } else {
                let maxWeight = (forward.max > backward.max) ? forward.max : backward.max;
                let score = 1 - maxWeight/weight;
                if (score > result.score) {
                    result.score = score;
                    result.bridge = i;
                }
            }
        }
    }
    return result;
}