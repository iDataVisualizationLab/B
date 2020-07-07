class SortAlgorithms {
    constructor() {
    }

    // Bubble sort
    // non-decreasing order
    // array: [[e0,e1,e2,...],...]
    // index: index of element for sorting in the sub-array [e0,e1,e2,...]
    static BubbleSort (array,index) {
        for (let i = 0; i < array.length-1; i++) {
            for (let j = 0; j < array.length-i-1; j++) {
                if (array[j][index] > array[j+1][index]) {
                    let support = [];
                    support = array[j].map(e=>e);
                    array[j] = [];
                    array[j] = array[j+1].map(e=>e);
                    array[j+1] = [];
                    array[j+1] = support.map(e=>e);
                }
            }
        }
    }

    // Merge sort
    // non-decreasing order
    // array: [[e0,e1,e2,...],...]
    // index: index of element for sorting in sub-array [e0,e1,e2,...]
    static MergeSort (array,index) {
        SortAlgorithms.sort_MergeSort(array,index,0,array.length-1);
    }
    // function merge of merge sort
    static Merge (array,index,left,mid,right) {
        // Find sizes of two sub-arrays to be merged
        let n1 = mid-left+1;
        let n2 = right-mid;
        // Create temp arrays
        let L = [], R = [];
        // Copy data to temp arrays
        for (let i = 0; i < n1; i++) {
            L[i] = array[left+i].map(e=>e);
        }
        for (let j = 0; j < n2; j++) {
            R[j] = array[mid+1+j].map(e=>e);
        }
        // Merge the temp arrays
        // Initial indexes of first and second sub-arrays
        let i = 0, j = 0;
        // Initial index of merged array
        let k = left;
        while (i < n1 && j < n2) {
            if (L[i][index] <= R[j][index]) {
                array[k] = [];
                array[k] = L[i].map(e=>e);
                i += 1;
            } else {
                array[k] = [];
                array[k] = R[j].map(e=>e);
                j += 1;
            }
            k += 1;
        }
        // Copy remaining elements of L if any
        while (i < n1) {
            array[k] = [];
            array[k] = L[i].map(e=>e);
            i += 1;
            k += 1;
        }
        // Copy remaining elements of R if any
        while (j < n2) {
            array[k] = [];
            array[k] = R[j].map(e=>e);
            j += 1;
            k += 1;
        }
    }
    // sort function of Merge Sort
    static sort_MergeSort (array,index,left,right) {
        if (left < right) {
            // find the middle point
            let mid = Math.floor((left+right)/2);
            // sort first and second halves
            SortAlgorithms.sort_MergeSort(array,index,left,mid);
            SortAlgorithms.sort_MergeSort(array,index,mid+1,right);
            // merge the sorted halves
            SortAlgorithms.Merge(array,index,left,mid,right);
        }
    }
}