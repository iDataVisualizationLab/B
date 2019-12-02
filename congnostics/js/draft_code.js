d3.csv("data/SP500_39years.csv").then(function (data) {
    var sample = [];
    var samplecode = 0;;
    var array = [];
    for (var i = 0; i < 6; i++) {
        array[i] = [];
    }
    sample[samplecode] = "1980";
    var writedata = [];
    data.forEach(function (value,index) {
        if(value["Date"].substr(value["Date"].length-4,4) !== sample[samplecode-1]) {
            sample[samplecode] = value["Date"].substr(value["Date"].length-4,4);
            samplecode += 1;
        }
        array[0][index] = [samplecode,value["Open"]];
        array[1][index] = [samplecode,value["High"]];
        array[2][index] = [samplecode,value["Low"]];
        array[3][index] = [samplecode,value["Close"]];
        array[4][index] = [samplecode,value["Adj Close"]];
        array[5][index] = [samplecode,value["Volume"]];
    });
    var writesample = [];
    sample.forEach(function (value,index) {
        writesample[index] = [index,value];
        var j = 0
    });
    console.log(array);
    console.log(writesample);
});
