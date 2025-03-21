/**
 * A list of all of the roles that this grimoire Utility currently knows about. 
 * Roles can be added to this list in one of three ways: 
 * 
 * 1. Being a part of the tokens.json file, the source of truth for official 
 * BOTC characters.
 * 
 * 2. Being part of the script used according to the currently saved gamestate.
 * 
 * 3. The user uploading a script containing a desired role.
 * 
 * Roles added persist until the page is reloaded, at which point points
 * 1 and 2 will add their roles back. By importing multiple scripts, it's
 * possible to mix and match roles from multiple homewbrew scripts.
 * 
 * The roles conform to a format as specified by the BOTC developers at
 * https://github.com/ThePandemoniumInstitute/botc-release/blob/main/README.md.
 */
var tokens_ref = {};
/**
 * A list of all the roles included in the current script. 
 * 
 * "Official" roles have all of their role information stored within the 
 * {@link roles} and {@link base_roles} objects. They only need to specify 
 * the role ID. Additional homewbrew roles need to also provide all of the 
 * role information expected of a normal role. See {@link roles} for more
 * information.
 */
var CURRENT_SCRIPT;
/**
 * Whether the application is loading. Set to true for the first few seconds
 * of application loading as data is synced from the server, or when loading
 * an uploaded gamestate from the grimoire. Saving is not possible while 
 * loading is occuring.
 */
var loading = false;

/**
 * Load all non-JS files into the application to finish initialization.
 * This function is called as soon as the HTML is loaded. 
 */
async function loaded() {
  // ? TODO better scripts menu
  // TODO fullscreeen settings menu
  // TODO better fabled tokens
  // ? TODO pip layer clean up prompt delete
  // TODO clean up saving and loading 
  // * TODO fancify night widget
  // * TODO higher player limit to include travellers
  loading = true;
  tokens_ref = await get_JSON("tokens.json");
  dragPipLayerSpawnDefault("good");
  dragPipLayerSpawnDefault("evil");
  dragPipLayerSpawnDefault("reminder_pip");
  load_scripts().then(() => {
    load_game_state_json(localStorage.getItem("state"))
  })
  setTimeout(function () {
    loading = false;
    player_count_change();
  }, 2000)
  document.getElementById("body_actual").setAttribute("orientation", getOrientation())
  window.onresize = resized;
}

/**
 * Convert the game state to a JSON string.
 * @returns A JSON string containing the game state.
 */
function generate_game_state_json() {
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
  for (i = 0; i < players.length; i++) {
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
  }
  state.reminders = [];
  reminders = document.getElementById("remainerLayer").getElementsByClassName("reminder");
  for (i = 0; i < reminders.length; i++) {
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

/**
 * Load a JSON string encoding the game state onto the grimoire.
 * @param {String} state a string encoding the JSON of a game state.
 */
async function load_game_state_json(state) {
  state = JSON.parse(state);
  if (state == null) {
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
  for (let i = 0; i < state.players.length; i++) {
    spawnToken(state.players[i].role, state.players[i].uid, state.players[i].visibility, state.players[i].cat, state.players[i].hide_face, state.players[i].viability, state.players[i].left, state.players[i].top, state.players[i].name)
  }
  for (const reminder of state.reminders) {
    if (!reminder.text) {
      const idParts = reminder.id.split("_");
      reminder.id = idParts[0];
      reminder.text = idParts.slice(1).map(x => x[0].toUpperCase() + x.substring(1)).join(" ");
    }
    spawnReminder(reminder.id, reminder.text, reminder.uid, reminder.left, reminder.top);
  }
  for (const pip of state.pips) {
    dragPipLayerSpawn(pip.type, pip.left, pip.top, "false")
  }
  if (state.orientation != getOrientation()) {
    orientationChange();
  }
  loading = false;
}

/**
 * Take the game state of the grimoire and store it in local storage.
 */
function save_game_state() {
  // TODO: Put the "if !loading" bit in here.
  localStorage.setItem("state", generate_game_state_json())
}

/**
 * Upload a game state JSON from the computer and load it onto the grimoire.
 */
async function game_state_upload() {
  let json = await document.getElementById("game_state_upload").files[0].text();
  load_game_state_json(json).then(() => {
    save_game_state();
  })
}

/**
 * Convert the game state into a JSON file and download it
 * to the user's computer.
 */
function download_game_state() {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(generate_game_state_json()));
  element.setAttribute('download', "game_state.json");
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Get a JSON file from the server.
 * @param {String} path A relative path to the file on the server.
 * @returns the JSON string from that file. 
 */
async function get_JSON(path) {
  return await (await fetch("./data/" + path)).json();
}

/**
 * Load all of the scripts from the server. 
 */
async function load_scripts() {
  var scripts = await get_JSON("scripts/scripts.json")
  var initScript;
  for (i = 0; i < scripts.length; i++) {
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

/**
 * Initialize the selected script from the script_options dropdown.
 */
async function script_select() {
  var script_names = await get_JSON("scripts/scripts.json");
  var script = await get_JSON("scripts/" + script_names[document.getElementById("script_options").options.selectedIndex]["file"] + ".json");
  document.getElementById("script_upload_feedback").setAttribute("used", "select");
  document.getElementById("script_upload").value = "";
  populate_script(script);
  document.getElementById("menu_settings_dropdown").style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
  if (!loading) { save_game_state(); }
}

/**
 * Upload a script to the Grimoire.
 */
async function script_upload() {
  let json = JSON.parse(await document.getElementById("script_upload").files[0].text());
  if (typeof json[1] == typeof "") {
    for (var i = 0; i < json.length; i++) {
      if (typeof json[i] == typeof "") {
        json[i] = { "id": json[i] };
      }
    }
  }
  try {
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

// TODO: This one might belong - with a better name - in menu.js.
/**
 * Given a JSON script, populate the side menu with the various characters
 * listed in the script. 
 * @param {Object} script a container with all of the characters in the script
 */
async function populate_script(script) {
  CURRENT_SCRIPT = script;
  document.getElementById("script_upload_feedback").innerHTML = script[0]["name"];
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
    landing.insertAdjacentHTML("beforeend", "<hr style='margin-block-end: 0em;'>");
  }
  function options(type, tokenNames, text) {
    var landing = document.getElementById(type)
    for (i = 0; i < tokenNames.length; i++) {
      var tokenJSON = tokenNames[i];
      if (tokenJSON.team == type) {
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
    //edit by @The-ai123
    //Add button to add offscreen of each category
    var outer_div = document.createElement("div");
    outer_div.classList = "menu_list_div";
    outer_div.title = title = "Add offscript " + text;
    outer_div.setAttribute("onclick", "add_offscript_character('" + type + "')");
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
  function clear(div) {
    document.getElementById(div).innerHTML = ""
  }
  let scriptTokens = [];
  script.forEach(element => {
    if (element.id.substring(0, 1) != "_") {
      try { scriptTokens.push(tokens_ref[element.id]) } catch { }
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