
const UID_LENGTH = 13
const DEFAULT_FABLED = new Set(["doomsayer", "angel", "buddhist", "hellslibrarian", "revolutionary", "fiddler", "toymaker"]);
var roles;
var loading = false;
var CURRENT_SCRIPT;
var night_order_ref;

// ? TODO better scripts menu
// TODO fullscreeen settings menu
// TODO better fabled tokens
// ? TODO pip layer clean up prompt delete
// TODO clean up saving and loading 
// * TODO fancify night widget
// * TODO higher player limit to include travellers

function generate_game_state_json()
{
  var state = new Object();
  state.script = CURRENT_SCRIPT;
  state.scriptColor = document.getElementById("script_upload_feedback").getAttribute("used");
  state.scriptNumber = document.getElementById("script_options").selectedIndex;
  state.playercount = document.getElementById("player_count").value;
  state.night = document.getElementById("body_actual").getAttribute("night");
  state.orientation = document.getElementById("body_actual").getAttribute("orientation");
  state.background = document.getElementById("body_actual").style.getPropertyValue("--BG-IMG");
  state.players = [];
  players = document.getElementById("token_layer").getElementsByClassName("role_token");

  // Each player and their tokens.
  for (i = 0; i < players.length; i++)
  {
    state.players[i] = new Object();
    state.players[i].role = players[i].getAttribute("role");
    state.players[i].uid = players[i].getAttribute("uid");
    state.players[i].visibility = players[i].getAttribute("visibility");
    state.players[i].viability = players[i].getAttribute("viability");
    state.players[i].cat = players[i].getAttribute("cat");
    state.players[i].show_face = players[i].getAttribute("show_face");
    state.players[i].left = players[i].style.left;
    state.players[i].top = players[i].style.top;
    state.players[i].name = players[i].getElementsByClassName("token_text")[0].innerHTML;
    reminders = [];
    reminderdivs = players[i].getElementsByClassName("reminder drag");
    for(const attachedReminder of reminderdivs){
      if (attachedReminder.getAttribute("role") == null) {
        reminders.push([
          attachedReminder.getAttribute("alignment")
      ])
      } else{
        reminders.push([
          attachedReminder.getAttribute("role"),
          attachedReminder.getElementsByClassName("reminder_text")[0].innerHTML, 
          attachedReminder.getAttribute("uid")
      ])
      }
    }
    state.players[i].reminders = reminders;
  }
  state.reminders = [];
  reminders = document.getElementById("reminder_layer").getElementsByClassName("reminder");
  for (i = 0; i < reminders.length; i++)
  {
    state.reminders[i] = new Object();
    state.reminders[i].id = reminders[i].getAttribute("role");
    state.reminders[i].text = reminders[i].children[2].innerText;
    state.reminders[i].uid = reminders[i].getAttribute("uid");
    state.reminders[i].left = reminders[i].style.left;
    state.reminders[i].top = reminders[i].style.top;
  }

  // Pips are the alignment and "special" tokens on the left.
  state.pips = Array.from(document.getElementById("dragPipLayer").getElementsByClassName("reminder"))
    // The "generator" pips have the "stacked" attribute set.
    .filter(pip => pip.getAttribute("stacked") === "false")
    .map(pip => {
      return {
        type: pip.getAttribute("alignment"),
        left: pip.style.left,
        top: pip.style.top,
      }
    });
  return JSON.stringify(state);
}

async function load_game_state_json(state)
{
  state = JSON.parse(state);
  if (state == null)
  {
    loading = false;
    return;
  }
  loading = true;
  await populate_script(state.script);
  document.getElementById("script_upload_feedback").setAttribute("used", state.scriptColor);
  document.getElementById("script_options").selectedIndex = state.scriptNumber;
  document.getElementById("player_count").value = state.playercount;
  document.getElementById("body_actual").setAttribute("night", state.night);
  document.getElementById("body_actual").style.setProperty("--BG-IMG", state.background);
  for (let i = 0; i < state.players.length; i++)
  {
    spawnToken(state.players[i].role, state.players[i].uid, state.players[i].visibility, state.players[i].cat, state.players[i].hide_face, state.players[i].viability, state.players[i].left, state.players[i].top, state.players[i].name, state.players[i].reminders)
  }
  for (const reminder of state.reminders) 
  {
    if (!reminder.text) {
      const idParts = reminder.id.split("_");
      reminder.id = idParts[0];
      reminder.text = idParts.slice(1).map(x => x[0].toUpperCase() + x.substring(1)).join(" ");
    } 
    spawnReminder(reminder.id, reminder.text, reminder.uid, reminder.left, reminder.top);
  }
  for (const pip of state.pips)
  {
    const div = dragPipLayerSpawn(pip.type, pip.left, pip.top, "false")
    document.getElementById("dragPipLayer").prepend(div);
  }
  if (state.orientation != getOrientation())
  {
    orientationChange();
  }
  loading = false;
}

function save_game_state()
{
  localStorage.setItem("state", generate_game_state_json())
}

async function get_JSON(path)
{
  return await (await fetch("./data/" + path)).json();
}

async function loaded()
{
  loading = true;
  roles = await get_JSON("tokens.json");
  dragPipLayerSpawnDefault("good");
  dragPipLayerSpawnDefault("evil");
  dragPipLayerSpawnDefault("reminder_pip");
  load_scripts().then(() =>
  {
    load_game_state_json(localStorage.getItem("state"))
  })
  setTimeout(function ()
  {
    loading = false;
    player_count_change();
  }, 2000)
  document.getElementById("body_actual").setAttribute("orientation", getOrientation())
  window.onresize = resized;
}

//token functions
function spawnToken(id, uid, visibility, cat, hide_face, viability, left, top, nameText, reminders)
{
  // Force tokens to appear if we try to add one. 
  if (document.getElementById("body_actual").getAttribute("night") == "true") {
    visibility_toggle()
  }

  // The div.
  var div = document.createElement("div");
  div.setAttribute("onclick", "javascript:infoCall('" + id + "', " + uid + ")");
  div.classList = "role_token drag";
  div.style = `background-image: url('assets/token.png'); left:${left}; top:${top}`
  div.id = id + "_token_" + uid;
  div.setAttribute("role", id);
  div.setAttribute("viability", viability);
  div.setAttribute("uid", uid);
  div.setAttribute("visibility", visibility);
  div.setAttribute("cat", cat);
  div.setAttribute("show_face", !hide_face);

  let imageLink = getTokenImageLink(id);

  // Actual picture.
  var role = document.createElement("img");
  role.src = imageLink;
  role.id = `${id}_${uid}_image`;
  role.classList = "token_image background_image";
  div.appendChild(role);

  // The token name. 
  var roleName = createRoleNameElement(id, uid);
  div.appendChild(roleName);
  
  // Death shroud.
  var death = document.createElement("img");
  death.src = "assets/shroud.png";
  death.classList = "token_death";
  death.id = id + "_" + uid + "_death";
  div.appendChild(death);

  // The icon indicating if this token is hidden in TS (bluff, reminder, etc)
  var visibility_pip = document.createElement("div");
  visibility_pip.classList = "token_visibility_pip background_image";
  visibility_pip.id = id + "_" + uid + "_visibility_pip";
  div.appendChild(visibility_pip);

  // Dead vote (TS mode)
  var vote = document.createElement("img");
  vote.src = "assets/vote_token.png";
  vote.classList = "token_vote";
  vote.id = id + "_" + uid + "_vote";
  div.appendChild(vote);

  // The role of travelers, when shown in TS mode. 
  var outsider_betray = document.createElement("div");
  if (cat == "traveller")
  {
    outsider_betray.style.backgroundImage = `url('${imageLink}')`
  }
  outsider_betray.classList = "token_outsider_betray background_image";
  outsider_betray.id = id + "_" + uid + "_outsider_betray";
  div.appendChild(outsider_betray);

  // Player name, if given.
  var name = document.createElement("span")
  name.innerHTML = nameText;
  name.classList = "token_text"
  name.id = id + "_name_" + uid;
  div.appendChild(name);

  document.getElementById("token_layer").appendChild(div);

  // Add reminder tokens
  for(const reminder of reminders){
    let reminderHTML;
    if (reminder.length == 3) {
      reminderHTML = spawnReminder(reminder[0], reminder[1], reminder[2],'-50px','0px');
    } else {
      reminderHTML = dragPipLayerSpawn(reminder[0], '-50px', '0px', "false");
    }
    reminderHTML.style.position = "relative";
    div.appendChild(reminderHTML);
  }
  // Random admin stuff.
  update_role_counts();
  player_count_change();
  makeDraggable(div);
  populate_night_order();

  // This function is used by the loading code to place all the tokens.
  if (!loading) { save_game_state(); }
}

function createRoleNameElement(id, uid)
{
  var roleName = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  roleName.setAttribute("viewBox", "0 0 150 150");
  roleName.classList.add("token_role_name");
  
  // Create the path element
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M 13 75 C 13 150, 138 150, 138 75");
  path.setAttribute("id", "curve");
  path.setAttribute("fill", "transparent");
  roleName.appendChild(path);
  
  // Create the text element
  var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("width", "150");
  text.setAttribute("x", "62.5%");
  text.setAttribute("y", "130");
  text.setAttribute("text-anchor", "middle");
  
  // Create the textPath element
  var textPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
  textPath.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#curve"); // Use setAttributeNS for xlink
  textPath.setAttribute("style", "fill: black; font-family: Dumbledor; font-size: 24px;");
  textPath.classList.add("js--character--name");
  textPath.id = `${id}_${uid}_name_text`;
  textPath.textContent = roles[id]["name"]; // Use textContent for dynamic text
  
  // Append textPath to text, and text to svg
  text.appendChild(textPath);
  roleName.appendChild(text);

  return roleName;
}

function getTokenImageLink(id) {
  const image = roles[id]["image"];
  if (typeof image === "object") {
    // in the BOTC schema, the "image" object can be either a single link,
    // or an array of links. 
    // This future-proofs us against 
    return image[0];
  }
  return image;
}

function spawnTokenDefault(id, visibility, cat, hide_face)
{
  var time = new Date();
  var uid = time.getTime()
  spawnToken(id, uid, visibility, cat, hide_face, "alive", (parseInt(window.visualViewport.width / 2) - 75) + "px", "calc(50% - 75px)", "", []);
}
function remove_token(id, uid)
{
  rm = document.getElementById(id + "_token_" + uid);
  rm.parentNode.removeChild(rm);
  clean_tokens(uid);
  update_role_counts();
  player_count_change();
  hideInfo();
  populate_night_order();
}
function clean_tokens(uid)
{
  let reminders = document.getElementById("reminder_layer").getElementsByClassName("reminder");
  for (i = reminders.length - 1; i != -1; --i)
  {
    if (reminders[i].getAttribute("uid").substring(0, UID_LENGTH) == uid)
    {
      document.getElementById("reminder_layer").removeChild(reminders[i]);
    }
  }
}


//good/evil reminders
function dragPipLayerSpawn(type, left, top, stacked)
{
  var time = new Date();
  var uid = time.getTime();
  var div = document.createElement("div");
  div.classList = "reminder drag";
  div.style = "background-image: url('assets/reminders/" + type + ".png'); left: " + left + "; top: " + top + "; border-radius: 100%; pointer-events: all;";
  div.id = type + "_" + uid;
  div.setAttribute("disposable-reminder", true);
  div.setAttribute("alignment", type);
  div.setAttribute("stacked", stacked);
  var img = document.createElement("img");
  img.style = "width: 80%; height: 80%; margin: 10%; pointer-events: none; display: none; border-radius: 100%; user-select: none";
  img.src = "assets/delete.png";
  img.id = type + "_" + uid + "_img";
  div.appendChild(img);
  makeDraggable(div);
  // document.getElementById("dragPipLayer").prepend(div);
  // if (!loading) { save_game_state(); }
  return div;
}
function dragPipLayerSpawnDefault(type)
{
  const ref = { "good": "90px", "evil": "175px", "reminder_pip": "260px" }
  const div = dragPipLayerSpawn(type, "5px", ref[type], "true");
  document.getElementById("dragPipLayer").prepend(div);
}
function prompt_delete_reminder(id)
{
  document.getElementById(id + "_img").style.display = "inherit";
  document.getElementById(id).setAttribute("onmouseup", null);
  setTimeout(function () { try { document.getElementById(id).setAttribute("onclick", "javascript:delete_reminder('" + id + "')"); } catch (TypeError) { null }; }, 30)
}
function delete_reminder(id)
{
  document.getElementById(id).setAttribute("onmouseup", null);
  document.getElementById(id).parentNode.removeChild(document.getElementById(id));
  if (!loading) { save_game_state(); }
}
function unprompt_reminders()
{
  const specialReminders = document.getElementById("dragPipLayer").children;
  for (const reminder of specialReminders)
  {
    document.getElementById(reminder.id + "_img").style.display = "none";
    reminder.setAttribute("onclick", null);
    reminder.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + reminder.id + "')");
  }

  const looseRoleReminders = document.getElementById("reminder_layer").children;
  for (const reminder of looseRoleReminders)
  {
    document.getElementById(reminder.id + "_img").style.display = "none";
    reminder.setAttribute("onclick", null);
    reminder.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + reminder.id + "')");
  }
  const attachedRoleReminders = document.getElementsByClassName("reminder drag");
  for (const reminder of attachedRoleReminders)
  {
    document.getElementById(reminder.id + "_img").style.display = "none";
    reminder.setAttribute("onclick", null);
    reminder.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + reminder.id + "')");
  }
}


//menu functions
async function load_scripts()
{
  var scripts = await get_JSON("scripts/scripts.json")
  var initScript;
  for (i = 0; i < scripts.length; i++)
  {
    var element = scripts[i]
    var script = await get_JSON("scripts/" + element["file"] + ".json");
    if (i == 0) { initScript = script; }
    option = document.createElement("option");
    optionText = document.createTextNode(script[0]["name"]);
    option.appendChild(optionText);
    document.getElementById("script_options").appendChild(option);
  }
  populate_script(initScript)
}
async function script_select()
{
  var script_names = await get_JSON("scripts/scripts.json");
  var script = await get_JSON("scripts/" + script_names[document.getElementById("script_options").options.selectedIndex]["file"] + ".json");
  document.getElementById("script_upload_feedback").setAttribute("used", "select");
  document.getElementById("script_upload").value = "";
  populate_script(script);
  document.getElementById("menu_settings_dropdown").style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
  if (!loading) { save_game_state(); }
}
async function script_upload()
{
  let json = JSON.parse(await document.getElementById("script_upload").files[0].text());
  if (typeof json[1] == typeof "")
  {
    for (var i = 0; i < json.length; i++)
    {
      if (typeof json[i] == typeof "")
      {
        json[i] = { "id": json[i] };
      }
    }
  }
  try
  {
    json[0]["id"]
    populate_script(json);
    document.getElementById("script_upload_feedback").setAttribute("used", "upload");
  } catch (e) {
    console.error(e);
    document.getElementById("script_upload_feedback").innerHTML = "Error Processing File";
    document.getElementById("script_upload_feedback").setAttribute("used", "error");
  }
  document.getElementById("menu_settings_dropdown").style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
  if (!loading) { save_game_state(); }
}
async function populate_script(script)
{
  CURRENT_SCRIPT = script;
  document.getElementById("script_upload_feedback").innerHTML = script[0]["name"];
  function header(text, landing_name, color)
  {
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
    landing.insertAdjacentHTML("beforeend", "<hr style='margin-block-end: 0em;'>");
  }
  function options(type, tokenNames, text)
  {
    var landing = document.getElementById(type)
    for (i = 0; i < tokenNames.length; i++)
    {
      var tokenJSON = tokenNames[i];
      if (tokenJSON.team == type)
      {
        var outer_div = document.createElement("div");
        outer_div.classList = "menu_list_div";
        outer_div.title = tokenJSON["ability"];
        outer_div.setAttribute("onclick", "javascript:spawnTokenDefault('" + tokenJSON["id"] + "', " + (tokenJSON["hide_token"] == "true" ? "'hidden'" : "'show'") + ", '" + tokenJSON["team"] + "', " + tokenJSON["hide_face"] + ", 'alive')");
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
        hr.style.marginBlockEnd = "0em";
        outer_div.appendChild(hr);
        landing.appendChild(outer_div)
      }
    }
    //Add button to add offscreen of each category
    var outer_div = document.createElement("div");
        outer_div.classList = "menu_list_div";
        outer_div.title = title="Add offscript " + text;
        outer_div.setAttribute("onclick", "add_offscript_character('"+ type +"')");
        var label = document.createElement("label");
        label.classList = "menu_list";
        label.innerHTML = "Add Offscript " + text;
        outer_div.appendChild(label);
        outer_div.insertAdjacentHTML("beforeend", "&nbsp;");
        var hr = document.createElement("hr");
        hr.style.marginBlockEnd = "0em";
        outer_div.appendChild(hr);
        landing.appendChild(outer_div)
  }
  function clear(div)
  {
    document.getElementById(div).innerHTML = ""
  }
  let scriptTokens = [];
  script.forEach(element =>
  {
    if (element.id.substring(0, 1) != "_")
    {
      try { scriptTokens.push(roles[element.id]) } catch { }
    }
  })

  clear("townsfolk")
  header("Townsfolk", "townsfolk", "#0033cc")
  options("townsfolk", scriptTokens, "Townsfolk")
  clear("outsider")
  header("Outsiders", "outsider", "#1a53ff")
  options("outsider", scriptTokens, "Outsiders")
  clear("minion")
  header("Minions", "minion", "#b30000")
  options("minion", scriptTokens, "Minions")
  clear("demon")
  header("Demons", "demon", "#e60000")
  options("demon", scriptTokens, "Demons")
  clear("traveller")
  header("Travellers", "traveller", "#6600ff")
  options("traveller", scriptTokens, "Travellers")
  player_count_change();
  update_role_counts();
  clear_mutate_menu();
  populate_mutate_menu(scriptTokens);

  if (!loading) { save_game_state(); }
  return Promise.resolve()
}
async function game_state_upload()
{
  let json = await document.getElementById("game_state_upload").files[0].text();
  load_game_state_json(json).then(() =>
  {
    save_game_state();
  })
}
function download_game_state()
{
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generate_game_state_json()));
  element.setAttribute('download', "game_state.json");
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

//info functions

function generateSampleToken(id, el) {
  el.textContent = "";

  var token = document.createElement("img");
  token.src = "assets/token.png"
  token.style.width = "100%";
  token.style.height = "100%";
  el.appendChild(token);

  var role = document.createElement("img");
  role.id = "info_img_role";
  role.style.position = "absolute";
  role.src = getTokenImageLink(id);
  el.appendChild(role);

  var roleName = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  roleName.setAttribute("viewBox", "0 0 150 150");
  roleName.classList.add("token_role_name");
  
  // Curvature
  var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M 13 75 C 13 150, 138 150, 138 75");
  path.setAttribute("id", "curve");
  path.setAttribute("fill", "transparent");
  roleName.appendChild(path);
  
  // Text
  var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("width", "150");
  text.setAttribute("x", "62.5%");
  text.setAttribute("y", "130");
  text.setAttribute("text-anchor", "middle");
  
  // Create the textPath element
  var textPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
  textPath.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#curve");
  textPath.setAttribute("style", "fill: black; font-family: Dumbledor; font-size: 24px;");
  textPath.classList.add("js--character--name");
  textPath.textContent = roles[id]["name"]; 
  
  text.appendChild(textPath);
  roleName.appendChild(text);
  el.appendChild(roleName);

  return el;
}

function generateReminderBacking(roleName, reminder, uid) {

  var div = document.createElement("div");
  div.className = "info_tokens";
  div.id = "info_" + reminder + "_" + uid;
  
  var base = document.createElement("img");
  base.src = "assets/reminder.png"
  base.style.width = "100%";
  base.style.height = "100%";
  base.style.pointerEvents = "none";
  div.appendChild(base);
  
  var role = document.createElement("img");
  role.id = "info_img_role";
  role.style.position = "absolute";
  role.style.pointerEvents = "none";
  role.src = getTokenImageLink(roleName);
  div.appendChild(role);

  var text = document.createElement("p");
  text.innerText = reminder;
  text.classList = "reminder_ghost_text";
  div.appendChild(text);
  
  return div;
  // document.getElementById("info_token_landing").appendChild(div);
}

function spawnReminderGhost(left, top, roleName, reminder, longId)
{
  // Create a reminder that we put in the info box. 
  // This is slightly larger than the actual reminder, and appears larger until we put it onto the page.
  var time = new Date();
  var uid = time.getTime();

  var div = document.createElement("div");
  div.classList = "info_tokens_drag drag";
  div.style = `left: ${left}; top: ${top}; border-radius: 100%; pointer-events: all; width: 100px; height 100px;`
  div.id = longId + "_" + uid;
  div.setAttribute("ghost", "true");
  div.setAttribute("token_from", "info");
  div.setAttribute("role", roleName);

  var base = document.createElement("img");
  base.src = "assets/reminder.png"
  base.style.width = "100%";
  base.style.height = "100%";
  base.style.pointerEvents = "none";
  div.appendChild(base);
  
  var role = document.createElement("img");
  role.id = "info_img_role";
  role.style.position = "absolute";
  role.style.pointerEvents = "none";
  role.src = getTokenImageLink(roleName);
  div.appendChild(role);

  var text = document.createElement("p");
  text.innerText = reminder;
  text.classList = "reminder_ghost_text";
  div.appendChild(text);

  document.getElementById("info_token_dragbox").prepend(div);
  makeDraggable(div);
}

function spawnReminder(roleName, reminder, uid, left, top)
{

  var div = document.createElement("div");
  div.classList = "reminder drag";
  div.style = `left: ${left}; top: ${top}; border-radius: 100%; pointer-events: all;`
  div.id = roleName + "_" + uid;
  div.setAttribute("uid", uid);
  div.setAttribute("role", roleName);
  div.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + div.id + "')");

  var base = document.createElement("img");
  base.src = "assets/reminder.png"
  base.style.width = "100%";
  base.style.height = "100%";
  base.style.pointerEvents = "none";
  div.appendChild(base);
  
  var role = document.createElement("img");
  role.id = "info_img_role";
  role.style.position = "absolute";
  role.style.pointerEvents = "none";
  role.src = getTokenImageLink(roleName);
  div.appendChild(role);

  var text = document.createElement("p");
  text.innerText = reminder;
  text.classList = "reminder_text";
  div.appendChild(text);
  
  var trash = document.createElement("img");
  trash.classList = "reminder_delete"
  trash.src = "assets/delete.png";
  trash.id = roleName + "_" + uid + "_img";
  div.appendChild(trash);

  document.getElementById("reminder_layer").appendChild(div);
  makeDraggable(div)

  attachTokenToToken(div);//Make new reminder tokens check to see if they should be attach to a character token
  if (!loading) { save_game_state(); }
  return div;
}

function spawnFabledReminder(roleName, reminder)
{
  var time = new Date();
  var uid = time.getTime();
  spawnReminder(roleName, reminder, uid, 'calc(50% - 40px)', 'calc(50% - 40px)')
}

/** 
 * Shroud-specific data for what card to show for given IDs. 
 * The title is what's shown at the top of the shroud. 
 * The players is the number of characters shown, by default, on the shroud.
 */
const CARDS = {
  0: { "title": "Use Your Ability?", "players": 0 },
  1: { "title": "Choose a Player", "players": 0 },
  2: { "title": "These Characters are Not In Play", "players": 3 },
  3: { "title": "This Is Your Demon", "players": 0 },
  4: { "title": "These Are Your Minions", "players": 0 },
  5: { "title": "You Are", "players": 1 },
  6: { "title": "This Player Is", "players": 1 },
  7: { "title": "Character Selected You", "players": 1 },
  8: { "title": "Did You Vote Today?", "players": 0 },
  9: { "title": "Did You Nominate Today?", "players": 0 },
  10: { "title": "Info", "players": 0 },
  11: { "title": "Make your Choice", "players": 1 },
}

/**
 * Show a particular shroud (information display screen), to show to a player.
 * @param {Number} typeId The ID of the shroud to show the player.
 */
function load_playerinfo_shroud(typeId)
{
  function mapped_specials(typeId)
  {
    if (typeId == 8 || typeId == 9) {
      document.getElementById("playerinfo_extra_button").style.display = "none";
    } else {
      document.getElementById("playerinfo_extra_button").style.display = "inline-block";
    }
    switch (typeId)
    {
      case 2:
        var bluffs = [];
        var tokens = document.getElementById("token_layer").children;
        for (i = 0; i < tokens.length; i++)
        {
          if (tokens[i].getAttribute("visibility") == "bluff")
          {
            bluffs.push(tokens[i].id.match(/.*(?=_token_)/)[0])
          }
        }
        var places = document.getElementById("playerinfo_character_landing").children
        for (i = 0; i < places.length; i++)
        {
          if (bluffs.length != 0)
          {
            select_playerinfo_character(i, bluffs.pop())
          }
        }
        break;
      case 5:
      case 6:
      case 7:
        select_playerinfo_character(0, document.getElementById("info_list").getAttribute("current_player"));
        break;
      case 10:
        var input = document.createElement("textarea");
        function recalcHeight()
        {
          document.getElementById("playerinfo_body").style.top = "calc(50% - " + document.getElementById("playerinfo_body").clientHeight / 2 + "px)";
        }
        new ResizeObserver(recalcHeight).observe(input);
        input.id = "playerinfo_input"
        document.getElementById("playerinfo_character_landing").prepend(document.createElement("br"));
        document.getElementById("playerinfo_character_landing").prepend(input);
        break;
    }
  }
  const card = CARDS[typeId];
  document.getElementById("playerinfo_shoud").style.display = "inherit";
  document.getElementById("playerinfo_title").innerHTML = card["title"];
  document.getElementById("playerinfo_character_landing").innerHTML = "";
  for (i = 0; i < card["players"]; i++)
  {
    add_playerinfo_character_box()
  }
  mapped_specials(typeId);
  // For displays without any character boxes
  document.getElementById("playerinfo_body").style.top = "calc(50% - " + document.getElementById("playerinfo_body").clientHeight / 2 + "px)";
}

/**
 * Add a character box to the playerinfo shroud currently being displayed.
 */
function add_playerinfo_character_box() {
  const id = document.getElementById("playerinfo_character_landing").childElementCount;
  var div = document.createElement("div");
  div.id = "playerinfo_character_" + id;
  div.classList = "playerinfo_character";
  div.setAttribute("onclick", "javascript:trigger_playerinfo_character_select(" + id + ")")
  document.getElementById("playerinfo_character_landing").appendChild(div);
  document.getElementById("playerinfo_body").style.top = "calc(50% - " + document.getElementById("playerinfo_body").clientHeight / 2 + "px)";

  // We want the last item to be a copy of the prior. 
  // If the dreamer needs an extra slot for the "this player is" entry, then
  // the first one will be the actual character! We want some measure of
  // randomness for this.
  const prevNode = document.getElementById("playerinfo_character_" + (id-1));
  if (prevNode == null) return;
  const character = prevNode.firstChild;
  if (character == null) return;
  div.appendChild(character.cloneNode(true));
}

function trigger_playerinfo_character_select(id)
{
  var townsfolk = document.getElementById("mutate_menu_townsfolk").children;
  for (i = 0; i < townsfolk.length; i++)
  {
    townsfolk[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + townsfolk[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  var outsiders = document.getElementById("mutate_menu_outsider").children;
  for (i = 0; i < outsiders.length; i++)
  {
    outsiders[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + outsiders[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  var minions = document.getElementById("mutate_menu_minion").children;
  for (i = 0; i < minions.length; i++)
  {
    minions[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + minions[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  var demons = document.getElementById("mutate_menu_demon").children;
  for (i = 0; i < demons.length; i++)
  {
    demons[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + demons[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  var travellers = document.getElementById("mutate_menu_traveller").children;
  for (i = 0; i < travellers.length; i++)
  {
    travellers[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + travellers[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  document.getElementById("mutate_menu_main").style.display = "inherit";
}

function select_playerinfo_character(id, selection)
{
  const div = document.createElement("div");
  generateSampleToken(selection, div);

  div.style.position = "absolute";
  div.style.left = 25;
  div.style.width = 300;
  div.style.height = 300;

  document.getElementById("playerinfo_character_" + id).innerText = "";
  document.getElementById("playerinfo_character_" + id).appendChild(div);
}

function close_playerinfo_shroud()
{
  document.getElementById("playerinfo_shoud").style.display = "none";
}


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
function toggle_night_order_buttons(type)
{
  if (document.getElementById("nightorder_button_container").getAttribute("nightOrder") == type)
  {
    clean_night_order();
    document.getElementById("nightorder_button_container").setAttribute("nightOrder", "none");
  } else
  {
    switch (type)
    {
      case "fabled":
        document.getElementById("nightorder_button_container").setAttribute("nightOrder", "fabled");
        populate_fabled();
        break;
      case "jinx":
        document.getElementById("nightorder_button_container").setAttribute("nightOrder", "jinx");
        populate_jinx();
        break;
      case "firstnight":
        document.getElementById("nightorder_button_container").setAttribute("nightOrder", "firstnight");
        populate_night_order();
        break;
      case "othernight":
        document.getElementById("nightorder_button_container").setAttribute("nightOrder", "othernight");
        populate_night_order();
        break;
    }
  }
}
function clean_night_order()
{
  document.getElementById("night_order_tab_landing").innerHTML = ""
  document.getElementById("first_night").style.color = "";
  document.getElementById("other_night").style.color = "";
  document.getElementById("jinx_toggle").style.color = "";
}
async function populate_night_order()
{
  night = document.getElementById("nightorder_button_container").getAttribute("nightOrder");
  if (night == "jinx")
  {
    populate_jinx();
    return;
  }
  clean_night_order();
  if (night == "none") { return; }
  var order = await get_JSON("nightsheet.json")
  order = order[night];
  tokens = document.getElementById("token_layer").children;
  var inPlay = new Set();
  var alive = new Set();
  for (i = 0; i < tokens.length; i++)
  {
    var id = tokens[i].getAttribute("role");
    if (tokens[i].getAttribute("viability") == "alive" && tokens[i].getAttribute("visibility") != "bluff") { alive.add(id); }
    if (tokens[i].getAttribute("visibility") != "bluff") { inPlay.add(id); }
  }
  for (i = 0; i < order.length; i++)
  {
    if (inPlay.has(order[i]))
    {
      gen_night_order_tab_role(roles[order[i]], night, (alive.has(order[i])) ? false : true)
    }
    if (order[i].toUpperCase() == order[i])
    {
      gen_night_order_tab_info(order[i])
    }
  }
}
function clear_night_order()
{
  clean_night_order();
  document.getElementById("nightorder_button_container").setAttribute("nightOrder", "none");
}
function nightOrderScroll(enable)
{
  if (enable == "true")
  {
    document.getElementById("night_order_landing_container").style.pointerEvents = "all";
  } else if (enable == "false")
  {
    document.getElementById("night_order_landing_container").style.pointerEvents = "none";
  }
}
function gen_night_order_tab_role(token_JSON, night, dead)
{
  var color;
  switch (token_JSON.team)
  {
    case "townsfolk": color = "#0033cc"; break;
    case "outsider": color = "#0086b3"; break;
    case "minion": color = "#e62e00"; break;
    case "demon": color = "#cc0000"; break;
    case "traveller": color = "#6600ff"; break;
  }
  if (dead) { color = "#000000"; }
  div = document.createElement("div");
  div.classList = "night_order_tab";
  div.id = token_JSON.id + "_night_order_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , " + color + ")";
  span = document.createElement("span");
  span.classList = "night_order_span"
  //implement dynamic night order
  let desc = token_JSON[night.substring(0, 5) + "NightReminder"];
  const start = desc.indexOf('{') + 1;
  let tempNightText = ""
  if(start != 0){
    while (desc.includes('{') && desc.includes('}')) {
      tempNightText += desc.split('{')[0]; // Text before first '{'
      const afterFirstBrace = desc.slice(desc.indexOf('{') + 1);
      const content = afterFirstBrace.split('}')[0]; // Content inside first '{...}'
      desc = afterFirstBrace.slice(afterFirstBrace.indexOf('}') + 1); // Text after first '}'
      const [reminder, defaultText] = content.split('='); // Split inside content
      reminderExists = false
      players = document.getElementById("token_layer").getElementsByClassName("role_token");
      for (const player in players) {
        if(!isNaN(parseInt(player))){
          try {
            childTokens = players[player].getElementsByClassName("reminder drag");
            for(childtoken = 0; childtoken < childTokens.length; childtoken++){
              if(childTokens[childtoken].getAttribute("role") == token_JSON.id){
                remindertext = childTokens[childtoken].getElementsByClassName("reminder_text")[0].textContent
                if(remindertext==reminder){
                  
                  playerName = players[player].getElementsByClassName("token_text")[0].textContent;
                  if(playerName != ""){
                    if(reminderExists){
                      tempNightText += " and "
                    }
                    reminderExists = true;
                    tempNightText += playerName
                  }else{
                    if(reminderExists){
                      tempNightText += " and "
                    }
                    reminderExists = true;
                    tempNightText += " the "
                    tempNightText += tokens_ref[players[player].getAttribute("role")].name;
                  }
                }
              }            
            }
          } catch (error) {console.error(error)}      
        }     
      }
      if(!reminderExists){
        tempNightText += defaultText;
      }
    }
    
    tempNightText += desc
    span.innerHTML = tempNightText;
  }else{
    span.innerHTML = desc;
  }
  span.id = token_JSON.id + "_night_order_tab_span";
  div.appendChild(span);
  img = document.createElement("img");
  img.classList = "night_order_img";
  img.src = getTokenImageLink(token_JSON.id);
  div.setAttribute("ontouchstart", "javascript:nightOrderScroll('true')");
  div.setAttribute("ontouchend", "javascript:nightOrderScroll('false')");
  div.setAttribute("onmouseenter", "javascript:nightOrderScroll('true')");
  div.setAttribute("onmouseleave", "javascript:nightOrderScroll('false')");
  div.setAttribute("onclick", "javascript:expand_night_order_tab('" + token_JSON.id + "_night_order_tab')");
  div.appendChild(img);
  document.getElementById("night_order_tab_landing").appendChild(div);
}
function gen_night_order_tab_info(info)
{
  var default_info = {
    "MINION_INFO": "If this game does not have 7 or more players skip this.\nIf more than one Minion, they all make eye contact with each other. Show the \"This is the Demon\" card. Point to the Demon.",
    "DEMON_INFO": "If this game does not have 7 or more players skip this.\nShow the \"These are your minions\" card. Point to each Minion. Show the \"These characters are not in play\" card. Show 3 character tokens of good characters not in play.",
    "DAWN": "Wait approximately 10 seconds. Call for eyes open; immediately announce which players (if anyone) died",
    "DUSK": "Confirm all players have eyes closed. Wait approximately 10 seconds"
  }
  div = document.createElement("div");
  div.classList = "night_order_tab";
  img = document.createElement("img");
  img.classList = "night_order_img";
  img.src = "assets/" + info + ".png"
  div.appendChild(img);
  div.id = info + "_night_order_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , #999999)";
  div.setAttribute("ontouchstart", "javascript:nightOrderScroll('true')");
  div.setAttribute("ontouchend", "javascript:nightOrderScroll('false')");
  div.setAttribute("onmouseenter", "javascript:nightOrderScroll('true')");
  div.setAttribute("onmouseleave", "javascript:nightOrderScroll('false')");
  div.setAttribute("onclick", "javascript:expand_night_order_tab('" + info + "_night_order_tab')");
  span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = default_info[info];
  span.id = info + "_night_order_tab_span";
  div.appendChild(span);
  document.getElementById("night_order_tab_landing").appendChild(div);
}
function expand_night_order_tab(id)
{
  tab = document.getElementById(id)
  tab.style.width = "500px";
  tab.style.transform = "translateX(-410px)";
  tab.style.height = document.getElementById(id).scrollHeight;
  tab.setAttribute("onclick", "javascript:collapse_night_order_tab(event, '" + id + "')");
  if (tab.getElementsByClassName("night_order_fabled_token_container").length == 1 && tab.getElementsByClassName("night_order_fabled_token_container")[0].children.length != 0)
  {
    let container = tab.getElementsByClassName("night_order_fabled_token_container")[0];
    document.getElementById("token_drag_" + id).style = "position: absolute; height: 80px; left: " + container.offsetLeft + "; top: " + container.offsetTop + ";";
    var tokens = tab.getElementsByClassName("night_order_fabled_token_container")[0].children;
    // for (i = 0; i < tokens.length; i++) {
    //   spawnNightOrderGhost(tokens[i].offsetLeft, tokens[i].offsetTop, tokens[i].style.backgroundImage, tokens[i].id, container.id.match(/(?<=night_order_).*/)[0]);
    // }
  }
}
function collapse_night_order_tab(event, id)
{
  event.preventDefault()
  if (document.elementFromPoint(event.clientX, event.clientY).classList == "night_order_fabled_token_perm") { return; } // bad implementation to prvent tab from closing when spawing token
  tab = document.getElementById(id)
  tab.style.width = "90px";
  tab.style.transform = "translateX(0px)";
  tab.style.height = "90px";
  tab.setAttribute("onclick", "javascript:expand_night_order_tab('" + id + "')")
}
async function populate_jinx()
{
  clean_night_order();
  jinxes = await get_JSON("jinx.json");
  tokens = document.getElementById("token_layer").children;
  var inPlay = new Set();
  for (i = 0; i < tokens.length; i++)
  {
    var id = tokens[i].getAttribute("role");
    if (tokens[i].getAttribute("visibility") != "bluff") { inPlay.add(id); }
  }
  for (const token of inPlay)
  {
    for (i = 0; i < jinxes.length; i++)
    {
      if (jinxes[i].id == token)
      {
        for (j = 0; j < jinxes[i].jinx.length; j++)
        {
          if (inPlay.has(jinxes[i].jinx[j].id))
          {
            gen_jinxes_tab(jinxes[i].id, jinxes[i].jinx[j].id, jinxes[i].jinx[j].reason)
          }
        }
      }
    }
  }

}
function gen_jinxes_tab(id1, id2, reason)
{
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
  img1.src = getTokenImageLink(id1);
  img1.style = "width: 70%; position: absolute; top: 0px; left: 0px"
  img2 = document.createElement("img");
  img2.src = getTokenImageLink(id2);
  img2.style = "width: 70%; position: absolute; bottom: 0px; right: 0px"
  imgDiv.appendChild(img1);
  imgDiv.appendChild(img2);
  div.appendChild(imgDiv);
  div.setAttribute("ontouchstart", "javascript:nightOrderScroll('true')");
  div.setAttribute("ontouchend", "javascript:nightOrderScroll('false')");
  div.setAttribute("onmouseenter", "javascript:nightOrderScroll('true')");
  div.setAttribute("onmouseleave", "javascript:nightOrderScroll('false')");
  div.setAttribute("onclick", "javascript:expand_night_order_tab('" + id1 + "_" + id2 + "_jinx_tab" + "')");
  document.getElementById("night_order_tab_landing").appendChild(div);
}
function populate_fabled()
{
  clean_night_order();
  var fabled = DEFAULT_FABLED;
  CURRENT_SCRIPT.forEach((entry) =>
  {
    if (entry.id != "_meta")
    {
      var token = roles[entry.id];
      if (token["team"] == "fabled")
      {
        fabled.add(entry.id);
      }
    }
    return Promise.resolve();
  })
  fabled.forEach((fable) =>
  {
    var json = roles[fable];
    gen_fabled_tab(json, true);
    return Promise.resolve();
  })
}
function gen_fabled_tab(token_JSON, inPlay)
{
  var color = "#b3b300";
  if (!inPlay) { color = "#000000"; }
  var div = document.createElement("div");
  div.classList = "night_order_tab";
  div.id = token_JSON.id + "_night_order_tab";
  div.style.backgroundImage = "linear-gradient(to right, rgba(0,0,0,0) , " + color + ")";
  var span = document.createElement("span");
  span.classList = "night_order_span"
  span.innerHTML = token_JSON["ability"];
  span.id = token_JSON.id + "_night_order_tab_span";
  div.appendChild(span);
  var img = document.createElement("img");
  img.classList = "night_order_img";
  img.src = getTokenImageLink(token_JSON.id);
  var token_landing = document.createElement("div");
  token_landing.classList = "night_order_fabled_token_container"
  token_landing.id = "night_order_" + token_JSON.id;
  token_JSON["reminders"].forEach((token) =>
  {
    var uid = new Date().getTime()
    var token_perm = generateReminderBacking(token_JSON.id, token, uid)
    token_perm.id = `${token_JSON.id}_${token}`;
    token_perm.setAttribute("onclick", `javascript:spawnFabledReminder("${token_JSON.id}", "${token}")`)
    token_landing.appendChild(token_perm)
  })
  div.appendChild(token_landing);
  var token_drag = document.createElement("div");
  token_drag.id = "token_drag_" + token_JSON.id + "_night_order_tab";
  div.appendChild(token_drag);
  document.getElementById("night_order_tab_landing").appendChild(div);
  div.setAttribute("ontouchstart", "javascript:nightOrderScroll('true')");
  div.setAttribute("ontouchend", "javascript:nightOrderScroll('false')");
  div.setAttribute("onmouseenter", "javascript:nightOrderScroll('true')");
  div.setAttribute("onmouseleave", "javascript:nightOrderScroll('false')");
  div.setAttribute("onclick", "javascript:expand_night_order_tab('" + token_JSON.id + "_night_order_tab')");
  div.appendChild(img);
}
//open and close menu with m key
//could be expanded to allow for more keybinds
document.addEventListener('keydown', function(event) {
  const keyPressed = event.key; // Get the key that was pressed
  if(event.key == 'm'){
    document.getElementById("menu_main").style.transform == "translateX(0px)" ? close_menu() : open_menu();   
  }
});
