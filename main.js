async function get_JSON(path) {
  return await (await fetch("./data/"+path)).json();
}

// corner toggles
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

function move_toggle() {
    var self = document.getElementById("move_toggle")
    if (self.style.backgroundColor == "green") {
        self.style.backgroundColor = "rgb(66, 66, 66)";
    } else {
        self.style.backgroundColor = "green";
    }
}

//info functions
async function infoCall(id) {
    document.getElementById("info_img").style.backgroundImage = "url('assets/roles/"+id+"_token.png')"
    var roleJSON = await get_JSON("tokens/"+id+".json")
    document.getElementById("info_title").innerHTML = roleJSON["name"];
    document.getElementById("info_desc").innerHTML = roleJSON["description"];
    document.getElementById("info_token_landing").innerHTML = ""
    for (var i = 0; i < roleJSON["tokens"].length;i++){
        var div = document.createElement("div");
        div.className = "info_tokens";
        TokenId = roleJSON["tokens"][i]
        div.style.backgroundImage = "url('assets/reminders/"+TokenId+".png')";
        div.id = "info_"+roleJSON["tokens"][i];
        div.style.cursor = "pointer";
        if (document.getElementById(TokenId)!=undefined){
          div.style.opacity = 0.7;
          div.setAttribute("onclick", "javascript:recall_reminder_button('"+ TokenId +"')")
        } else {
          div.setAttribute("onclick", "javascript:spawnReminder('"+ TokenId +"')")
          
        }
        document.getElementById("info_token_landing").appendChild(div);
    }
    document.getElementById("info_name_feild").value = document.getElementById(id+"_name").innerHTML
    document.getElementById("info_name_feild").setAttribute("onchange", "javascript:nameIn('"+ id +"')")
    document.getElementById("delete_button").setAttribute("onclick", "javascript:remove_token('"+ id +"')")
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
    dragInit();
}
function recall_reminder_button(id) {
  var reminder = document.getElementById("info_"+id)
  reminder.style.opacity = 1;
  reminder.setAttribute("onclick", "javascript:spawnReminder('"+ id +"')")
  rm = document.getElementById(id);
  rm.parentNode.removeChild(rm);
}
function hideInfo() {
    document.getElementById("info_box").style.display = "none";
}
function nameIn(id) {
  document.getElementById(id+"_name").innerHTML = document.getElementById("info_name_feild").value;
}

//token functions
function spawnToken(id) {
  var div = document.createElement("div");
  div.setAttribute("onclick", "javascript:infoCall('"+ id +"')");
  div.classList = "role_token drag";
  div.style = "background-image: url('assets/roles/"+id+"_token.png'); left: "+(parseInt(window.visualViewport.width/2)-75)+"px; top: calc(50% - 75px)";
  div.id = id+"_token";
  var name = document.createElement("span")
  name.classList = "token_text"
  name.id = id+"_name";
  div.appendChild(name);
  document.getElementById("token_layer").appendChild(div);
  dragInit();
}
function remove_token(id) {
  var tokens = document.getElementById("info_token_landing").children
  rm = document.getElementById(id+"_token")
  rm.parentNode.removeChild(rm);
  document.getElementById(id).checked = false;
  for (i = 0; i < tokens.length; i++) {
    if (tokens[i].style.opacity == 0.7) {
      tid = tokens[i].id.substring(5,tokens[i].id.length)
      rm = document.getElementById(tid)
      rm.parentNode.removeChild(rm);
    }
  }
  hideInfo()
}
function script_change() {
  populate_script(document.getElementById("script_options").options.selectedIndex)
}

//menu functions
function toggle_menu() {
  var el0 = document.getElementById("menu_toggle")
  var el1 = document.getElementById("menu_main")
  if (el0.style.rotate == "180deg") {
      el0.style.rotate = "0deg";
      el1.style.transform = "translateX(-270px)";
      el1.style.opacity = "";
  } else {
      el0.style.rotate = "180deg";
      el1.style.transform = "translateX(0px)";
      el1.style.opacity = "1";
  }
}
async function populate_script(x){
  var script_names = await get_JSON("scripts/scripts.json")
  var script = await get_JSON("scripts/"+script_names[x]["file"]+".json")
  function header(text,landing) {
      var span = document.createElement(span);
      span.style = "color: white;";
      span.innerHTML = text;
      document.getElementById(landing).appendChild(span);
      var br = document.createElement("br");
      document.getElementById(landing).appendChild(br);
  }
  function options(tokenNames) {
      tokenNames.forEach(async function(tokenName){
          tokenJSON = await get_JSON("tokens/"+tokenName+".json");
          var landing = document.getElementById(tokenJSON["class"])
          var input = document.createElement("input");
          input.type = "checkbox";
          input.id = tokenName;
          input.setAttribute("onclick", "javascript:cast_change('"+ tokenName+"')");
          landing.appendChild(input);
          landing.insertAdjacentHTML("beforeend", "&nbsp;");
          var label = document.createElement("label");
          label.setAttribute("for", tokenName);
          label.classList = "menu_list";
          label.title = tokenJSON["description"];
          label.innerHTML = tokenJSON["name"];
          landing.appendChild(label);
          var br = document.createElement("br");
          landing.appendChild(br);
      })
  }
  function clear(div) {
      document.getElementById(div).innerHTML = ""
  }
  clear("TOWN")
  header("Town","TOWN")
  options(script["townsfolk"])
  clear("OUT")
  header("Outsiders", "OUT")
  options(script["outsiders"])
  clear("MIN")
  header("Minions", "MIN")
  options(script["minions"])
  clear("DEM")
  header("Demons", "DEM")
  options(script["demons"])
}
async function load_scripts(){
  var scripts = await get_JSON("scripts/scripts.json")
  scripts.forEach(element => {
      option = document.createElement("option");
      optionText = document.createTextNode(element["name"]);
      option.appendChild(optionText);
      document.getElementById("script_options").appendChild(option);
  });
  populate_script(0)
  
}
function cast_change(id) {
  var check = document.getElementById(id)
  if (check.checked) {
      spawnToken(id)
  } else {
      remove_token(id)
  }
}

//drag functions
var active;
function dragInit() {
  const dragSpots = document.getElementsByClassName("drag");
  for (var i = 0; i < dragSpots.length; i++) {
    var container = dragSpots[i];
    //console.log()


    container.addEventListener("touchstart", dragStart, false);
    container.addEventListener("touchend", dragEnd, false);
    container.addEventListener("touchmove", drag, false);

    container.addEventListener("mousedown", dragStart, false);
    container.addEventListener("mouseup", dragEnd, false);
    container.addEventListener("mousemove", drag, false);
  }
}

function dragStart(e) {
  if (document.getElementById("move_toggle").style.backgroundColor!="green" && e.target.classList.contains("role_token")){return}
  var pos = getComputedStyle(e.target)
  if (e.type === "touchstart") {
    xOffset = e.touches[0].clientX - pos.getPropertyValue('left').match(/\d+/)[0];
    yOffset = e.touches[0].clientY - pos.getPropertyValue('top').match(/\d+/)[0];
  } else {
    xOffset = e.clientX - pos.getPropertyValue('left').match(/\d+/)[0];
    yOffset = e.clientY - pos.getPropertyValue('top').match(/\d+/)[0];
  }
  if (e.target.classList.contains("drag")){
    active = true;
  }
  
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
  el.style.left =  xPos + "px"
  el.style.top =  yPos + "px"
}

//if you click on black space
function neutralClick() {
  hideInfo()
  if (document.getElementById("menu_toggle").style.rotate == "180deg"){
    toggle_menu()
  }
}

load_scripts()