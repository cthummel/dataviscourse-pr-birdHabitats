class Map {

    constructor(data) {
        this.data = data;
        this.projection = null;
        this.activeYear = 2016;
        this.activeSeason = d3.scaleTime().domain([new Date(this.activeYear, 1, 1), new Date(this.activeYear, 12, 31)]).range([0,100])
        this.width = 960;
        this.height = 500;

        console.log(this.activeSeason(new Date(this.activeYear, 2, 15)))

        this.initMap();
        this.initializeSliders()
        this.drawYearBar()
    }

    initMap() {

        //bind 'this' context to variable so we can use Map class variables inside promise
        let self = this;

        d3.json("data/custom.geo.json")
            .then(function (json) {
                {
                    let projection = d3.geoAlbersUsa()
                        .translate([self.width / 2, self.height / 2])
                        .scale([1000]);

                    let mercProj = d3.geoAlbers()
                                .center([50, 40])
                                .rotate([105, 0])
                                .parallels([35, 55])
                                .scale(370)
                                .translate([self.width / 2, self.height / 2]);


                    let path = d3.geoPath()
                        .projection(mercProj);

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

                    //Could something like this work for the opacity scale?
                    //let tempScale = d3.scaleLinear().domain([minObs, maxObs]).range([.2, 1]);

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
                            return mercProj([d.long, d.lat])[0];
                        })
                        .attr("cy", function (d) {
                            return mercProj([d.long, d.lat])[1];
                        })
                        .attr("r", 5)
                        .style("fill", "blue")
                        .style("opacity", d => obsScale(d.count))
                        .on("mouseover", d => console.log("Observation count:", d.count));
                }
            });
    }

    initializeSliders()
    {
        d3.select("body").append("svg")
                         .attr("width", this.width)
                         .attr("height", 300).attr("id", "sliderSVG")
                         .attr("translate", "transform(0, " + this.height + ")");

        d3.select('body')
          .append('div').attr('id', 'activeYear-bar');
    }

    drawYearBar() {

        // ******* TODO: PART 2 *******
        //The drop-down boxes are set up for you, but you have to set the slider to updatePlot() on activeYear change

        // Create the x scale for the activeYear;
        // hint: the domain should be max and min of the years (1800 - 2020); it's OK to set it as numbers
        // the plot needs to update on move of the slider

        /* ******* TODO: PART 3 *******
        You will need to call the updateYear() function passed from script.js in your activeYear slider
        */
        let that = this;

        //Slider to change the activeYear of the data
        let yearScale = d3.scaleLinear().domain([1800, 2020]).range([30, 730]);

        let yearSlider = d3.select('#activeYear-bar')
            .append('div').classed('slider-wrap', true)
            .append('input').classed('slider', true)
            .attr('type', 'range')
            .attr('min', 1800)
            .attr('max', 2020)
            .attr('value', this.activeYear);

        let sliderLabel = d3.select('.slider-wrap')
            .append('div').classed('slider-label', true)
            .append('svg');

        let sliderText = sliderLabel.append('text').text(this.activeYear);

        sliderText.attr('x', yearScale(this.activeYear));
        sliderText.attr('y', 25);

        yearSlider.on('input', function() {
            //YOUR CODE HERE 
            that.activeYear = this.value;
            d3.select("#activeYear-bar").select(".slider-wrap").select(".slider-label").select("text").attr("x", yearScale(that.activeYear)).text(that.activeYear)
            //that.updatePlot(that.activeYear, xdrop, ydrop, cdrop);
        });
    }

    displayRaster(birdname, displayType)
    {
        if(displayType == "abundance")
        {

        }
        else if(displayType == "range")
        {

        }
        else
        {

        }
    }


}
