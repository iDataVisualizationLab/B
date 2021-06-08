/*
INPUT:
list: linked list to find next edge
map: to map node to index of the list
node: current node
limit: store value of edge weight for comparison
pointer: pointer to result

OUTPUT: no output
*/

function runt_graph (list,map,node,limit,pointer) {
    if (map.has(node)) {
        let index = map.get(node);
        let current = list[index].head;
        while (current) {
            let child = current.element.node;
            let weight = current.element.weight;
            if (weight < limit) {
                pointer.size++;
                pointer.max = (pointer.max < weight) ? weight : pointer.max;
                runt_graph(list,map,child,limit,pointer);
            }
            current = current.next;
        }
    }
}