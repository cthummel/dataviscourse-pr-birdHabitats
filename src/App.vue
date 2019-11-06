<template>
  <div id="app">
    <div id="header-wrap">
      <header>
        <h1>Bird Habitat and Population Trends</h1>
        <div>Will Richards, Corin Thummel</div>
        <Map :demoData="demoData" :selectedSpecies="selectedSpecies" :selectedYear="selectedYear"></Map>
      </header>
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
    allSpecies: [],
    selectedSpecies: [],

    allYears: ["2007", "2008", "2009", "2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018"],
    selectedYear: null,

    demoData: null,
    }
  },
  methods : {

    initWithDemoData(){
      this.selectedSpecies = [];
      this.selectedSpecies.push("Yellow-bellied Sapsucker")

      this.selectedYear = "2018";
    },

    buildDemoData(){

      let self = this;

      //thank gosh d3 properly handles the whitespace
      d3.dsv("\t", "smallTest.txt", function(d) {

        // console.log("d", d);

        return {
          commonName: d['COMMON NAME'],
          lat: parseFloat(d.LATITUDE),
          long: parseFloat(d.LONGITUDE),
          count: d['OBSERVATION COUNT']
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

</style>


