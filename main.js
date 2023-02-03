
class board {
  inPlay = [];
  townIn = 0;
  outIn = 0;
  minIn = 0;
  demIn = 0;
}
var BOARD = new board;

async function get_JSON(path) {
  return await (await fetch("./data/"+path)).json();
}
// corner toggles
function visibility_toggle() {
    var self = document.getElementById("visibility_toggle")
    self.style.backgroundImage = "url(assets/visibility.png)"
    if (self.style.backgroundColor!="lightblue") {
        self.style.backgroundColor = "lightblue";
        document.getElementById("pip_layer").style.display = "none"
        document.getElementById("token_layer").style.display = "none"
    } else {
        self.style.backgroundColor = "rgb(66, 66, 66)";
        self.style.backgroundImage = "url(assets/visibility_off.png)"
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
async function infoCall(id, uid) {
  console.log(id, uid)
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
        div.id = "info_"+roleJSON["tokens"][i]+"_"+uid;
        div.style.cursor = "pointer";
        if (document.getElementById(TokenId+"_"+uid)!=undefined){
          div.style.opacity = 0.7;
          div.setAttribute("onclick", "javascript:recall_reminder_button('"+ TokenId +"', "+ uid +")")
        } else {
          div.setAttribute("onclick", "javascript:spawnReminder('"+ TokenId +"', "+ uid +")")
          
        }
        document.getElementById("info_token_landing").appendChild(div);
    }
    document.getElementById("info_name_feild").value = document.getElementById(id+"_name_" + uid).innerHTML
    document.getElementById("info_name_feild").setAttribute("onchange", "javascript:nameIn('"+ id +"', "+ uid +")")
    document.getElementById("delete_button").setAttribute("onclick", "javascript:remove_token('"+ id +"', "+ uid +")")
    document.getElementById("info_box").style.display = "inherit";
}
function spawnReminder(id, uid) {
    var div = document.createElement("div");
    div.classList = "reminder drag";
    div.style = "background-image: url('assets/reminders/"+id+".png'); left: "+(parseInt(window.visualViewport.width/2)-37)+"; top: calc(50% - 37.5px)";
    div.id = id + "_" + uid;
    document.getElementById("pip_layer").appendChild(div);
    var reminder = document.getElementById("info_"+id+"_"+uid)
    reminder.style.opacity = 0.7;
    reminder.setAttribute("onclick", "javascript:recall_reminder_button('"+ id +"', "+ uid +")")
    dragInit();
}
function recall_reminder_button(id, uid) {
  var reminder = document.getElementById("info_"+id+"_"+uid)
  reminder.style.opacity = 1;
  reminder.setAttribute("onclick", "javascript:spawnReminder('"+ id +"', "+ uid +")")
  rm = document.getElementById(id+"_"+uid);
  rm.parentNode.removeChild(rm);
}
function hideInfo() {
    document.getElementById("info_box").style.display = "none";
}
function nameIn(id, uid) {
  document.getElementById(id+"_name_"+uid).innerHTML = document.getElementById("info_name_feild").value;
}

//token functions
function spawnToken(id) {
  var time = new Date();
  var uid = time.getMilliseconds()
  var div = document.createElement("div");
  div.setAttribute("onclick", "javascript:infoCall('"+ id + "', " + uid +")");
  div.classList = "role_token drag";
  div.style = "background-image: url('assets/roles/"+id+"_token.png'); left: "+(parseInt(window.visualViewport.width/2)-75)+"px; top: calc(50% - 75px)";
  div.id = id+"_token_"+uid;
  var name = document.createElement("span")
  name.classList = "token_text"
  name.id = id+"_name_"+uid;
  div.appendChild(name);
  document.getElementById("token_layer").appendChild(div);
  document.getElementById(id+"_count").innerHTML = parseInt(document.getElementById(id+"_count").innerHTML)+1
  player_count_change()
  dragInit();
}
function remove_token(id, uid) {
  var tokens = document.getElementById("info_token_landing").children
  rm = document.getElementById(id+"_token_"+uid)
  rm.parentNode.removeChild(rm);
  for (i = 0; i < tokens.length; i++) {
    if (tokens[i].style.opacity == 0.7) {
      tid = tokens[i].id.substring(5,tokens[i].id.length)
      rm = document.getElementById(tid)
      rm.parentNode.removeChild(rm);
    }
  }
  document.getElementById(id+"_count").innerHTML = parseInt(document.getElementById(id+"_count").innerHTML)-1
  player_count_change()
  hideInfo()
}
function script_change() {
  populate_script(document.getElementById("script_options").options.selectedIndex)
}

//menu functions
function open_menu() {
  document.getElementById("menu_main").style.transform = "translateX(0px)";
}
function close_menu() {
  document.getElementById("menu_main").style.transform = "translateX(-300px)";
}
async function load_scripts(){
  var scripts = await get_JSON("scripts/scripts.json")
  scripts.forEach(async element => {
    var script = await get_JSON("scripts/"+element["file"]+".json")
    option = document.createElement("option");
    optionText = document.createTextNode(element["file"]);
    option.appendChild(optionText);
    document.getElementById("script_options").appendChild(option);
  });
  populate_script(0) ////////////// turn this back
  
}
async function populate_script(x){
  var script_names = await get_JSON("scripts/scripts.json")
  var script = await get_JSON("scripts/"+script_names[x]["file"]+".json")
  function header(text, landing_name, color) {
      var div = document.createElement("div");
      div.innerHTML = text;
      div.style.color = color;
      div.classList = "menu_header"
      landing = document.getElementById(landing_name)
      landing.appendChild(div);
      var ratio = document.createElement("div");
      ratio.classList = "menu_ratio";
      ratio.innerHTML = "0/0";
      ratio.id = "ratio_" + landing_name
      landing.appendChild(ratio);
      landing.insertAdjacentHTML("beforeend", "<hr>");
  }
  function options(type, tokenNames) {
      var landing = document.getElementById(type)
      tokenNames.forEach(async function(tokenJSON){
        if (tokenJSON.class == type) {
          var outer_div = document.createElement("div");
          outer_div.classList = "menu_list_div";
          outer_div.title = tokenJSON["description"];
          outer_div.setAttribute("onclick", "javascript:spawnToken('"+ tokenJSON["id"] +"')");
          var label = document.createElement("label");
          label.classList = "menu_list";
          label.innerHTML = tokenJSON["name"];
          outer_div.appendChild(label);
          var count_div = document.createElement("div");
          count_div.classList = "menu_token_count";
          count_div.innerHTML = 0;
          count_div.id = tokenJSON["id"] + "_count";
          outer_div.appendChild(count_div);
          outer_div.insertAdjacentHTML("beforeend", "&nbsp;");
          var hr = document.createElement("hr");
          outer_div.appendChild(hr);
          landing.appendChild(outer_div)
        }
      })
  }
  function clear(div) {
      document.getElementById(div).innerHTML = ""
  }
  scriptTokens = [script.length-1];
  for (i = 1; i < script.length; i++) {
    scriptTokens[i-1] = await get_JSON("tokens/"+script[i].id+".json")
  }
  console.log(scriptTokens);
  clear("TOWN")
  header("Town","TOWN", "#0033cc")
  options("TOWN", scriptTokens)
  clear("OUT")
  header("Outsiders", "OUT", "#1a53ff")
  options("OUT", scriptTokens)
  clear("MIN")
  header("Minions", "MIN", "#b30000")
  options("MIN", scriptTokens)
  clear("DEM")
  header("Demons", "DEM", "#e60000")
  options("DEM", scriptTokens)
  player_count_change()
}
function player_count_change() {
  number = document.getElementById("player_count").value;
  number = parseInt(number)-5;
  var table = [[3,0,1,1],[3,1,1,1],[5,0,1,1],[5,1,1,1],[5,2,1,1],[7,0,2,1],[7,1,2,1],[7,2,2,1],[9,0,3,1],[9,1,3,1],[9,2,3,1],[10,2,3,1],[11,2,3,1],[11,3,3,1]]
  var town_count = 0
  var town = document.getElementById("TOWN").getElementsByClassName("menu_token_count")
  for (i = 0; i < town.length; i++) {
    town_count = town_count + parseInt(town[i].innerHTML)
  }
  document.getElementById("ratio_TOWN").innerHTML = town_count + "/" + table[number][0];
  var out_count = 0
  var out = document.getElementById("OUT").getElementsByClassName("menu_token_count")
  for (i = 0; i < out.length; i++) {
    out_count = out_count + parseInt(out[i].innerHTML)
  }
  document.getElementById("ratio_OUT").innerHTML = out_count + "/" + table[number][1];
  var min_count = 0
  var min = document.getElementById("MIN").getElementsByClassName("menu_token_count")
  for (i = 0; i < min.length; i++) {
    min_count = min_count + parseInt(min[i].innerHTML)
  }
  document.getElementById("ratio_MIN").innerHTML = min_count + "/" + table[number][2];
  var dem_count = 0
  var dem = document.getElementById("DEM").getElementsByClassName("menu_token_count")
  for (i = 0; i < dem.length; i++) {
    dem_count = dem_count + parseInt(dem[i].innerHTML)
  }
  document.getElementById("ratio_DEM").innerHTML = dem_count + "/" + table[number][3];
}

//drag functions
var active;
function dragInit() {
  const dragSpots = document.getElementsByClassName("drag");
  for (var i = 0; i < dragSpots.length; i++) {
    var container = dragSpots[i];

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
  close_menu()
}

//night order
function toggle_night_order(night) {
  first = document.getElementById("first_night")
  other = document.getElementById("other_night")
  clear_night_order()
  if (night == "firstnight" && first.style.color == "rgb(244, 244, 244)") {
    first.style.color = ""
    return;
  } else if (night == "othernight" && other.style.color == "rgb(244, 244, 244)") {
    other.style.color = ""
    return;
  } else {
    if (night == "firstnight") {
      first.style.color = "#f4f4f4"
      other.style.color = ""
    }
    if (night == "othernight") {
      other.style.color = "#f4f4f4"
      first.style.color = ""
    }
    populate_night_order(night)
  }
}
function clear_night_order() {
  document.getElementById("night_order_tab_landing").innerHTML = ""
}
async function populate_night_order(night) {
  var order = await get_JSON("nightsheet.json")
  order = order[night]
  tokens = document.getElementById("token_layer").children
  var inPlay = new Array(tokens.length)
  for (i = 0; i<inPlay.length;i++) {
    inPlay[i] = tokens[i].id.substring(0, tokens[i].id.length-10)
  }
  for (i = 0;i<order.length;i++) {
    for (j = 0; j<inPlay.length; j++) {
      if (order[i] == inPlay[j]) {
        gen_night_order_tab(inPlay[j])
      }
    }
  }
}
async function gen_night_order_tab(id) {
  var data = await get_JSON("tokens/"+id+".json");
  div = document.createElement("div");
  div.classList = "night_order_tab";
  div.innerHTML = data.name;//do this by picture
  document.getElementById("night_order_tab_landing").appendChild(div);
  console.log(id);
}

load_scripts()
