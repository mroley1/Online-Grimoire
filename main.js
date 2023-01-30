


function test() {
    document.getElementsByClassName("menu_toggle")[0].style.rotate = "180deg"
}

function visibility_toggle() {
    var self = document.getElementById("visibility_toggle")
    if (self.style.backgroundColor!="red") {
        self.style.backgroundColor = "red";
        document.getElementById("pip_layer").style.display = "none"
        document.getElementById("token_layer").style.display = "none"
    } else {
        self.style.backgroundColor = "rgb(66, 66, 66)";
        document.getElementById("pip_layer").style.display = "inherit"
        document.getElementById("token_layer").style.display = "inherit"
    }
}

async function get_JSON(path) {
    return await (await fetch("./data/"+path)).json();
}

function move_toggle() {
    var self = document.getElementById("move_toggle")
    if (self.style.backgroundColor == "green") {
        self.style.backgroundColor = "rgb(66, 66, 66)";
    } else {
        self.style.backgroundColor = "green";
    }
}
function recall_reminder_button(id) {
  var reminder = document.getElementById("info_"+id)
  reminder.style.opacity = 1;
  reminder.setAttribute("onclick", "javascript:spawnReminder('"+ id +"')")
  rm = document.getElementById(id);
  rm.parentNode.removeChild(rm);
}
async function infoCall(name) {
    document.getElementById("info_img").style.backgroundImage = "url('assets/roles/"+name+"_token.png')"
    var roleJSON = await get_JSON("tokens/"+name+".json")
    document.getElementById("info_title").innerHTML = roleJSON["name"];
    document.getElementById("info_desc").innerHTML = roleJSON["description"];
    document.getElementById("info_token_landing").innerHTML = ""
    for (var i = 0; i < roleJSON["tokens"].length;i++){
        var div = document.createElement("div");
        div.className = "info_tokens";
        id = roleJSON["tokens"][i]
        div.style.backgroundImage = "url('assets/reminders/"+id+".png')";
        div.id = "info_"+roleJSON["tokens"][i];
        div.style.cursor = "pointer";
        if (document.getElementById(id)!=undefined){
          div.style.opacity = 0.7;
          div.setAttribute("onclick", "javascript:recall_reminder_button('"+ id +"')")
        } else {
          div.setAttribute("onclick", "javascript:spawnReminder('"+ id +"')")
          
        }
        document.getElementById("info_token_landing").appendChild(div);
    }
    document.getElementById("delete_button").setAttribute("onclick", "javascript:remove_token('"+ name +"')")
    document.getElementById("info_box").style.display = "inherit";
}
function spawnReminder(id) {
    var div = document.createElement("div");
    div.classList = "reminder drag";
    div.style = "background-image: url('assets/reminders/"+id+".png'); left: "+(parseInt(window.visualViewport.width/2)-37)+"; top: calc(50% - 37.5px)";
    div.id = id;
    document.getElementById("pip_layer").appendChild(div);
    var reminder = document.getElementById("info_"+id)
    reminder.style.opacity = 0.7;
    reminder.setAttribute("onclick", "javascript:recall_reminder_button('"+ id +"')")

    const dragSpots = document.getElementsByClassName("drag");
    for (var i = 0; i < dragSpots.length; i++) {
        var container = dragSpots[i];
    
        var active = false;
        var currentX;
        var currentY;
        var xOffset = 0;
        var yOffset = 0;
    
        container.addEventListener("touchstart", dragStart, false);
        container.addEventListener("touchend", dragEnd, false);
        container.addEventListener("touchmove", drag, false);
    
        container.addEventListener("mousedown", dragStart, false);
        container.addEventListener("mouseup", dragEnd, false);
        container.addEventListener("mousemove", drag, false);
      }
    
    function dragStart(e) {
      //if (document.getElementById("move_toggle").style.backgroundColor!="green"){return}
      var pos = getComputedStyle(e.target)
      if (e.type === "touchstart") {
        xOffset = e.touches[0].clientX - pos.getPropertyValue('left').match(/\d+/)[0];
        yOffset = e.touches[0].clientY - pos.getPropertyValue('top').match(/\d+/)[0];
      } else {
        xOffset = e.clientX - pos.getPropertyValue('left').match(/\d+/)[0];
        yOffset = e.clientY - pos.getPropertyValue('top').match(/\d+/)[0];
      }
      active = true;
    }
  
    function dragEnd(e) {
      active = false;
    }
  
    function drag(e) {
      if (active) {
      
        e.preventDefault();
      
        if (e.type === "touchmove") {
          currentX = e.touches[0].clientX - xOffset;
          currentY = e.touches[0].clientY - yOffset;
        } else {
          currentX = e.clientX - xOffset;
          currentY = e.clientY - yOffset;
        }
  
        setTranslate(currentX, currentY, e.target);
      }
    }
  
    function setTranslate(xPos, yPos, el) {
      //el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
      el.style.left =  xPos + "px"
      el.style.top =  yPos + "px"
    }
  }
function hideInfo() {
    document.getElementById("info_box").style.display = "none";
}
function remove_token(name) {
  rm = document.getElementById(name+"_token")
  rm.parentNode.removeChild(rm);
  document.getElementById(name).checked = false;
  hideInfo()
}

function main() {
    //document.getElementsByClassName("menu_body")[0].mouseOver = test
}