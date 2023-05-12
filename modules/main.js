
import {Token} from './token.js'
import uid from './uid.js'

window.UIDGenerator = uid();

console.log(new Token("alchemist"));
console.log(new Token("alchemist"));
console.log(new Token("alchemist"));



document.getElementById("debug").addEventListener("click", debug);
function debug() {
    console.log("test")
}

function setTokensCanDrag(x) {}