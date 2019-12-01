
let that = this;
let fileMap = {
    "yebsap": {file: "data/yebsap.json", color: "blue"},
    "rufhum": {file: "data/rufhum.json", color: "red"},
    "henspa": {file: "data/henspa.json", color: "green"},
    "killde": {file: "data/killde.json", color: "green"},
    "moublu": {file: "data/moublu.json", color: "green"},
    "baleag": {file: "data/baleag.json", color: "green"},
    //"sancra": {file: "data/sancra.json", color: "green"},
    "coohaw": {file: "data/coohaw.json", color: "green"},
    "amekes": {file: "data/amekes.json", color: "green"},
    "wooduc": {file: "data/wooduc.json", color: "green"},
}

let allSpecies = [
    "yebsap", 
    "rufhum", 
    "henspa",
    "killde",
    "moublu",
    "baleag",
    //"sancra",
    "coohaw",
    "amekes",
    "wooduc",
]

let nameDict = 
{
    "yebsap": "Yellow-bellied Sapsucker", 
    "rufhum": "Rufous Hummingbird", 
    "henspa": "Henslow's Sparrow",
    "killde": "Killdeer",
    "moublu": "Mountain Bluebird",
    "baleag": "Bald Eagle",
    //"sancra": "Sandhill Crane",
    "coohaw": "Cooper's Hawk",
    "amekes": "American Kestrel",
    "wooduc": "Wood Duck",
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
    .attr("id", d => d + "Button")
    .attr("value", d => nameDict[d])
    .on("click", d => {
        console.log("You just clicked a button", d3.event.srcElement.checked, "#" + d + "Label")

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
                let removedBird = birdButtonQueue.dequeue();
                d3.select("#" + removedBird + "Label").classed("btn-primary", false)
                d3.select("#" + removedBird + "Label").classed("btn-secondary", true)
                d3.select("#" + removedBird + "Button").property("checked", false)

                birdButtonQueue.enqueue(d);
            }
        }
        console.log(birdButtonQueue.items)
        if (d3.select("#" + d + "Label").classed("btn-primary"))
        {
            d3.select("#" + d + "Label").classed("btn-primary", false)
            d3.select("#" + d + "Label").classed("btn-secondary", true)
        }
        else
        {
            d3.select("#" + d + "Label").classed("btn-secondary", false)
            d3.select("#" + d + "Label").classed("btn-primary", true)
        }

        //Update displays with newly selected birds.
        that.map.updateMap(birdButtonQueue.items);
        that.chart.updateSelectedSpecies(birdButtonQueue.items);
    })
    // .append("img")
    // .attr("src", d => "img/" + d + ".jpg")
    // .attr("width", "75")
    // .attr("height", "75")

d3.select("#henspaButton").property("checked", true)
//console.log("We set henspa to", d3.select("#henspaButton").property("checked"))


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
    this.map = new Map(birdButtonQueue.items, speciesDict, nameDict);
    this.chart = new lineChart(allSpecies, speciesDict, nameDict);
    map.setLineChart(lineChart);
    chart.setMap(map);
})





