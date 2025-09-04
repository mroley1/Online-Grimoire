/**
 * Open the side menu.
 */
function open_menu() {
    if (document.getElementById("body_actual").getAttribute("night") == "false") {
        document.getElementById("menu_main").style.transform = "translateX(0px)";
    }
}

/**
 * Close the side menu.
 */
function close_menu() {
    if (document.getElementById("body_actual").getAttribute("night") == "false") {
        document.getElementById("menu_main").style.transform = "translateX(-300px)";
    }
}

/**
 * Change the player count by a given amount.
 * @param {Number} x The amount to change the player count by.
 */
function increment_player_count(x) {
    document.getElementById("player_count").value = parseInt(document.getElementById("player_count").value) + parseInt(x);
    player_count_change()
}

/**
 * Change expected role type distributions based on the number of players.
 * In the menu, this is the Y value in "X / Y".
 */
function player_count_change() {
    var player_count_tmp = document.getElementById("player_count").value;
    tableIndex = 0;
    if (player_count_tmp < 5) {
        document.getElementById("player_count").value = 5;
        player_count_tmp = 5
    }
    let player_count = player_count_tmp;
    if (player_count_tmp > 15) {
        player_count_tmp = 15
    }
    tableIndex = parseInt(player_count_tmp) - 5;
    var table = [[3, 0, 1, 1], [3, 1, 1, 1], [5, 0, 1, 1], [5, 1, 1, 1], [5, 2, 1, 1], [7, 0, 2, 1], [7, 1, 2, 1], [7, 2, 2, 1], [9, 0, 3, 1], [9, 1, 3, 1], [9, 2, 3, 1], [10, 2, 3, 1], [11, 2, 3, 1], [11, 3, 3, 1]]
    var counts = [0, 0, 0, 0, 0];
    tokens = document.getElementsByClassName("role_token");
    if (!loading) { //dont try to update player counts before menu is loaded
        var expected = new Object();
        // [hard modifier, soft positive modifier, soft negative modifier, locked?]
        expected.townsfolk = [table[tableIndex][0], 0, 0, false];
        expected.out = [table[tableIndex][1], 0, 0, false];
        expected.min = [table[tableIndex][2], 0, 0, false];
        expected.dem = [table[tableIndex][3], 0, 0, false];
        expected.trav = [0, 0, 0, false];
        async function makeupMod(id) {
            try {
                let lambdas = {
                    "HARD": ((cat, mod) => { expected[cat][0] += mod }),
                    "SOFTPOS": ((cat, mod) => { expected[cat][1] += mod }),
                    "SOFTNEG": ((cat, mod) => { expected[cat][2] += mod }),
                    "REQ": ((cat, val) => { }),
                    "LOCK": ((cat, val) => {
                        if (val == -1) {
                            expected[cat][0] = player_count;
                        } else {
                            expected[cat][0] = val;
                        }
                        expected[cat][3] = true;
                        expected[cat][1] = 0;
                        expected[cat][2] = 0;
                    })
                }
                let json = roles[id];
                json["change_makeup"].forEach(element => {
                    let changeKey = Object.keys(element)[0];
                    if (!expected[element[changeKey][0]][3]) {
                        lambdas[changeKey](element[changeKey][0], element[changeKey][1]);
                    }
                });
            } catch { }
            return Promise.resolve();
        }
        for (i = 0; i < tokens.length; i++) {
            let visibility = tokens[i].getAttribute("visibility");
            switch (tokens[i].getAttribute("cat")) {
                case "townsfolk":
                    if (visibility == "show") { counts[0]++; }
                    break;
                case "outsider":
                    if (visibility == "show") { counts[1]++; }
                    break;
                case "minion":
                    if (visibility == "show") { counts[2]++; }
                    break;
                case "demon":
                    if (visibility == "show") { counts[3]++; }
                    break;
                case "traveller":
                    if (visibility == "show") { counts[4]++; }
                    break;
            }
        }
        for (i = 0; i < tokens.length; i++) {
            makeupMod(tokens[i].id.match(/.*(?=_token_)/)[0])
        }
        function genSoftModString(pos, neg) {
            var string = " "
            var combined = 0;
            while (pos > 0 && neg > 0) {
                combined++;
                pos--;
                neg--;
            }
            if (combined > 0) {
                string += String.fromCharCode(177) + combined;
            }
            if (pos > 0) {
                string += " +" + pos;
            }
            if (neg > 0) {
                string += " -" + neg;
            }
            return string;
        }
        document.getElementById("ratio_townsfolk").innerHTML = counts[0] + "/" + expected["townsfolk"][0] + genSoftModString(expected["townsfolk"][1], expected["townsfolk"][2]);
        document.getElementById("ratio_outsider").innerHTML = counts[1] + "/" + expected["out"][0] + genSoftModString(expected["out"][1], expected["out"][2]);
        document.getElementById("ratio_minion").innerHTML = counts[2] + "/" + expected["min"][0] + genSoftModString(expected["min"][1], expected["min"][2]);
        document.getElementById("ratio_demon").innerHTML = counts[3] + "/" + expected["dem"][0] + genSoftModString(expected["dem"][1], expected["dem"][2]);
        if (player_count > 15 && !expected["trav"][3]) { expected["trav"][0] += player_count - 15 }
        document.getElementById("ratio_traveller").innerHTML = counts[4] + "/" + expected["trav"][0] + genSoftModString(expected["trav"][1], expected["trav"][2]);
    }
}

/**
 * Change actual role type distributions  based on the number of each role in
 * the grimoire.
 * This allows the user to see at a glance the number of each role, and if
 * there are more than 1 copies of a role on the grim.
 */
function update_role_counts() {
    var counts = document.getElementsByClassName("menu_token_count");
    for (let i = 0; i < counts.length; i++) {
        counts[i].innerHTML = 0;
    }
    var tokens = document.getElementsByClassName("role_token");
    for (let i = 0; i < tokens.length; i++) {
        id = tokens[i].getAttribute("id").match(/.*(?=_token)/)[0];
        try {
            if (tokens[i].getAttribute("visibility") == "show") {
                document.getElementById(id + "_count").innerHTML = parseInt(document.getElementById(id + "_count").innerHTML) + 1;
            }
        }
        catch (e) { }

    }

}

/**
 * Toggle the collapsible in the menu that contains the script selection
 * infomration.
 */
function toggle_menu_collapse() {
    const dropdown = document.getElementById("menu_settings_dropdown");
    if (dropdown.getAttribute("expand") == "true") {
        dropdown.setAttribute("expand", "false");
        dropdown.style.height = "40px";
    } else {
        dropdown.setAttribute("expand", "true");
        dropdown.style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
    }
}

/**
 * Swap around all of the role tokens randomly, effectively randomizing
 * all players' characters. Assumes all of the desired characters have
 * been placed on the grimoire already.
 */
function shuffle_roles() {
    if (document.getElementById("body_actual").getAttribute("night") == "true") { visibility_toggle() }
    function shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        hideInfo();
    }
    let tokens = document.getElementById("token_layer").children;
    var ids = [];
    for (i = 0, j = 0; i < tokens.length; i++) {
        if (tokens[i].getAttribute("visibility") == "show" && tokens[i].getAttribute("cat") != "fabled") {
            ids[j++] = tokens[i].id.match(/.*(?=_token_)/)[0];
        }
    }
    shuffle(ids);
    for (let i = 0, j = 0; i < tokens.length; i++) {
        if (tokens[i].getAttribute("visibility") == "show") {
            mutate_token(tokens[i].id.match(/.*(?=_token_)/)[0], tokens[i].getAttribute("uid"), ids[j++]);
        }
    }
}

/**
 * Delete all of the roles, reminders, and other tokens on the grimoire.
 */
function clean_board() {
    const tokens = document.getElementById("token_layer").children;
    for (let it = tokens.length - 1; it >= 0; it--) {
        remove_token(tokens[it].id.match(/.*(?=_token_)/)[0], tokens[it].getAttribute("uid"))
    }
    document.getElementById("reminder_layer").innerHTML = "";
    
    resetDragPipLayer();

    clear_night_order();
    save_game_state();
}

/**
 * Open the side menu.
 */
document.addEventListener('keydown', function (event) {
    const keyPressed = event.key; // Get the key that was pressed
    if (event.key == 'm') {
        document.getElementById("menu_main").style.transform == "translateX(0px)" ? close_menu() : open_menu();
    }
});
