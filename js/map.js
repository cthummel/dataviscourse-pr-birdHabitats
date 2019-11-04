class Map {

    constructor(data) {
        this.data = data;
        this.projection = null;
        this.width = 960;
        this.height = 500;

        this.initMap();
    }

    initMap() {

        //bind 'this' context to variable so we can use Map class variables inside promise
        let self = this;

        d3.json("data/us-states.json")
            .then(function (json) {
                {
                    let projection = d3.geoAlbersUsa()
                        .translate([self.width / 2, self.height / 2])
                        .scale([1000]);


                    let path = d3.geoPath()
                        .projection(projection);

                    let svg = d3.select("#mapSvg")
                        .attr("width", self.width)
                        .attr("height", self.height);

                    let maxObs = d3.max(self.data, function(d) { return +d.count;} );

                    console.log("maxObs", maxObs);


                    let obsScale = function(count){

                        if(typeof count !== "number")
                        {
                            return 1/maxObs*2;
                        }
                        else{
                            return count/maxObs*2;
                        }
                    }

                    svg.selectAll("path")
                        .data(json.features)
                        .enter()
                        .append("path")
                        .attr("d", path)
                        .style("fill", "white")
                        .style("stroke", "black")
                        .style("stroke-width", "1");

                    svg.selectAll("circle")
                        .data(self.data)
                        .join("circle")

                        .attr("cx", function (d) {
                            return projection([d.long, d.lat])[0];
                        })
                        .attr("cy", function (d) {
                            return projection([d.long, d.lat])[1];
                        })
                        .attr("r", 5)
                        .style("fill", "blue")
                        .style("opacity", d => obsScale(d.count))
                        .on("mouseover", d => console.log("Observation count:", d.count));
                }
            });
    }
}
