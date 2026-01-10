/**
 * Open the info box, with all the information about a given role token.
 * @param {String} id The ID of the role.
 * @param {String} uid The UID of the role token.
 */
async function infoCall(id, uid) {
    close_menu();
    let data_token = document.getElementById(id + "_token_" + uid);
    generateSampleToken(id, document.getElementById("info_img"));
    const role = roles[id];
    document.getElementById("info_title_field").innerHTML = role["name"];
    document.getElementById("info_name_field").innerHTML = data_token.children.namedItem(id + "_name_" + uid).innerHTML;
    document.getElementById("info_img_name").innerHTML = data_token.children.namedItem(id + "_name_" + uid).innerHTML;
    document.getElementById("info_desc_field").innerHTML = role["ability"];
    document.getElementById("info_list").setAttribute("current_player", id);
    document.getElementById("info_token_landing").innerHTML = "";
    document.getElementById("info_remove_player").setAttribute("onclick", "javascript:remove_token('" + id + "', '" + uid + "')");
    document.getElementById("info_kill_cycle").setAttribute("onclick", "javascript:info_death_cycle_trigger('" + id + "', '" + uid + "')");
    document.getElementById("info_visibility_toggle").setAttribute("onclick", "javascript:cycle_token_visibility_toggle('" + id + "', '" + uid + "')");
    document.getElementById("info_edit_role").setAttribute("onclick", "javascript:mutate_menu('" + id + "', '" + uid + "')");
    document.getElementById("info_box").setAttribute("hidden", data_token.getAttribute("visibility"));
    document.getElementById("info_name_input").value = data_token.children.namedItem(id + "_name_" + uid).innerHTML;
    document.getElementById("info_name_input").setAttribute("onchange", "javascript:nameIn('" + id + "', " + uid + ")");
    document.getElementById("info_box").style.display = "inherit";
    document.getElementById("info_token_dragbox").innerHTML = "";

    if (role["flavor"] !== undefined) {
        document.getElementById("info_flavor_field").innerHTML = `"${(role["flavor"] ?? "").replaceAll(/\n[\t ]*/g, " / ")}"`;
        let color;
        switch (role.team) {
            case "townsfolk":
            case "outsider":
            default:
                color = "rgb(176, 176, 230)";
                break;
            case "minion":
            case "demon":
                color = "rgb(230, 176, 176)";
                break;
            case "fabled":
                color = "rgb(230, 230, 176)"
                break;
            case "traveller":
                color = "rgb(230, 176, 230)"
        }
        document.getElementById("info_flavor_field").style.color = color;
    } else {
        document.getElementById("info_flavor_field").innerHTML = "";
    }

    update_info_death_cycle(id, uid);
    
    appendCardsToInfoList(role);

    if (role.reminders == undefined) return;

    const landing = document.getElementById("info_token_landing");

    for (const reminder of role.reminders) {
        const backing = generateReminderBacking(id, reminder, uid);
        // div.setAttribute("reminderId", i);
        document.getElementById("info_token_landing").appendChild(backing);

        const x = backing.getBoundingClientRect().x - landing.getBoundingClientRect().x;
        const y = backing.getBoundingClientRect().y - landing.getBoundingClientRect().y;
        // x, y, roleName, reminder info, id
        spawnReminderGhost(x, y, id, reminder, backing.id);
    }
}

/**
 * Close the info box.
 */
function hideInfo() {
    document.getElementById("info_box").style.display = "none";
}

/**
 * Change the name of a token to be what the user entered in
 * the name input field.
 * @param {String} id The ID of the role
 * @param {String} uid The Unique ID of the token.
 */
function nameIn(id, uid) {
    let value = document.getElementById("info_name_input").value;
    document.getElementById(id + "_name_" + uid).innerHTML = value;
    document.getElementById("info_name_field").innerHTML = value;
    document.getElementById("info_img_name").innerHTML = value;
}

/**
 * Cycle through the visibility of a token. Tokens
 * transition from Show --> Bluff --> Hide --> Show.
 * Tokens only appear in Town Square if they are set to Show.
 * @param {String} id The role ID of the token being affected.
 * @param {String} uid  The Unique ID of the token being affected.
 */
function cycle_token_visibility_toggle(id, uid) {
    switch (document.getElementById(id + "_token_" + uid).getAttribute("visibility")) {
        case "show":
            document.getElementById(id + "_token_" + uid).setAttribute("visibility", "bluff");
            document.getElementById("info_box").setAttribute("hidden", "bluff");
            break;
        case "bluff":
            document.getElementById(id + "_token_" + uid).setAttribute("visibility", "hide");
            document.getElementById("info_box").setAttribute("hidden", "hide");
            break;
        case "hide":
            document.getElementById(id + "_token_" + uid).setAttribute("visibility", "show");
            document.getElementById("info_box").setAttribute("hidden", "show");
            break;
    }
    update_role_counts();
    validateSetup();
    populate_night_order();
    if (!loading) { save_game_state(); }
}

/**
 * Expand one of the subtabs in the info box.
 * @param {"desc"|"list"|"rmnd"|"powr"} tab The name of the tab to open.
 */
function expand_info_tab(tab) {
    document.getElementById("info_desc").setAttribute("focus", "false");
    document.getElementById("info_list").setAttribute("focus", "false");
    document.getElementById("info_rmnd").setAttribute("focus", "false");
    document.getElementById("info_powr").setAttribute("focus", "false");
    document.getElementById("info_rmnd").style.overflow = "hidden";
    switch (tab) {
        case 'desc':
            document.getElementById("info_desc").setAttribute("focus", "true");
            break;
        case 'list':
            document.getElementById("info_list").setAttribute("focus", "true");
            break;
        case 'rmnd':
            document.getElementById("info_rmnd").setAttribute("focus", "true");
            setTimeout((() => { document.getElementById("info_rmnd").style.overflow = "visible"; }), 200) // because overflow needs to be visible/ delays until after animation
            break;
        case 'powr':
            document.getElementById("info_powr").setAttribute("focus", "true");
            break;
    }
}

/**
 * Cycle the viability of a token, from the info box. See {@link deathCycle}
 * for more.
 * @param {String} id The role ID of the token being affected.
 * @param {String} uid  The Unique ID of the token being affected.
 */
function info_death_cycle_trigger(id, uid) {
    deathCycle(id, uid);
    update_info_death_cycle(id, uid);
}

/**
 * Update the state of the viability cycling button in the info box.
 * @param {String} id The role ID of the token being affected.
 * @param {String} uid  The Unique ID of the token being affected.
 */
function update_info_death_cycle(id, uid) {
    switch (document.getElementById(id + "_token_" + uid).getAttribute("viability")) {
        case "alive":
            document.getElementById("info_kill_cycle").style.backgroundImage = "url('assets/tombstone.png')"
            break;
        case "dead_vote":
            document.getElementById("info_kill_cycle").style.backgroundImage = "url('assets/vote.png')"
            break;
        case "dead":
            document.getElementById("info_kill_cycle").style.backgroundImage = "url('assets/revive.png')"
            break;
    }
}
