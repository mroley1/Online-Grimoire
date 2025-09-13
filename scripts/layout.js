/**
 * Get the webpage orientation.
 * @returns "portrait" or "landscape", if the webpage is one of those.
 */
function getOrientation() {
    if (window.innerHeight > window.innerWidth) {
        return "portrait";
    } else {
        return "landscape";
    }
}

/**
 * Called whenever the browser detects the webpage is resized.
 */
function resized() {
    if (document.getElementById("body_actual").getAttribute("orientation") != getOrientation()) {
        orientationChange();
    }
    document.getElementById("body_actual").setAttribute("orientation", getOrientation());
}

/**
 * Swap the coordinates of an HTML element, effectively swapping its orientation.
 * This will cause its position to be reflected across a diagonal 45 degree line
 * starting at the top left corner and going down to the right.
 * @param {HTMLElement} HTMLobj The HTML element to swap the orientation of.
 */
function swapObjectOrientation(HTMLobj) {
    tmp = HTMLobj.style.top;
    HTMLobj.style.top = HTMLobj.style.left;
    HTMLobj.style.left = tmp;
}

/**
 * Called when the orientation of the browser changes from portrait
 * to landscape or vice versa. This attempts to keep all of the tokens
 * on the screen.
 */
function orientationChange() {
    players = document.getElementById("token_layer").getElementsByClassName("role_token");
    for (i = 0; i < players.length; i++) {
        swapObjectOrientation(players[i]);
    }
    reminders = document.getElementById("reminder_layer").getElementsByClassName("reminder");
    for (i = 0; i < reminders.length; i++) {
        swapObjectOrientation(reminders[i]);
    }
    pips = document.getElementById("interactivePlane").getElementsByClassName("reminder");
    for (i = 0; i < pips.length; i++) {
        if (pips[i].getAttribute("stacked") == "false") {
            swapObjectOrientation(pips[i]);
        }
    }
}

/**
 * Toggle the visibility between the grimoire mode and the "Town Square" mode.
 * In grimoire mode, all of the tokens' information is visible for the ST to
 * manipulate as they wish. In Town Square mode, only the aliveness of players
 * is visible.
 */
function visibility_toggle() {
    tokens = document.getElementById("token_layer").getElementsByClassName("role_token");
    if (document.getElementById("body_actual").getAttribute("night") == "false") { // ! nighttime
        document.getElementById("body_actual").setAttribute("night", "true");
        for (const token of tokens) {
            if (token.getAttribute("cat") == "fabled") continue;
            var id = token.getAttribute("role");
            var uid = token.getAttribute("uid");
            token.style.backgroundImage = "";
            token.setAttribute("onclick", "javascript:deathCycle('" + id + "', " + uid + ")");
        }
    } else {                                                                     // ! daytime
        document.getElementById("body_actual").setAttribute("night", "false");
        for (const token of tokens) {
            if (token.getAttribute("cat") == "fabled") continue;
            var id = token.getAttribute("role");
            var uid = token.getAttribute("uid");
            token.style.backgroundImage = "url('assets/token.png')"
            token.setAttribute("onclick", "javascript:infoCall('" + id + "', " + uid + ")");
        }
    }
    clear_night_order();
}

/**
 * Cycle through the viability of a token. Tokens
 * transition from Alive --> Dead with a vote --> Dead --> Alive.
 * @param {String} id The role ID of the token being affected.
 * @param {String} uid  The Unique ID of the token being affected.
 */
function deathCycle(id, uid) {
    let token = document.getElementById(id + "_token_" + uid);
    switch (token.getAttribute("viability")) {
        case "alive": //toDeadVote
            token.setAttribute("viability", "dead_vote");
            break;
        case "dead_vote": //toDead
            token.setAttribute("viability", "dead");
            break;
        case "dead": // toAlive
            token.setAttribute("viability", "alive");
            break;
        default: token.setAttribute("viability", "alive");
    }
    populate_night_order();
    if (!loading) { save_game_state(); }
}

/**
 * Toggle the button that enables/disables the ability to move tokens.
 */
function move_toggle() {
    var self = document.getElementById("move_toggle")
    if (self.style.backgroundColor == "green") {
        self.style.backgroundColor = "rgb(66, 66, 66)";
    } else {
        self.style.backgroundColor = "green";
    }
}

/**
 * Toggle the button that enables/disables the ability to attach reminders
 * directly to role tokens.
 */
function attach_toggle() {
    var self = document.getElementById("attach_toggle")
    if (self.style.backgroundColor == "green") {
        self.style.backgroundColor = "rgb(66, 66, 66)";
    } else {
        self.style.backgroundColor = "green";
    }
}

/**
 * Show the menu that allows the user to change the background.
 */
function change_background_menu() {
    document.getElementById("background_select_menu").style.display = "inherit";
}

/**
 * Hide the menu that allows the user to change the background.
 */
function change_background_menu_hide() {
    document.getElementById("background_select_menu").style.display = "none";
}

/**
 * Change the background image of the grimoire to this file.
 * @param {String} file_name The name of the file.
 */
function background_image_change(file_name) {
    document.getElementById("body_actual").style.setProperty("--BG-IMG", "url('assets/backgrounds/" + file_name + ".webp')");
    if (!loading) { save_game_state(); }
}
