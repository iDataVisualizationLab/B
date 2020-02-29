let experiment ={
    data: {},
    dataRaw: {},
    dataSmooth: {},
    dataSmoothRaw: {},
    firstDifference: {},
    timeInfo: [],
    instanceInfo: [],
    variableInfo: [],
    loop: {},
    highLoop: [],
    sliding: 3,
    alpha: 10,
    colorList: ['#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928'],
    window_size: [window.innerWidth,window.innerHeight],
    test: [],
    limit: [
        'Mining, Logging',
        'Wholesale Trade',
        'Retail Trade',
        'Finance and Insurance',
        'Educational Services',
        'Private Service Providing',
        'State Government',
        'Local Government',
        'Health Care, Social Assistance',
        'Durable Goods',
        'Non-Durable Goods',
        'Administrative and Support and Waste Management and Remediation Services',
    ]
};