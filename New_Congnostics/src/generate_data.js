function make_Data(metric,score) {
  let series_1 = [], series_2 = [], doubly_series = [];
  // high outlying score
  if (metric === 'outlying' && score === 'high') {
    for (let i = 0; i < 50; i++) {
      if (i%7!==0) {
        series_1[i] = i;
        series_2[i] = 49-i;
      } else {
        let j = i/7;
        if (j%2===0) {
          series_1[i] = i+50;
          series_2[i] = 49-i+50;
        } else {
          series_1[i] = i - 50;
          series_2[i] = 49-i-50;
        }
      }
      doubly_series[i] = [series_1[i],series_2[i]];
    }
  }

  // medium outlying score
  if (metric === 'outlying' && score === 'medium') {
    for (let i = 0; i < 50; i++) {
      if (i!==25) {
        series_1[i] = i;
        series_2[i] = 49-i;
      } else {
        series_1[i] = i + 50;
        series_2[i] = 49-i+50;
      }
      doubly_series[i] = [series_1[i],series_2[i]];
    }
  }

  // low outlying score
  if (metric === 'outlying' && score === 'low') {
    for (let i = 0; i < 50; i++) {
      if (i!==25) {
        series_1[i] = i;
        series_2[i] = 49-i;
      } else {
        series_1[i] = i + 10;
        series_2[i] = 49-i+10;
      }
      doubly_series[i] = [series_1[i],series_2[i]];
    }
  }

  // high clumpy score
  if (metric === 'clumpy' && score === 'high') {
    for (let i = 0; i < 50; i++) {
      if (i < 25) {
        series_1[i] = Math.random()*10;
        series_2[i] = Math.random()*10;
      } else {
        series_1[i] = 50 + Math.random()*10;
        series_2[i] = 50 + Math.random()*10;
      }
      doubly_series[i] = [series_1[i],series_2[i]];
    }
  }

  // medium clumpy score
  if (metric === 'clumpy' && score === 'medium') {
    for (let i = 0; i < 50; i++) {
      if (i < 25) {
        series_1[i] = Math.random()*10;
        series_2[i] = Math.random()*10;
      } else {
        series_1[i] = 10 + Math.random()*10;
        series_2[i] = 10 + Math.random()*10;
      }
      doubly_series[i] = [series_1[i],series_2[i]];
    }
  }

  // // high striated score
  // if (metric === 'striated' && score === 'high') {
  //   for (let i = 0; i < 50; i++) {
  //     series_1[i] = Math.sin(i/20);
  //     series_2[i] = i;
  //     doubly_series[i] = [series_1[i],series_2[i]];
  //   }
  // }

  // high striated score
  if (metric === 'striated' && score === 'high') {
    for (let i = 0; i < 50; i++) {
      if (i === 0) {
        series_1[i] = 0;
        series_2[i] = 0;
      } else if (i%25!==0) {
        series_1[i] = series_1[i-1]+1;
        series_2[i] = series_2[i-1]+2;
      }  else {
        series_1[i] = series_1[i-1]-30;
        series_2[i] = series_2[i-1]-30;
      }
      doubly_series[i] = [series_1[i],series_2[i]];
    }
  }

  // // medium striated score
  // if (metric === 'striated' && score === 'medium') {
  //   for (let i = 0; i < 50; i++) {
  //
  //     doubly_series[i] = [series_1[i],series_2[i]];
  //   }
  // }

  return doubly_series;
}
