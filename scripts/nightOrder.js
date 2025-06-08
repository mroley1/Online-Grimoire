/**
 * The role IDs of the default fabled.
 */
const DEFAULT_FABLED = new Set(["doomsayer", "angel", "buddhist", "hellslibrarian", "revolutionary", "fiddler", "toymaker"]);

/**
 * Open the tab assosciated withthe selected Night Order button.
 * Only one tab can be open at any time.
 * If it's already open, close it instead.
 * @param {String} type The ID of the Night Order tab to open or close.
 */
function toggle_night_order_buttons(type) {
    if (document.getElementById("nightorder_button_container").getAttribute("nightOrder") == type) {
        clean_night_order();
        document.getElementById("nightorder_button_container").setAttribute("nightOrder", "none");
    } else {
        switch (type) {
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

/**
 * Delete all data assosciated with all night order entries. This ensures
 * a clean slate from which new data can be added to the tab.
 */
function clean_night_order() {
    document.getElementById("night_order_tab_landing").innerHTML = ""
    document.getElementById("first_night").style.color = "";
    document.getElementById("other_night").style.color = "";
    document.getElementById("jinx_toggle").style.color = "";
}

/**
 * Regenerate the night order list, utilizing in-play and alive player data.
 */
async function populate_night_order() {
    night = document.getElementById("nightorder_button_container").getAttribute("nightOrder");
    if (night == "jinx") {
        populate_jinx();
        return;
    }
    clean_night_order();
    if (night == "none") { return; }
    // TODO: deprecate the nightsheet. Its data is built into the tokens, and there are errors (Acrobat) that make it unsuitable.
    var order = await get_JSON("nightsheet.json")
    order = order[night];
    tokens = document.getElementById("token_layer").children;
    var inPlay = new Set();
    var alive = new Set();
    for (i = 0; i < tokens.length; i++) {
        var id = tokens[i].getAttribute("role");
        if (tokens[i].getAttribute("viability") == "alive" && tokens[i].getAttribute("visibility") != "bluff") { alive.add(id); }
        if (tokens[i].getAttribute("visibility") != "bluff") { inPlay.add(id); }
    }
    for (i = 0; i < order.length; i++) {
        if (inPlay.has(order[i])) {
            gen_night_order_tab_role(roles[order[i]], night, (alive.has(order[i])) ? false : true)
        }
        if (order[i].toUpperCase() == order[i]) {
            gen_night_order_tab_info(order[i])
        }
    }
}

/**
 * Hide the nightOrder tab, and clear its data.
 */
function clear_night_order() {
    clean_night_order();
    document.getElementById("nightorder_button_container").setAttribute("nightOrder", "none");
}

/**
 * Enable or disable scrolling on touch.
 * When panning the tab with a touchscreen, the elements within should not
 * be toggled during the scroll.
 * @param {Boolean} enable Whether scrolling is the default behaviour currently.
 */
function nightOrderScroll(enable) {
    if (enable == "true") {
        document.getElementById("night_order_landing_container").style.pointerEvents = "all";
    } else if (enable == "false") {
        document.getElementById("night_order_landing_container").style.pointerEvents = "none";
    }
}

/**
 * Add a character's role entry to the nightOrder tab.
 * @param {*} token_JSON the role JSON for the character to add to the night order.
 * @param {String} night The type of night: either the firstNight or any otherNight.
 * @param {Boolean} dead If this player is dead.
 */
function gen_night_order_tab_role(token_JSON, night, dead) {
    var color;
    switch (token_JSON.team) {
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
    if (start != 0) {
        while (desc.includes('{') && desc.includes('}')) {
            tempNightText += desc.split('{')[0]; // Text before first '{'
            const afterFirstBrace = desc.slice(desc.indexOf('{') + 1);
            const content = afterFirstBrace.split('}')[0]; // Content inside first '{...}'
            desc = afterFirstBrace.slice(afterFirstBrace.indexOf('}') + 1); // Text after first '}'
            const [reminder, defaultText] = content.split('='); // Split inside content
            reminderExists = false
            players = document.getElementById("token_layer").getElementsByClassName("role_token");
            for (const player in players) {
                if (!isNaN(parseInt(player))) {
                    try {
                        childTokens = players[player].getElementsByClassName("reminder drag");
                        for (childtoken = 0; childtoken < childTokens.length; childtoken++) {
                            if (childTokens[childtoken].getAttribute("role") == token_JSON.id) {
                                remindertext = childTokens[childtoken].getElementsByClassName("reminder_text")[0].textContent
                                if (remindertext == reminder) {

                                    playerName = players[player].getElementsByClassName("token_text")[0].textContent;
                                    if (playerName != "") {
                                        if (reminderExists) {
                                            tempNightText += " and "
                                        }
                                        reminderExists = true;
                                        tempNightText += playerName
                                    } else {
                                        if (reminderExists) {
                                            tempNightText += " and "
                                        }
                                        reminderExists = true;
                                        tempNightText += " the "
                                        tempNightText += tokens_ref[players[player].getAttribute("role")].name;
                                    }
                                }
                            }
                        }
                    } catch (error) { console.error(error) }
                }
            }
            if (!reminderExists) {
                tempNightText += defaultText;
            }
        }

        tempNightText += desc
        span.innerHTML = tempNightText;
    } else {
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

/**
 * Add universal information to the nightOrder tab.
 * @param {String} info The ID for the type of info to add to the tab.
 */
function gen_night_order_tab_info(info) {
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

/**
 * Expand an entry in the nightOrder tab, showing its inner data
 * (the night action reminder) to the user.
 * @param {String} id The ID of the tab to be expanded.
 */
function expand_night_order_tab(id) {
    tab = document.getElementById(id)
    tab.style.width = "500px";
    tab.style.transform = "translateX(-410px)";
    tab.style.height = document.getElementById(id).scrollHeight;
    tab.setAttribute("onclick", "javascript:collapse_night_order_tab(event, '" + id + "')");
    if (tab.getElementsByClassName("night_order_fabled_token_container").length == 1 && tab.getElementsByClassName("night_order_fabled_token_container")[0].children.length != 0) {
        let container = tab.getElementsByClassName("night_order_fabled_token_container")[0];
        document.getElementById("token_drag_" + id).style = "position: absolute; height: 80px; left: " + container.offsetLeft + "; top: " + container.offsetTop + ";";
        var tokens = tab.getElementsByClassName("night_order_fabled_token_container")[0].children;
        // for (i = 0; i < tokens.length; i++) {
        //   spawnNightOrderGhost(tokens[i].offsetLeft, tokens[i].offsetTop, tokens[i].style.backgroundImage, tokens[i].id, container.id.match(/(?<=night_order_).*/)[0]);
        // }
    }
}

/**
 * Collapse an entry in the nightOrder tab.
 * @param {Event} event The click or tap that triggered this collapse.
 * @param {*} id The ID of the tab to be collapsed.
 */
function collapse_night_order_tab(event, id) {
    event.preventDefault()
    if (document.elementFromPoint(event.clientX, event.clientY).classList == "night_order_fabled_token_perm") { return; } // bad implementation to prvent tab from closing when spawing token
    tab = document.getElementById(id)
    tab.style.width = "90px";
    tab.style.transform = "translateX(0px)";
    tab.style.height = "90px";
    tab.setAttribute("onclick", "javascript:expand_night_order_tab('" + id + "')")
}

/**
 * Populate the Jinxes tab.
 * Jinxes appear if and only if both of the characters involved in the jinx
 * are on-screen currently.
 */
async function populate_jinx() {
    clean_night_order();
    jinxes = await get_JSON("jinx.json");
    tokens = document.getElementById("token_layer").children;
    var inPlay = new Set();
    for (i = 0; i < tokens.length; i++) {
        var id = tokens[i].getAttribute("role");
        if (tokens[i].getAttribute("visibility") != "bluff") { inPlay.add(id); }
    }
    for (const token of inPlay) {
        for (i = 0; i < jinxes.length; i++) {
            if (jinxes[i].id == token) {
                for (j = 0; j < jinxes[i].jinx.length; j++) {
                    if (inPlay.has(jinxes[i].jinx[j].id)) {
                        gen_jinxes_tab(jinxes[i].id, jinxes[i].jinx[j].id, jinxes[i].jinx[j].reason)
                    }
                }
            }
        }
    }

}

/**
 * Generate an entry in the Jinxes tab.
 * @param {String} id1 The ID of the first jinxed character.
 * @param {String} id2  The ID of the second jinxed character.
 * @param {String} reason The reason behind the jinx
 */
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

/**
 * Populate the Fabled tab.
 * Fabled appear if they are either in the DEFAULT_FABLED set,
 * or are explicilty listed in the CURRENT_SCRIPT.
 */
function populate_fabled() {
    clean_night_order();
    var fabled = DEFAULT_FABLED;
    CURRENT_SCRIPT.forEach((entry) => {
        if (entry.id != "_meta") {
            var token = roles[entry.id];
            if (token["team"] == "fabled") {
                fabled.add(entry.id);
            }
        }
        return Promise.resolve();
    })
    fabled.forEach((fable) => {
        var json = roles[fable];
        gen_fabled_tab(json, true);
        return Promise.resolve();
    })
}

/**
 * Generate an entry in the Fabled tab.
 * @param {*} token_JSON The role JSON of the fabled to add.
 * @param {*} inPlay whether the Fabled is in play
 */
function gen_fabled_tab(token_JSON, inPlay) {
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
    token_JSON["reminders"].forEach((token) => {
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
