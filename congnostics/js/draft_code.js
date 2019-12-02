d3.csv("data/SP500_39years.csv").then(function (data) {
    var sample = [];
    var samplecode = 0;;
    var array = [];
    for (var i = 0; i < 6; i++) {
        array[i] = [];
    }
    sample[samplecode] = "1980";
    var writedata = [];
    var row = -1;
    var col = 0;
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
        var j = 0;
        if(array[0][j][0] !== index || index === 0) {
            row += 1;
            writedata[row] = [];
            writedata[row][0] = String()
        }
        while (array[0][j][0] === index) {
            for (var i = 0; i < 6; i++) {
                writedata[row][col] = array[i][j][1];
                if (i === 5) col += 1;
            }
        }
    });
    console.log(array);
    console.log(writesample);
});
