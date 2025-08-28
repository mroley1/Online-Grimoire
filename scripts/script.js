/**
 * The teams that appear in the side menu when selecting a character.
 * Only characters in these teams (ie: not Fabled) may be assigned to players.
 */
const TEAM_TYPES = {
    "townsfolk": {
        "id": "townsfolk",
        "header": "Townsfolk",
        "color": "#0033cc",
    },
    "outsider": {
        "id": "outsider",
        "header": "Outsiders",
        "color": "#1a53ff",
    },
    "minion": {
        "id": "minion",
        "header": "Minions",
        "color": "#b30000",
    },
    "demon": {
        "id": "demon",
        "header": "Demons",
        "color": "#e60000",
    },
    "traveller": {
        "id": "traveller",
        "header": "Travellers",
        "color": "#6600ff",
    },
    "fabled": {
        "id": "fabled",
        "header": "Fabled",
        "color": "#b3b300",
    },
}

let KNOWN_SCRIPTS = [];
const uploadedScripts = [];

/**
 * Get a JSON file from the server.
 * @param {String} path A relative path to the file on the server.
 * @returns the JSON string from that file.
 */
async function get_JSON(path) {
    return await (await fetch("./data/" + path)).json();
}

function appendScriptToDropdown(name) {
    const option = document.createElement("option");
    const optionText = document.createTextNode(name || "Untitled Script");
    option.appendChild(optionText);

    document.getElementById("script_options").appendChild(option);
}

/**
 * Load all of the scripts from the server.
 */
async function load_scripts() {
    KNOWN_SCRIPTS = await get_JSON("scripts/scripts.json")
    let initScript;

    for (const element of KNOWN_SCRIPTS) {
        const script = await get_JSON("scripts/" + element["file"] + ".json");
        if (initScript == undefined) initScript = script;

        element.name = script[0]["name"];
        appendScriptToDropdown(script[0]["name"]);
    }
    populate_script(initScript)
}

/**
 * Initialize the selected script from the script_options dropdown.
 */
async function script_select() {
    const scriptIndex = parseInt(document.getElementById("script_options").options.selectedIndex);
    let script;
    if (scriptIndex < KNOWN_SCRIPTS.length) {
        script = await get_JSON("scripts/" + KNOWN_SCRIPTS[document.getElementById("script_options").options.selectedIndex]["file"] + ".json");
    } else {
        script = uploadedScripts[scriptIndex - KNOWN_SCRIPTS.length];
    }
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

    // Migrate really old scripts, which used to just be a list of role IDs.
    if (typeof json[1] === typeof "") {
        for (var i = 0; i < json.length; i++) {
            if (typeof json[i] == typeof "") {
                json[i] = { "id": json[i] };
            }
        }
    }

    let success = true;
    try {
        // Sanity check
        json[0]["id"]
        await populate_script(json);
        document.getElementById("script_upload_feedback").setAttribute("used", "upload");
    } catch (e) {
        success = false;
        console.error(e);
        document.getElementById("script_upload_feedback").innerHTML = "Error Processing File";
        document.getElementById("script_upload_feedback").setAttribute("used", "error");
    }

    if (success) {
        uploadedScripts.push(json);
        appendScriptToDropdown(json[0]["name"]);
        document.getElementById("script_options").selectedIndex = document.getElementById("script_options").options.length - 1;
    }

    document.getElementById("menu_settings_dropdown").style.height = "calc(" + document.getElementById("menu_settings_dropdown_body").scrollHeight + "px + 68px)";
    if (!loading) { save_game_state(); }
}

/**
 * Given a JSON script, populate the side menu with the various characters
 * listed in the script.
 * @param {Object} script a container with all of the characters in the script
 */
async function populate_script(script) {
    CURRENT_SCRIPT = script;
    document.getElementById("script_upload_feedback").innerHTML = script[0]["name"] || "Untitled Script";
    const rolesOnScript = [];
    script.forEach(element => {
        if (element.id.startsWith("_")) return;
        if (!(element.id in roles)) {
            addHomebrewRole(element);
        } 
        rolesOnScript.push(roles[element.id]);
    })

    rolesOnScript.sort((a,b) => a.id > b.id)

    //const TEAM_TYPES = ["townsfolk", "outsider", "minion", "demon", "traveller"];
    
    for (const team of Object.values(TEAM_TYPES)) {
        const landing = document.getElementById(team.id)
        landing.innerHTML = "";

        var div = document.createElement("div");
        div.innerHTML = team.header;
        div.style.color = team.color;
        div.classList = "menu_header"
        landing.appendChild(div);

        var ratio = document.createElement("div");
        ratio.classList = "menu_ratio";
        ratio.innerHTML = "0/0";
        ratio.id = "ratio_" + team.id
        landing.appendChild(ratio);

        landing.insertAdjacentHTML("beforeend", "<hr style='margin-block-end: 0em;'>");
    }

    for (const role of rolesOnScript) {
        if (!(role.team in TEAM_TYPES)) continue;
        const landing = document.getElementById(role.team);

        const outer_div = document.createElement("div");
        outer_div.classList = "menu_list_div";
        outer_div.title = role["ability"];
        outer_div.setAttribute("onclick", `javascript:spawnTokenDefault('${role.id}', '${role.team}', '${role.hide_face}', 'alive')`);

        const label = document.createElement("label");
        label.classList = "menu_list";
        label.innerHTML = role["name"];
        outer_div.appendChild(label);

        const count_div = document.createElement("div");
        count_div.classList = "menu_token_count";
        count_div.innerHTML = 0;
        count_div.id = role["id"] + "_count";
        outer_div.appendChild(count_div);
        outer_div.insertAdjacentHTML("beforeend", "&nbsp;");

        var hr = document.createElement("hr");
        hr.style.marginBlockEnd = "0em";
        outer_div.appendChild(hr);
        
        landing.appendChild(outer_div)
    }

    for (const team of Object.values(TEAM_TYPES)) {
        //Add button to add offscreen of each category
        const outer_div = document.createElement("div");
        outer_div.classList = "menu_list_div";
        outer_div.title = title="Add offscript " + team.header;
        outer_div.setAttribute("onclick", "add_offscript_character('"+ team.id +"')");

        const label = document.createElement("label");
        label.classList = "menu_list";
        label.innerHTML = "Add Offscript " + team.header;
        outer_div.appendChild(label);
        outer_div.insertAdjacentHTML("beforeend", "&nbsp;");

        const hr = document.createElement("hr");
        hr.style.marginBlockEnd = "0em";
        outer_div.appendChild(hr);

        const landing = document.getElementById(team.id);
        landing.appendChild(outer_div)
    }

    player_count_change();
    update_role_counts();

    resetInfoList();
    for (const role of rolesOnScript) {
        appendCardsToInfoList(role);
    }

    clear_mutate_menu();
    populate_mutate_menu(rolesOnScript);

    if (!loading) { save_game_state(); }
    return Promise.resolve()
}

/**
 * Add a homebrew role to the list of known roles. 
 * Performs changes to fit our grimoire role spec.
 * @param {Object} role The role being added. 
 */
function addHomebrewRole(role) {
    // There are two types of reminders: character-related, and global. 
    // We don't care about the distinction. 
    // Additionally, all reminders must be distinct. 
    const allReminders = new Set(role.reminders).union(new Set(role.globalReminders))
    role.reminders = [...allReminders];

    if (role.team == "traveler") {
        // Really annyoing error made by a number of scripts.
        role.team = "traveller";
    }

    roles[role.id] = role;
}

/**
 * Generates and downloads a JSON file from the currently loaded "script". 
 * 
 * This script consists of only and exactly the tiles on screen at the time. 
 * 
 * @author The-ai123
 */
function download_current_script() {
    update_current_script()
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(CURRENT_SCRIPT)));
    element.setAttribute('download', CURRENT_SCRIPT[0].name + ".json");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

/**
 * Update the current script name.
 * 
 * @author The-ai123
 */
function update_current_script_name() {
    CURRENT_SCRIPT[0].name = document.getElementById("script_upload_feedback").textContent;
}

/**
 * Updates the current script to consist of exclusively the on-screen tokens.
 * 
 * @author The-ai123
 */
function update_current_script() {
    const availableTokens = document.getElementById("token_layer").getElementsByClassName("role_token");
    if (availableTokens.length == 0) return;
    //clear current script
    CURRENT_SCRIPT = [ CURRENT_SCRIPT[0] ]
    //repopulated based on tokens currently on screen(and not hidden or dead)
    for (const token of availableTokens) {
        if (token.getAttribute("visibility") != "show" || token.getAttribute("viability") != "alive") {
            continue;
        }
        const newElement = { "id": token.role }
        if (!CURRENT_SCRIPT.some(element => element.id == token.role)) {
            // Add the element only if it doesn't exist
            if (token.role in base_roles) {
                CURRENT_SCRIPT.push({ "id": token.role }); 
            } else {
                CURRENT_SCRIPT.push(roles[token.role]);
            }
        }
    }
}

