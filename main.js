

var night_order_ref;

// ? TODO better scripts menu
// TODO fullscreeen settings menu
// TODO better fabled tokens
// ? TODO pip layer clean up prompt delete
// TODO clean up saving and loading 
// * TODO fancify night widget
// * TODO higher player limit to include travellers

//Attatches a token to another token
//Intended to be reminder tokens, but adjusting to allow for character tokens shouldn't be that complicated
function attachTokenToToken(div){
  if (document.getElementById("attach_toggle").style.backgroundColor != "green") return;
  if(div.getAttribute("class") == "reminder drag"){
    const players = document.getElementById("token_layer").getElementsByClassName("role_token");
    const left = parseInt(getComputedStyle(div).getPropertyValue('left'))
    const top =  parseInt(getComputedStyle(div).getPropertyValue('top'))
    for (const player in players) {
      if(!isNaN(parseInt(player))){
        try {
          playerstyle = getComputedStyle(players[player]);
          
          diffx = parseInt(playerstyle.getPropertyValue('left'))+37.5 - left;
          diffy = parseInt(playerstyle.getPropertyValue('top'))+37.5 - top;
          if(Math.sqrt(diffx*diffx + diffy * diffy) < 75){
            players[player].appendChild(div);
            div.style.position = 'relative'
            div.style.left = '-50px'
            div.style.top = '0px'
            //update night order
            populate_night_order()
            return true;
          }
        } catch (error) {console.error(error)}      
      }     
    }
  }
  return false;
}

//night order and jinx


//open and close menu with m key
//could be expanded to allow for more keybinds
document.addEventListener('keydown', function(event) {
  const keyPressed = event.key; // Get the key that was pressed
  if(event.key == 'm'){
    document.getElementById("menu_main").style.transform == "translateX(0px)" ? close_menu() : open_menu();   
  }
});
