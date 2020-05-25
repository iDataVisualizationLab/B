DesignApplication.MainView();
Management.LoadAndComputation('data/US_employment_new.txt','data/stateCode.txt','data/Industrycode_reduced.txt','BLS');
codeManager.needRepeat = setInterval(Management.Visualization,1000);
DesignApplication.ControlPanel('leftSide','controlPanel');