/**
 * Set the logic for the mutate menu: When a token on the menu is clicked,
 * the token specified in this function call will be "mutated" into the
 * selected character.
 * @param {*} id The ID (name) of the token to mutate.
 * @param {*} uid A Unique ID for the token to mutate.
 */
function mutate_menu(id, uid) {
    var townsfolk = document.getElementById("mutate_menu_townsfolk").children;
    for (i = 0; i < townsfolk.length; i++) {
        townsfolk[i].setAttribute("onclick", "mutate_token('" + id + "', " + uid + ", '" + townsfolk[i].id.match(/(?<=mutate_menu_).*/) + "')")
    }
    var outsiders = document.getElementById("mutate_menu_outsider").children;
    for (i = 0; i < outsiders.length; i++) {
        outsiders[i].setAttribute("onclick", "mutate_token('" + id + "', " + uid + ", '" + outsiders[i].id.match(/(?<=mutate_menu_).*/) + "')")
    }
    var minions = document.getElementById("mutate_menu_minion").children;
    for (i = 0; i < minions.length; i++) {
        minions[i].setAttribute("onclick", "mutate_token('" + id + "', " + uid + ", '" + minions[i].id.match(/(?<=mutate_menu_).*/) + "')")
    }
    var demons = document.getElementById("mutate_menu_demon").children;
    for (i = 0; i < demons.length; i++) {
        demons[i].setAttribute("onclick", "mutate_token('" + id + "', " + uid + ", '" + demons[i].id.match(/(?<=mutate_menu_).*/) + "')")
    }
    var travellers = document.getElementById("mutate_menu_traveller").children;
    for (i = 0; i < travellers.length; i++) {
        travellers[i].setAttribute("onclick", "mutate_token('" + id + "', " + uid + ", '" + travellers[i].id.match(/(?<=mutate_menu_).*/) + "')")
    }
    var travellers = document.getElementById("mutate_menu_fabled").children;
    for (i = 0; i < travellers.length; i++) {
        travellers[i].setAttribute("onclick", "mutate_token('" + id + "', " + uid + ", '" + travellers[i].id.match(/(?<=mutate_menu_).*/) + "')")
    }
    document.getElementById("mutate_menu_main").style.display = "inherit";
}

/**
 * Close and hide the mutate menu.
 */
function close_mutate_menu() {
    document.getElementById("mutate_menu_main").style.display = "none";
    document.getElementById("mutate_menu_all_main").style.display = "none";
}

/**
 * Add all of the tokens on this script into the mutate menu.
 * @param {*} tokens A list of all of the tokens.
 */
function populate_mutate_menu(tokens) {
    tokens.forEach((element) => {
        var div = document.createElement("div");
        div.id = "mutate_menu_" + element["id"];
        generateSampleToken(element["id"], div);
        div.classList = "background_image mutate_menu_token";
        if (element["team"] in TEAM_TYPES) {
            document.getElementById("mutate_menu_" + element["team"]).appendChild(div);
        }
    })
}

/**
 * Delete all of the tokens from the mutate menu.
 */
function clear_mutate_menu() {
    document.getElementById("mutate_menu_townsfolk").innerHTML = "";
    document.getElementById("mutate_menu_outsider").innerHTML = "";
    document.getElementById("mutate_menu_minion").innerHTML = "";
    document.getElementById("mutate_menu_demon").innerHTML = "";
    document.getElementById("mutate_menu_traveller").innerHTML = "";
}

/**
 * Change the role of this token.
 * @param {*} idFrom The current role ID of the token being changed.
 * @param {*} uid The Unique ID of the token being changed.
 * @param {*} idTo The role ID that the token should be changed to.
 */
function mutate_token(idFrom, uid, idTo) {
    let new_json = roles[idTo];

    let subject = document.getElementById(idFrom + "_token_" + uid);

    subject.setAttribute("cat", new_json["team"]);
    if (new_json["team"] == "traveller") { subject.getElementsByClassName("token_outsider_betray")[0].style.backgroundImage = `url(${getTokenImageLink(idTo)})` }
    else { subject.getElementsByClassName("token_outsider_betray")[0].style.backgroundImage = "" }

    subject.setAttribute("show_face", !new_json["hide_face"]);
    subject.setAttribute("role", new_json["id"]);
    subject.style.backgroundImage = "url('assets/token.png')";
    subject.setAttribute("onclick", "javascript:infoCall('" + idTo + "', " + uid + ")");
    subject.id = idTo + "_token_" + uid;

    const image = document.getElementById(`${idFrom}_${uid}_image`);
    image.id = `${idTo}_${uid}_image`;
    image.src = getTokenImageLink(idTo);

    document.getElementById(idFrom + "_" + uid + "_death").id = idTo + "_" + uid + "_death";
    document.getElementById(idFrom + "_" + uid + "_visibility_pip").id = idTo + "_" + uid + "_visibility_pip";
    document.getElementById(idFrom + "_" + uid + "_vote").id = idTo + "_" + uid + "_vote";
    document.getElementById(idFrom + "_name_" + uid).id = idTo + "_name_" + uid;

    const name_text = document.getElementById(`${idFrom}_${uid}_name_text`);
    name_text.id = `${idTo}_${uid}_name_text`;
    name_text.textContent = new_json["name"];

    clean_tokens(uid);
    if (document.getElementById("info_box").style.display == "inherit") { infoCall(idTo, uid); }
    if (!loading) { save_game_state(); }
}

/**
 * Open the token mutation menu, but allow the selection of all known tokens
 * of a given character type, including characters not on this script, that the
 * `roles` object knows about.
 * @param {String} type The type of character to add to this mutation menu section.
 * @author The-ai123
 */
function add_offscript_character(token_class) {
    document.getElementById("mutate_menu_all").innerHTML = "";
    for (const element of Object.values(roles)) {
        if (element.team != token_class) continue
        try {
            var div = document.createElement("div");
            div.id = "mutate_menu_all";
            generateSampleToken(element["id"], div);
            div.classList = "background_image mutate_menu_token";
            div.setAttribute("onclick", "spawnTokenDefault('" + element["id"] + "', '" + token_class + "', 'alive')")
            document.getElementById("mutate_menu_all").appendChild(div);
        } catch { }
    }
    document.getElementById("mutate_menu_all_main").style.display = "inherit";
}