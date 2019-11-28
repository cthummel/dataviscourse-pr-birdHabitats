

let fileMap = {
    "Yellow-bellied Sapsucker": {file: "data/yebsap50k.json",color: "blue"},
    "Rufous Hummingbird": {file: "data/rufhum50k.json", color: "red"},
    "Henslow's Sparrow": {file: "data/henspa.json", color: "green"}
}

let allSpecies = [
    "Yellow-bellied Sapsucker", 
    "Rufous Hummingbird", 
    "Henslow's Sparrow"
]

let buildYearDict = function(data) {
    let yearsGen = function (start, stop) {
      let years = [];
      while (start <= stop) {
        years.push(start++);
      }
        return years;
    };

    let yearDict = {};
    let years = yearsGen(2010, 2018);

    for (let i = 0; i < years.length; i++) {
      let yearObservations = data.filter(d => d.date.slice(0, 4) === years[i].toString());
      //console.log("yearObservations.length", yearObservations.length)
      yearDict[years[i]] = yearObservations.slice(0, yearObservations.length);
    }
    //console.log("yearDict", yearDict);
    return yearDict;
}

let promises = [];
let speciesDict = {};

for (let i = 0; i < allSpecies.length; i++) {
    let species = allSpecies[i];
    let file = fileMap[species].file;
    let p = new Promise((resolve) => {
        d3.json(file).then(function (data) {
            //console.log("data", data);
            // data = self.filterByObsDur(data);
            //let yearDict = ;
            resolve(speciesDict[species] = buildYearDict(data));
        });
    });
    promises.push(p);
}
Promise.all(promises).then(values => {
    console.log("values", values);
    //self.initBool = true;// [3, 1337, "foo"]
    //self.initSelectedData();
    //let map = new Map(["Henslow's Sparrow"], speciesDict);
    //let chart = new lineChart(["Henslow's Sparrow"], speciesDict);
    let map = new Map(allSpecies, speciesDict);
    let chart = new lineChart(allSpecies, speciesDict);
    map.setLineChart(lineChart);
    chart.setMap(map);
})
console.log(speciesDict)




