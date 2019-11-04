class CountryData {
    /**
     *
     * @param type refers to the geoJSON type- countries are considered features
     * @param properties contains the value mappings for the data
     * @param geometry contains array of coordinates to draw the country paths
     * @param region the country region
     */
    constructor(type, id, properties, geometry, region) {

        this.type = type;
        this.id = id;
        this.properties = properties;
        this.geometry = geometry;
        this.region = region;


    }
}




class Map {
    /**
     * Creates a Table Object
     */
    constructor(data) {
        this.data = data;
        this.projection = null;



        this.initMap();

        console.log("map constructor called");
    }

    initMap(){


        console.log("init map called")
//

        d3.json("data/us-states.json")
            .then(function(json){
                {

                    console.log("json loaded");


                    //Width and height of map
                    var width = 960;
                    var height = 500;

// D3 Projection
                    let projection = d3.geoAlbersUsa()
                        .translate([width / 2, height / 2])    // translate to center of screen
                        .scale([1000]);          // scale things down so see entire US

// Define path generator
                    let path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
                        .projection(projection);  // tell path generator to use albersUsa projection


                    console.log("path", path);

                    console.log("projection", projection);


//Create SVG element and append map to the SVG
                    let svg = d3.select("#mapSvg")
                        .attr("width", width)
                        .attr("height", height);


// Load GeoJSON data and merge with states data


// Bind the data to the SVG and create one path per GeoJSON feature
                    svg.selectAll("path")
                        .data(json.features)
                        .enter()
                        .append("path")
                        .attr("d", path)
                        .style("stroke", "#fff")
                        .style("stroke-width", "1")

                }

            });







    }


}
