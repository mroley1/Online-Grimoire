
var UID_LENGTH = 13

// * TODO use token in menu as toggle for visibility of represented token
// ? TODO implement shuffle feature: swap pictures not names. 
// TODO make death tokens look less shitty
// ! TODO make reminders draggable from info
// TODO make hitboxes more accurate in menu
// TODO implement cast makeup to be responsive to script
// TODO redesign info to look less like the hellscape it is at this point
// TODO implement scrolling on night order tab's overflow
// * TODO handle cast makeup on changing script (dont rely on DOM inner values)
// TODO implement travelers
// * TODO have good/evil token underneith existing ones to prevent cascading element creation

async function get_JSON(path) {
  return await (await fetch("./data/"+path)).json();
}

function loaded() {
  goodEvilReminderSpawn("good");
  goodEvilReminderSpawn("evil");
}

// corner toggles
function visibility_toggle() {
  var self = document.getElementById("visibility_toggle")
  self.style.backgroundImage = "url(assets/visibility.png)"
  if (self.style.backgroundColor!="lightblue") {
    clear_night_order()
    //hide
    self.style.backgroundColor = "lightblue";
    document.getElementById("move_toggle").style.backgroundColor = "rgb(66, 66, 66)";
    document.getElementById("pip_layer").style.display = "none";
    document.getElementById("goodEvilLayer").style.display = "none";
    tokens = document.getElementById("token_layer").getElementsByClassName("role_token")
    for (i = 0; i < tokens.length; i++) {
      var id = tokens[i].id.substring(0,tokens[i].id.length-UID_LENGTH-7);
      var uid = tokens[i].getAttribute("uid");
      if (document.getElementById(id+"_token_"+uid).getAttribute("hide")=="true") {
        document.getElementById(id+"_token_"+uid).style.display = "none";
      }
      document.getElementById(id+"_"+uid+"_death").style.display = "none";
      switch (tokens[i].getAttribute("viability")) {
      case "alive":
        tokens[i].style.backgroundImage = "url(assets/token.png)"
        break;
      case "dead_vote":
        tokens[i].style.backgroundImage = "url(assets/death.png)"
        document.getElementById(id + "_" + uid + "_vote").style.display = "inherit";
        break;
      case "dead":
        tokens[i].style.backgroundImage = "url(assets/death.png)"
        break;
      default: tokens[i].setAttribute("viability", "alive");
      }
      tokens[i].setAttribute("onclick", "javascript:deathCycle('"+ id + "', " + uid +")");
    }
  } else { 
    //show
    self.style.backgroundColor = "rgb(66, 66, 66)";
    self.style.backgroundImage = "url(assets/visibility_off.png)"
    document.getElementById("pip_layer").style.display = "inherit"
    document.getElementById("goodEvilLayer").style.display = "inherit";
    tokens = document.getElementById("token_layer").getElementsByClassName("role_token")
    for (i = 0; i < tokens.length; i++) {
      var id = tokens[i].id.substring(0,tokens[i].id.length-UID_LENGTH-7);
      var uid = tokens[i].getAttribute("uid");
      document.getElementById(id+"_token_"+uid).style.display = "inherit";
      tokens[i].style.backgroundImage = "url('assets/roles/"+id+"_token.png')"
      document.getElementById(id+"_"+uid+"_vote").style.display = "none";
      if (tokens[i].getAttribute("viability")=="dead_vote" || tokens[i].getAttribute("viability")=="dead") {
        document.getElementById(id+"_"+uid+"_death").style.display = "inherit"
      } else {
        document.getElementById(id+"_"+uid+"_death").style.display = "none"
      }
      tokens[i].setAttribute("onclick", "javascript:infoCall('"+ id + "', " + uid +")");
    }
  }
}
function deathCycle(id, uid) {
  let token = document.getElementById(id+"_token_"+uid);
  switch (token.getAttribute("viability")) {
  case "alive": //toDeadVote
    token.setAttribute("viability", "dead_vote");
    token.style.backgroundImage = "url(assets/death.png)"
    document.getElementById(id + "_" + uid + "_vote").style.display = "inherit";
    break;
  case "dead_vote": //toDead
    token.setAttribute("viability", "dead");
    document.getElementById(id + "_" + uid + "_vote").style.display = "none";
    break;
  case "dead": // toAlive
    token.setAttribute("viability", "alive");
    token.style.backgroundImage = "url(assets/token.png)"
    break;
  default: token.setAttribute("viability", "alive");
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
    document.getElementById("info_img").src = "assets/roles/"+id+"_token.png";
    document.getElementById("info_img").setAttribute("onclick", "javascript:cycle_token_visibility_toggle('"+id+"', '"+ uid +"')");
    document.getElementById("info_img").style.cursor = "pointer";
    if (document.getElementById(id+"_token_"+uid).getAttribute("hide")=="true"){
      document.getElementById(id+"_"+uid+"_visibilty_pip").style.display = "inherit";
      document.getElementById("info_visibility_shade").style.display = "inherit";
      document.getElementById("info_visibility_img").style.display = "inherit";
    } else {
      document.getElementById(id+"_"+uid+"_visibilty_pip").style.display = "none";
      document.getElementById("info_visibility_shade").style.display = "none";
      document.getElementById("info_visibility_img").style.display = "none";
    }
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
function cycle_token_visibility_toggle(id, uid) {
  focus = document.getElementById(id+"_token_"+uid);
  hide = focus.getAttribute("hide")=="true";
  if (hide) {
    focus.setAttribute("hide", "false");
    document.getElementById(id+"_"+uid+"_visibilty_pip").style.display = "none";
    document.getElementById("info_visibility_shade").style.display = "none";
    document.getElementById("info_visibility_img").style.display = "none";
  } else {
    focus.setAttribute("hide", "true");
    document.getElementById(id+"_"+uid+"_visibilty_pip").style.display = "inherit";
    document.getElementById("info_visibility_shade").style.display = "inherit";
    document.getElementById("info_visibility_img").style.display = "inherit";
  }
}


//token functions
function spawnToken(id, hide, cat) {
  var time = new Date();
  var uid = time.getTime()
  var div = document.createElement("div");
  div.setAttribute("onclick", "javascript:infoCall('"+ id + "', " + uid +")");
  div.classList = "role_token drag";
  div.style = "background-image: url('assets/roles/"+id+"_token.png'); left: "+(parseInt(window.visualViewport.width/2)-75)+"px; top: calc(50% - 75px)";
  div.id = id+"_token_"+uid;
  div.setAttribute("viability", "alive");
  div.setAttribute("uid", uid);
  div.setAttribute("hide", hide);
  div.setAttribute("cat", cat);
  var death = document.createElement("img");
  death.src = "assets/shroud.png";
  death.classList = "token_death";
  death.id = id + "_" + uid + "_death";
  death.style.display = "none" // none
  div.appendChild(death);
  var visibility_pip = document.createElement("div");
  visibility_pip.classList = "token_visibility_pip background_image";
  visibility_pip.id = id+"_"+uid+"_visibilty_pip";
  if (!hide) {visibility_pip.style.display = "none";}
  div.appendChild(visibility_pip);
  var vote = document.createElement("img");
  vote.src = "assets/vote.png";
  vote.classList = "token_vote";
  vote.id = id + "_" + uid + "_vote";
  vote.style.display = "none" // none
  div.appendChild(vote);
  var name = document.createElement("span")
  name.classList = "token_text"
  name.id = id+"_name_"+uid;
  div.appendChild(name);
  document.getElementById("token_layer").appendChild(div);
  update_role_counts();
  player_count_change();
  dragInit();
  clear_night_order();
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
  update_role_counts();
  player_count_change();
  hideInfo();
  clear_night_order();
}
// ? function mutate_token() {}


//good/evil reminders
function goodEvilReminderSpawn(type) {
  var time = new Date();
  var uid = time.getTime();
  var div = document.createElement("div");
  div.classList = "reminder drag goodEvil stacked";
  var topDistance = type=="good" ? "90px" : "175px";
  div.style = "background-image: url('assets/reminders/"+type+".png'); left: 5px; top: "+topDistance+"; border-radius: 100%; display: block; pointer-events: all;";
  div.id = type + "_" + uid;
  div.setAttribute("disposable-reminder", true);
  div.setAttribute("alignment", type);
  var img = document.createElement("img");
  img.style = "width: 80%; height: 80%; margin: 10%; pointer-events: none; display: none; border-radius: 100%; user-select: none";
  img.src = "assets/delete.png";
  img.id = type + "_" + uid + "_img";
  div.appendChild(img);
  document.getElementById("goodEvilLayer").prepend(div);
  dragInit();
}
function prompt_delete_reminder(id) {
  document.getElementById(id + "_img").style.display = "inherit";
  document.getElementById(id).setAttribute("onmouseup", null);
  setTimeout(function(){try{document.getElementById(id).setAttribute("onclick", "javascript:delete_reminder('"+id+"')");}catch(TypeError){null};}, 30)
}
function delete_reminder(id) {
  document.getElementById(id).setAttribute("onmouseup", null);
  document.getElementById("goodEvilLayer").removeChild(document.getElementById(id));
}
function unprompt_reminders() {
  tokens = document.getElementsByClassName("goodEvil");
  for (var i = 0; i < tokens.length; i++){
    var element = tokens[i];
    document.getElementById(element.id + "_img").style.display = "none";
    element.setAttribute("onclick", null);
    element.setAttribute("onmouseup", "javascript:prompt_delete_reminder('"+element.id+"')");
  }
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
    optionText = document.createTextNode(script[0]["name"]);
    option.appendChild(optionText);
    document.getElementById("script_options").appendChild(option);
  });
  populate_script(0)
  
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
          outer_div.setAttribute("onclick", "javascript:spawnToken('"+ tokenJSON["id"] +"', "+ tokenJSON["hide_token"] +", '"+ tokenJSON["class"] +"')");
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
  player_count_change();
  update_role_counts();
}
function player_count_change() {
  number = document.getElementById("player_count").value;
  number = parseInt(number)-5;
  var table = [[3,0,1,1],[3,1,1,1],[5,0,1,1],[5,1,1,1],[5,2,1,1],[7,0,2,1],[7,1,2,1],[7,2,2,1],[9,0,3,1],[9,1,3,1],[9,2,3,1],[10,2,3,1],[11,2,3,1],[11,3,3,1]]
  var counts = [0, 0, 0, 0];
  tokens = document.getElementsByClassName("role_token");
  for (i = 0; i<tokens.length; i++) {
    switch (tokens[i].getAttribute("cat")) {
      case "TOWN":
        counts[0]++;
      break;
      case "OUT":
        counts[1]++;
      break;
      case "MIN":
        counts[2]++;
      break;
      case "DEM":
        counts[3]++;
      break;
    }
  }
  document.getElementById("ratio_TOWN").innerHTML = counts[0] + "/" + table[number][0];
  document.getElementById("ratio_OUT").innerHTML = counts[1] + "/" + table[number][1];
  document.getElementById("ratio_MIN").innerHTML = counts[2] + "/" + table[number][2];
  document.getElementById("ratio_DEM").innerHTML = counts[3] + "/" + table[number][3];
}
function script_change() {
  populate_script(document.getElementById("script_options").options.selectedIndex)
}
function update_role_counts(){
  var counts = document.getElementsByClassName("menu_token_count");
  for (i = 0; i<counts.length; i++) {
    counts[i].innerHTML = 0;
  }
  var tokens = document.getElementsByClassName("role_token");
  for (i = 0; i<tokens.length; i++) {
    id = tokens[i].getAttribute("id").match(/.*(?=_token)/)[0];
    try {document.getElementById(id+"_count").innerHTML = parseInt(document.getElementById(id+"_count").innerHTML)+1}
    catch (e) {}
    
  }

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
  if(e.target.getAttribute("disposable-reminder")) {
    e.target.classList = "reminder drag goodEvil";
    e.target.setAttribute("onmouseup", "javascript:prompt_delete_reminder('"+e.target.id+"')");
    e.target.style.cursor = "pointer";
    console.log(document.getElementsByClassName("stacked"))
    if (document.getElementsByClassName("stacked").length<=1) {
      goodEvilReminderSpawn(e.target.getAttribute("alignment"));
    }
  }
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
  unprompt_reminders()
}


//night order and jinx
function toggle_night_order(night) {
  first = document.getElementById("first_night")
  other = document.getElementById("other_night")
  if (night == "firstnight" && first.style.color == "rgb(244, 244, 244)") {
    clear_night_order();
    return;
  } else if (night == "othernight" && other.style.color == "rgb(244, 244, 244)") {
    clear_night_order();
    return;
  } else {
    clear_night_order();
    if (night == "firstnight") {
      first.style.color = "#f4f4f4";
    }
    if (night == "othernight") {
      other.style.color = "#f4f4f4";
    }
    populate_night_order(night);
  }
}
function clear_night_order() {
  document.getElementById("night_order_tab_landing").innerHTML = ""
  document.getElementById("first_night").style.color = "";
  document.getElementById("other_night").style.color = "";
  document.getElementById("jinx_toggle").style.color = "";
}
async function populate_night_order(night) {
  var order = await get_JSON("nightsheet.json")
  order = order[night]
  tokens = document.getElementById("token_layer").children;
  var inPlay = new Set();
  var alive = new Set();
  for (i = 0; i<tokens.length;i++) {
    var id = tokens[i].id.substring(0, tokens[i].id.length-(7 + UID_LENGTH));
    if (tokens[i].getAttribute("viability")=="alive"){alive.add(id);}
    inPlay.add(id);
  }
  for (i = 0;i<order.length;i++) {
    if (inPlay.has(order[i])) {
      gen_night_order_tab_role(await get_JSON("tokens/"+order[i]+".json"), night, (alive.has(order[i]))?false:true)
    }
    if (order[i].toUpperCase() == order[i]) {
      gen_night_order_tab_info(order[i])
    }
  }
}
function gen_night_order_tab_role(token_JSON, night, dead) {
  var color;
  switch (token_JSON.class) {
    case "TOWN":color = "#0033cc";break;
    case "OUT":color = "#0086b3";break;
    case "MIN":color = "#e62e00";break;
    case "DEM":color = "#cc0000";break;
  }
  if (dead) {color = "#000000";}
  div = document.createElement("div");
  div.classList = "night_order_tab";
  div.id = token_JSON.id + "_night_order_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , "+color+")";
  span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = token_JSON[night.substring(0,5)+"_night_desc"];
  span.id = token_JSON.id + "_night_order_tab_span";
  div.appendChild(span);
  img = document.createElement("img");
  img.classList = "night_order_img";
  img.src = "assets/icons/"+token_JSON.id+".png";
  div.setAttribute("onclick", "javascript:expand_night_order_tab('"+token_JSON.id+"_night_order_tab')");
  div.appendChild(img);
  document.getElementById("night_order_tab_landing").appendChild(div);
}
function gen_night_order_tab_info(info) {
  var default_info = {"MINION_INFO":"If this game does not have 7 or more players skip this.\nIf more than one Minion, they all make eye contact with each other. Show the “This is the Demon” card. Point to the Demon.",
                      "DEMON_INFO":"If this game does not have 7 or more players skip this.\nShow the “These are your minions” card. Point to each Minion. Show the “These characters are not in play” card. Show 3 character tokens of good characters not in play.",
                      "DAWN":"Wait approximately 10 seconds. Call for eyes open; immediately announce which players (if anyone) died",
                      "DUSK":"Confirm all players have eyes closed. Wait approximately 10 seconds"}
  div = document.createElement("div");
  div.classList = "night_order_tab";
  img = document.createElement("img");
  img.classList = "night_order_img";
  img.src = "assets/"+info+".png"
  div.appendChild(img);
  div.id = info + "_night_order_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , #999999)";
  div.setAttribute("onclick", "javascript:expand_night_order_tab('"+info+"_night_order_tab')");
  span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = default_info[info];
  span.id = info + "_night_order_tab_span";
  div.appendChild(span);
  document.getElementById("night_order_tab_landing").appendChild(div);
}
function expand_night_order_tab(id) {
  tab = document.getElementById(id)
  tab.style.width = "500px";
  tab.style.transform = "translateX(-410px)";
  tab.style.height = document.getElementById(id).scrollHeight;
  tab.setAttribute("onclick", "javascript:collapse_night_order_tab('"+id+"')")
}
function collapse_night_order_tab(id) {
  tab = document.getElementById(id)
  tab.style.width = "90px";
  tab.style.transform = "translateX(0px)";
  tab.style.height = "90px";
  tab.setAttribute("onclick", "javascript:expand_night_order_tab('"+id+"')")
}
async function toggle_populate_jinx() {
  jinxBtn = document.getElementById("jinx_toggle")
  if (jinxBtn.style.color == "rgb(244, 244, 244)") {
    clear_night_order();
    return;
  } else {
    clear_night_order();
    jinxBtn.style.color = "rgb(244, 244, 244)"
    jinxes = await get_JSON("jinx.json");
    tokens = document.getElementById("token_layer").children;
    var inPlay = new Set();
    for (i = 0; i<tokens.length;i++) {
      var id = tokens[i].id.substring(0, tokens[i].id.length-(7 + UID_LENGTH));
      inPlay.add(id);
    }
    for (const token of inPlay) {
      for (i=0;i<jinxes.length;i++){
        if (jinxes[i].id == token) {
          for (j=0;j<jinxes[i].jinx.length;j++) {
            if (inPlay.has(jinxes[i].jinx[j].id)) {
              gen_jinxes_tab(jinxes[i].id, jinxes[i].jinx[j].id, jinxes[i].jinx[j].reason)
            }
          }
        }
      }
    }
  }
}
function gen_jinxes_tab(id1, id2, reason) {
  div = document.createElement("div");
  div.classList = "night_order_tab";
  div.id = id1 + "_" + id2 + "_jinx_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , #b3b300)";
  span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = reason;
  span.id = id1 + "_" + id2 + "_jinx_tab_span";
  div.appendChild(span);
  imgDiv = document.createElement("div");
  imgDiv.classList = "night_order_img"
  img1 = document.createElement("img");
  img1.src = "assets/icons/"+id1+".png";
  img1.style = "width: 70%; position: absolute; top: 0px; left: 0px"
  img2 = document.createElement("img");
  img2.src = "assets/icons/"+id2+".png";
  img2.style = "width: 70%; position: absolute; bottom: 0px; right: 0px"
  imgDiv.appendChild(img1);
  imgDiv.appendChild(img2);
  div.appendChild(imgDiv);
  div.setAttribute("onclick", "javascript:expand_night_order_tab('"+id1+"_"+id2+"_jinx_tab"+"')");
  document.getElementById("night_order_tab_landing").appendChild(div);
}

load_scripts()
