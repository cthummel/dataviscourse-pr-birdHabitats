/* eslint-disable */
<template>
  <div id="app">
      <div>
    <div id="header-wrap">
      <header>
        <h1>Bird Habitat and Population Trends</h1>
        <div>Will Richards, Corin Thummel</div>

        <br>
        <h4>Select a species to visualize</h4>
        <v-select                class="vs__dropdown-toggle"
                                  v-model="selectedSpecies" :options="allSpecies"> </v-select>
      </header>



      <br>
      <Map :demoData="demoData" :selectedSpecies="selectedSpecies"></Map>


    </div>



    </div>
  </div>
</template>

<script>
import BubbleChart from './components/BubbleChart.vue'
import Map from './components/Map.vue'
import ParallelCoords from './components/ParallelCoords'


export default {
  name: 'app',
  components: {
    BubbleChart,
    Map,
    ParallelCoords
  },

  data() { return {
    allSpecies: ["Yellow-bellied Sapsucker"],
    selectedSpecies: null,

    allYears: ["2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018"],
    selectedYear: null,

    demoData: null,
    }
  },
  methods : {

    initWithDemoData(){

      this.selectedYear = "2018";
    },

    buildDemoData(){

      let self = this;

      d3.json("geoJSONBALDIE.geojson", function(d) {
        


      }).then(function(data){ console.log("here is geojson", data.features);});

      //thank gosh d3 properly handles the whitespace
      d3.dsv("\t", "smallTest.txt", function(d) {

        return {
          commonName: d['COMMON NAME'],
          lat: parseFloat(d.LATITUDE),
          long: parseFloat(d.LONGITUDE),
          count: d['OBSERVATION COUNT'],
            date: d['LAST EDITED DATE'],

        };

      }).then(function(data) {
        self.demoData = data;

      });
    }

  },

  beforeMount(){
    this.buildDemoData();
  },

  mounted() {

  },
  watch : {

    demoData: function(){
      this.initWithDemoData();
    }

  }
}
</script>

<style>

  #app{
    width: 100%;
    height: 100%;
  }


  #header-wrap{
      margin: 10px;
  }




</style>


