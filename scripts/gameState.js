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
var roles = {};
/**
 * A list of all of the official roles this grimoire utility knows about.
 * Roles can only be added to this list via inclusion in tokens.json,
 * the source of truth for official BOTC characters.
 *
 * See also: {@link roles}
 */
var base_roles = {};
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
 * Convert the game state to a JSON string.
 * @returns A JSON string containing the game state.
 */
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

/**
 * Load a JSON string encoding the game state onto the grimoire.
 * @param {String} state a string encoding the JSON of a game state.
 */
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

/**
 * Take the game state of the grimoire and store it in local storage.
 */
function save_game_state()
{
  localStorage.setItem("state", generate_game_state_json())
}

/**
 * Upload a game state JSON from the computer and load it onto the grimoire.
 */
async function game_state_upload()
{
  let json = await document.getElementById("game_state_upload").files[0].text();
  load_game_state_json(json).then(() =>
  {
    save_game_state();
  })
}

/**
 * Convert the game state into a JSON file and download it
 * to the user's computer.
 */
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
