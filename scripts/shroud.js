// TODO: Shroud is also the name of the black ribbon-esque piece put on role tokens
// to indicate they are dead. Are we sure this name is correct for these things?

/** 
 * Shroud-specific data for what card to show for given IDs. 
 * 
 * This object has the following parameters:
 * title - Optional: The text that appears at the top of the shroud when displayed.
 * players
 * The title is what's shown at the top of the shroud. 
 * The players is the number of characters shown, by default, on the shroud.
 */
const CARDS = {
    "GENERAL_INFO": { 
        "cardTitle": "General Info", 
        "cardColor": "green",
        "title": "Info", 
        "icons": 0
    },
    "USE_ABILITY": { 
        "cardTitle": "Use Your Ability?",
        "cardColor": "brown",
        "title": "Use Your Ability?", 
        "icons": 0
    },
    "CHOOSE_SOMEONE": {
        "cardTitle": "Choose Player(s)",
        "cardColor": "brown",
        "title": "Choose a Player", 
        "icons": 0
    },
    "CHOOSE_CHARACTER": {
        "cardTitle": "Choose Character(s)",
        "cardColor": "brown",
        "title": "Choose a Character", 
        "icons": 1
    },
    "MINIONS": { 
        "cardTitle": "This is Your Demon",
        "cardColor": "red",
        "title": "This Is Your Demon", 
        "icons": 0,
    },
    "DEMONS": {
        "cardTitle": "These Are Your Minions",
        "cardColor": "red",
        "title": "These Are Your Minions",
        "icons": 0,
    },
    "BLUFFS": {
        "cardTitle": "Demon Bluffs",
        "cardColor": "blue",
        "title": "These Characters are Not In Play", 
        "icons": 3
    },
    "CHOSEN_BY": {
        "cardTitle": "You Were Chosen By", 
        "cardColor": "blue",
        "title": "You Have Been Chosen By", 
        "icons": 1,
        "autofill": true
    },
    "YOU_ARE": { 
        "cardTitle": "You Are", 
        "cardColor": "purple",
        "title": "You Are", 
        "icons": 1,
        "autofill": true
    },
    "THIS_PLAYER_IS": {
        "cardTitle": "This Player Is", 
        "cardColor": "purple",
        "title": "This Player Is",
        "icons": 1,
        "autofill": true
    },
    "DID_YOU_VOTE": {
        "cardTitle": "Did you Vote Today?", 
        "cardColor": "orange",
        "title": "Did You Vote Today?", 
        "icons": 0,
        "icons_fixed": true
    }
}

let roleCards = {}

function getCard(cardId) {
    return roleCards[cardId] || CARDS[cardId];
}

function repopulate_info_list(roleId) {
    roleCards = roles[roleId]["shrouds"] || {};

    const list = document.getElementById("info_list_scroll");
    list.innerHTML = "";

    let allCards = {...roleCards, ...CARDS}

    for (const cardId in allCards) {
        const card = allCards[cardId];
        const color = card["cardColor"] || "green"

        const div = document.createElement("div");
        div.classList.add("background-image", "info_list_scroll_option");
        div.onclick = () => load_playerinfo_shroud(cardId);
        div.style.backgroundImage = `url(assets/cards/card-${color}.png)`

        const span = document.createElement("span");
        span.innerText = card["cardTitle"];
        div.appendChild(span);

        list.appendChild(div);
    }
}

/**
 * Depending on the shroud being shown, prefill special information into the
 * shroud for Storyteller convenience.
 * @param {String} typeId The ID of the shroud being shown.
 */
function mapped_specials(typeId) {
    switch (typeId) {
        case "BLUFFS":
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
        case "GENERAL_INFO":
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
 * Show a particular shroud (information display screen), to show to a player.
 * @param {String} typeId The ID of the shroud to show the player.
 */
function load_playerinfo_shroud(typeId) {
    const card = getCard(typeId);
    document.getElementById("playerinfo_shoud").style.display = "inherit";
    document.getElementById("playerinfo_title").innerHTML = card["title"];
    document.getElementById("playerinfo_character_landing").innerHTML = "";
    for (i = 0; i < card["icons"]; i++) {
        add_playerinfo_character_box()
    }
    mapped_specials(typeId);

    if (card["icons_fixed"] === true) {
        document.getElementById("playerinfo_extra_button").style.visibility = "hidden";
    } else {
        document.getElementById("playerinfo_extra_button").style.visibility = "visible";
    }

    if (card["autofill"] === true) {
        select_playerinfo_character(0, document.getElementById("info_list").getAttribute("current_player"));
    }

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

/**
 * Close the currently displayed shroud.
 */
function close_playerinfo_shroud()
{
  document.getElementById("playerinfo_shoud").style.display = "none";
}
