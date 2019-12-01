class semiQueue {

    constructor()
    {
        this.items = []
    }

    /**
     * Adds commonName of a bird to the queue.
     * @param bird commonName of bird to add.
     */
    enqueue(bird)
    {
        let birdPresent = false
        for(var i = 0; i < this.items.length; i++)
        {
            if (this.items[i] == bird)
            {
                birdPresent = true;
            }
        }  
        if(!birdPresent)
        {
            this.items.push(bird);
        }
    }

    /**
     * Removes and returns the commonName of oldest bird to the queue.
     */
    dequeue()
    {
        return this.items.shift()
    }

    /**
    *  Checks if the queue is empty.
    */
    isEmpty()
    {
        return this.items.length == 0;
    }

    /**
     * Removes a bird from anywhere in the queue and shifts remaining birds up.
     * @param bird commonName of bird to remove
     */
    removeBird(bird)
    {
        let birdPresent = false;
        let birdIndex = 0;
        for(var i = 0; i < this.items.length; i++)
        {
            if(this.items[i] == bird)
            {
                birdPresent = true;
                birdIndex = i;
            }
        }
        if(birdPresent)
        {
            for(var i = birdIndex + 1; i < this.items.length; i++)
            {
                this.items[i - 1] = this.items[i];
            }
            this.items.pop();
        }
        else
        {
            console.log("Tried to remove", bird, "which isnt currently selected.")
        }
    }

}