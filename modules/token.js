
import roles from '../data/tokens.json' assert {type: 'json'}
import Position from './position.js';

export const Viability = {
    ALIVE: 0,
    DEADVOTE: 1,
    DEAD: 2
}

const WIDTH = 150;
const HEIGHT = 150;

class TokenCreationError extends Error {
    constructor(token) {
        super(token + " is not defined in the token sheet");
    }
}

export class Token {
    #role; // role e.g. Alchemist, Amnesiac
    #uid; // unique number to differenciate duplicate tokens
    #name; // name associated with this token
    #viability; // are they alive, dead, or dead w/ a vote
    #position; // position class relative to (0, 0)
    #html; // html element in DOM
    
    getPosition() {return this.#position}
    getViability() {return this.#viability}
    getRole() {return this.#role}
    getUid() {return this.#uid}
    getName() {return this.#name}
    getHTMLElement() {return this.#html}
    
    generateTokenDom() {
        let template = document.querySelector("#token");
        let container = template.content.cloneNode(true).querySelector(".token-container");
        container.style.top = this.#position.getLeft() + "px";
        container.style.left = this.#position.getLeft() + "px";
        container.style.height = HEIGHT + "px";
        container.style.width = WIDTH + "px";
        container.style.backgroundImage = "url('./assets/roles/" + this.#role + "_token.png')";
        document.querySelector("active").appendChild(container);
        container.addEventListener("drag", this.drag.bind(null, this));
        return container;
    }
    
    drag(token, event) {
        console.log(event)
        event.preventDefault()
        if (event.screenX!=0&&event.screenY!=0) {
            console.log(event.movementX)
            token.move(event.screenX, event.screenY, event);
        }
    }
    
    move(left, top, offsetLeft=0, offsetTop=0) {
        this.#position.setPos(left, top)
        this.#html.style.left = this.#position.getLeft() + "px";
        this.#html.style.top = this.#position.getTop() + "px";
    }
    
    constructor(role = "") {
        if (!roles[role]) {throw new TokenCreationError(role)}
        this.#role = role;
        this.#uid = window.UIDGenerator.next().value;
        this.#name = "";
        this.#viability = Viability.ALIVE;
        this.#position = new Position();
        this.#position.setCenter(WIDTH, HEIGHT);
        this.#html = this.generateTokenDom();
    }
}