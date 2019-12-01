### Data Vizualization Final Project:
 #### Avian habitat and population loss interactice web app
 
 ```Will Richards, Corin Thummel```




## Run project
To view the project either clone the repository and run:

```python3 -m http.server 8080```

Or visit:

```https://cthummel.github.io/dataviscourse-pr-birdHabitats/```


## File Structure

The basic file structure for the project is handled through three folders:
`data`, `img` and `js`.

The `data` folder contains our data sets we use for the nine birds included in the visualization. Each data set is composed 70,000 observations with yearly caps of 12,000 observations. The python script, `generateData.py`, for generating these data sets is included in this folder. However, since the background data set we are pulling these subsets from is over 90Gb in size, it is not included in this repository.

The `img` folder contains pictures of each bird. The initial plan was to include these pictures in the visualization to help the user get a feel for what each bird is like but unfortuately we ran out of time.

The `js` folder contains all the code that runs the website itself. The core script is `js/script.js`. This javascript file calls and maintains the map and line chart views as are described in `js/map.js` and `js/linechart.js` files respectively.

Finally, the html for the website is contained in `index.html` and the corresponding css styling is done through `styles.css`. The html also includes a link to d3 and bootstrap which were used extensively though the coding process.
