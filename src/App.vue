<template>
  <div id="app">
      <div>
    <div id="header-wrap">
      <header>
        <h1>Bird Habitat and Population Trends</h1>
        <div>Will Richards, Corin Thummel</div>

        <br>
        <h4>Select a species to visualize</h4>
        <v-select              multiple
                                  v-model="selectedSpecies" :options="allSpecies" filled chips multipl> </v-select>
      </header>



      <br>
      <div id="mainDisplay">
        <Map @update-species-dict="updateSpeciesDict" :selectedSpecies="selectedSpecies"></Map>
        <LineChart :selectedSpecies="selectedSpecies" :speciesDict="speciesDict"></LineChart>
      </div>
      


    </div>



    </div>
  </div>
</template>

<script>
import BubbleChart from './components/BubbleChart.vue'
import Map from './components/Map.vue'
import LineChart from './components/LineChart.vue'
import ParallelCoords from './components/ParallelCoords'

export default {
  name: 'app',
  components: {
    BubbleChart,
    Map,
    LineChart,
    ParallelCoords
  },

  data() { return {
    allSpecies: ["Yellow-bellied Sapsucker", "Rufous Hummingbird", "Henslow's Sparrow"],
    selectedSpecies: [],
    speciesDict: {},
    }
  },
  methods : {

    logFileJson(){

      d3.dsv("\t", "data/rufhum50k.txt", function(d) {
        return {
          commonName: d['COMMON NAME'],
          lat: parseFloat(d.LATITUDE),
          long: parseFloat(d.LONGITUDE),
          count: d['OBSERVATION COUNT'],
          date: d['LAST EDITED DATE'],
          obsDur: d['DURATION MINUTES']
        };
      }).then(function(data) {
        // self.demoData = data;

        let log = JSON.stringify(data);
        console.log("log", log);
      });

    },

    updateSpeciesDict(e)
    {
      console.log("speciesDict Arrived", e, Object.getOwnPropertyDescriptors(e))

      this.speciesDict = e;
      console.log("the new speciesDict", this.speciesDict)
    },


  },

  beforeMount(){
    // this.logFileJson();
  },

  mounted() {



  },
  watch : {


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

  #mainDisplay{
    display: flex;
  }




</style>


