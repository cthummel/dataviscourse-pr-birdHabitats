
let that = this;
let fileMap = {
    "yebsap": {file: "data/yebsap50k.json",color: "blue"},
    "rufhum": {file: "data/rufhum50k.json", color: "red"},
    "henspa": {file: "data/henspa.json", color: "green"},
    "killde": {file: "data/killde.json", color: "green"},
    "moublu": {file: "data/moublu.json", color: "green"},
    "baleag": {file: "data/baleag.json", color: "green"},
}

let allSpecies = [
    "yebsap", 
    "rufhum", 
    "henspa",
    "killde",
    "moublu",
    "baleag",
]

let nameDict = 
{
    "yebsap": "Yellow-bellied Sapsucker", 
    "rufhum": "Rufous Hummingbird", 
    "henspa": "Henslow's Sparrow",
    "killde": "Killdeer",
    "moublu": "Mountain Bluebird",
    "baleag": "Bald Eagle",
}




let birdButtonQueue = new semiQueue();
birdButtonQueue.enqueue("henspa")

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

//Setup button array
d3.select("#birdButtonArray").selectAll("label").data(allSpecies).join("label")
    .attr("class", d => d == "henspa" ? "btn btn-primary active": "btn btn-secondary")
    .attr("id", d => d + "Label")
    .attr("for", d=> d + "Button")
    .append("input")
    .attr("type", "button")
    .attr("name", d => d + "Button")
    .attr("value", d => nameDict[d])
    .on("click", d => {
        console.log("You just clicked a button", d3.event, d3.select("#" + d + "Label"))
        console.log(birdButtonQueue.items)
        d3.select("#" + d + "Label").classed("active") ? d3.select("#" + d + "Label").attr("class", "btn btn-primary active"): d3.select("#" + d + "Label").attr("class", "btn btn-secondary")

        if(d3.event.srcElement.checked)
        {
            birdButtonQueue.removeBird(d);
        }
        else
        {
            if(birdButtonQueue.items.length < 3)
            {
                birdButtonQueue.enqueue(d);
            }
            else
            {
                birdButtonQueue.dequeue();
                birdButtonQueue.enqueue(d);
            }
        }

        //Update displays with newly selected birds.
        that.map.updateMap(birdButtonQueue.items);
        that.chart.updateSelectedSpecies(birdButtonQueue.items);
    })



let promises = [];
let speciesDict = {};

for (let i = 0; i < allSpecies.length; i++) {
    let species = allSpecies[i];
    let file = fileMap[species].file;
    let p = new Promise((resolve) => {
        d3.json(file).then(data => 
            //console.log("data", data);
            // data = self.filterByObsDur(data);
            //let yearDict = ;
            resolve(speciesDict[species] = buildYearDict(data))
        );
    });
    promises.push(p);
}
Promise.all(promises).then(values => {
    console.log("values", values);
    //self.initBool = true;// [3, 1337, "foo"]
    //self.initSelectedData();
    //let map = new Map(["Henslow's Sparrow"], speciesDict);
    //let chart = new lineChart(["Henslow's Sparrow"], speciesDict);
    this.map = new Map(birdButtonQueue.items, speciesDict);
    this.chart = new lineChart(allSpecies, speciesDict);
    map.setLineChart(lineChart);
    chart.setMap(map);
})





