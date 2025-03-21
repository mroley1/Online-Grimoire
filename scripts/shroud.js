// TODO: Shroud is the name of the black ribbon-esque piece put on role tokens
// to indicate they are dead. Are we sure this name is correct for these things?

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
 * Depending on the shroud being shown, prefill special information into the
 * shroud for Storyteller convenience. 
 * @param {Number} typeId The ID of the shroud being shown. 
 */
function mapped_specials(typeId) {
  if (typeId == 8 || typeId == 9) {
    document.getElementById("playerinfo_extra_button").style.display = "none";
  } else {
    document.getElementById("playerinfo_extra_button").style.display = "inline-block";
  }
  switch (typeId) {
    case 2:
      var bluffs = [];
      var tokens = document.getElementById("token_layer").children;
      for (i = 0; i < tokens.length; i++) {
        if (tokens[i].getAttribute("visibility") == "bluff") {
          bluffs.push(tokens[i].id.match(/.*(?=_token_)/)[0])
        }
      }
      var places = document.getElementById("playerinfo_character_landing").children
      for (i = 0; i < places.length; i++) {
        if (bluffs.length != 0) {
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
      function recalcHeight() {
        document.getElementById("playerinfo_body").style.top = "calc(50% - " + document.getElementById("playerinfo_body").clientHeight / 2 + "px)";
      }
      new ResizeObserver(recalcHeight).observe(input);
      input.id = "playerinfo_input"
      document.getElementById("playerinfo_character_landing").prepend(document.createElement("br"));
      document.getElementById("playerinfo_character_landing").prepend(input);
      break;
  }
}

/**
 * Show a shroud that fills the screen, allowing a user to show only specific
 * information to a player. 
 * @param {Number} typeId The ID of the shroud being shown
 */
function load_playerinfo_shroud(typeId) {
  const card = CARDS[typeId];
  document.getElementById("playerinfo_shoud").style.display = "inherit";
  document.getElementById("playerinfo_title").innerHTML = card["title"];
  document.getElementById("playerinfo_character_landing").innerHTML = "";
  for (i = 0; i < card["players"]; i++) {
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
  const prevNode = document.getElementById("playerinfo_character_" + (id - 1));
  if (prevNode == null) return;
  const character = prevNode.firstChild;
  if (character == null) return;
  div.appendChild(character.cloneNode(true));
}

/**
 * Set a callback on the roles in the mutate menu to change one of the
 * playerinfo entries to display that role. 
 * @param {String} id The ID of the entry that would be modified. 
 */
function trigger_playerinfo_character_select(id) {
  var townsfolk = document.getElementById("mutate_menu_townsfolk").children;
  for (i = 0; i < townsfolk.length; i++) {
    townsfolk[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + townsfolk[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  var outsiders = document.getElementById("mutate_menu_outsider").children;
  for (i = 0; i < outsiders.length; i++) {
    outsiders[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + outsiders[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  var minions = document.getElementById("mutate_menu_minion").children;
  for (i = 0; i < minions.length; i++) {
    minions[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + minions[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  var demons = document.getElementById("mutate_menu_demon").children;
  for (i = 0; i < demons.length; i++) {
    demons[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + demons[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  var travellers = document.getElementById("mutate_menu_traveller").children;
  for (i = 0; i < travellers.length; i++) {
    travellers[i].setAttribute("onclick", "select_playerinfo_character('" + id + "', '" + travellers[i].id.match(/(?<=mutate_menu_).*/) + "')")
  }
  document.getElementById("mutate_menu_main").style.display = "inherit";
}

/**
 * Change the display of one of the playerinfo entries in the shroud to a
 * character selected from the mutate menu. 
 * @param {String} id The id of the entry to be modified.
 * @param {String} selection The ID of a role whose token should be put in
 * this entry's slot.
 */
function select_playerinfo_character(id, selection) {
  const div = document.createElement("div");
  generateSampleToken(selection, div);

  div.style.position = "absolute";
  div.style.left = 25;
  div.style.width = 300;
  div.style.height = 300;

  document.getElementById("playerinfo_character_" + id).innerText = "";
  document.getElementById("playerinfo_character_" + id).appendChild(div);
}

/**
 * Close the currently displayed shroud. 
 */
function close_playerinfo_shroud() {
  document.getElementById("playerinfo_shoud").style.display = "none";
}
