import json
import numpy as np
import math, sys, getopt, gzip, random


def read(path, species, sampleSize):
    reval = []
    yearCounts = {}
    upperYearCountLimit = 12000
    for year in np.arange(2010,2019):
        yearCounts[year] = 0
    print(yearCounts)

    if path[-3:] == ".gz":
        with gzip.open(path, mode='rt') as f:
            for line in f:
                birdData = {}
                s = line.split('\t')
                
                
                if(len(reval) == sampleSize):
                    break
                if(s[4] != species):
                    continue
                if(s[8] == "X"):
                    continue
                year = int(s[1].split(" ")[0].split("-")[0])
                if(year < 2010 or year > 2018):
                    continue
                if (yearCounts[year] >= upperYearCountLimit):
                    continue
                if(len(reval) % 1000 == 0):
                    print("Total entries: ", len(reval))

                yearCounts[year] += 1
                birdData["date"] = s[1].split(" ")[0]
                birdData["birdCode"] = s[4]
                birdData["count"] = s[8]
                birdData["countyID"] = s[17]
                birdData["lat"] = s[25]
                birdData["long"] = s[26]
                birdData["obsDur"] = s[34]
                reval.append(birdData)

    
    return reval

def main(argv):
    opts, args = getopt.getopt(argv, "hf:s:o:", ["file=", "species=", "outfile="])
    for opt, arg in opts:
        if opt == '-h':
            print("I need help too.")
            sys.exit(1)
        elif opt in ('-f', 'file='):
            fileName = arg
        elif opt in ('-s', 'species='):
            species = arg
        elif opt in ('-o', 'outfile='):
            outfile = arg
    
    sampleSize = 70000
    print("Species", species)


    data = read(fileName, species, sampleSize)

    with open(outfile, "w") as write_file:
        json.dump(data, write_file)

    
            


if __name__ == '__main__':
      main(sys.argv[1:])