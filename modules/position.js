

export default class Position {
    #left;
    #top;
    #movable;
    
    setPos(left, top) {
        this.#left = left;
        this.#top = top;
    }
    
    setMovable(x) {
        this.#movable = x;
    }
    
    getTop() {return this.#top}
    getLeft() {return this.#left}
    
    constructor(left = 0, top = 0, movable = true) {
        this.#left = left;
        this.#top = top;
        this.#movable = true;
    }
    
    setCenter(width, height) {
        this.#left = document.documentElement.clientWidth/2 - width/2;
        this.#top = document.documentElement.clientHeight/2 - height/2;
    }
    
    getPosRelative(parent) {
        const parentRect = parent.getBoundingClientRect();
        var result = new Object();
        result.left = this.#left - parentRect.left;
        result.top = this.#top - parentRect.top;
        return result;
    }
}