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
    validateSetup()
}


const ROLE_COUNTS = [
    [3, 0, 1, 1], // 5
    [3, 1, 1, 1], 
    [5, 0, 1, 1], // 7
    [5, 1, 1, 1], 
    [5, 2, 1, 1], 
    [7, 0, 2, 1], // 10
    [7, 1, 2, 1], 
    [7, 2, 2, 1], 
    [9, 0, 3, 1], // 13
    [9, 1, 3, 1], 
    [9, 2, 3, 1], // 15

    // Hypothetical/unimplemented
    [10, 2, 3, 1], 
    [11, 2, 3, 1], 
    [11, 3, 3, 1] // 18
]

/**
 * Perform various setup validations.
 * This can include any of the following:
 * 
 * - Ensuring the outsider count is correct based on other roles
 * - Correctly reporting ranges or plus-minus changes for outsiders
 * - Ensuring at least half of all players are Legion (HALF)
 * - Explicitly showing when role counts are arbitrary
 * - Explicitly showing when the outsider count must be accounted for (Xaan X)
 * - Accounting for required roles, such as the Choirboy's King (TODO)
 * 
 */
function validateSetup() {
    if (loading) return;

    let playerCount = parseInt(document.getElementById("player_count").value);
    playerCount = Math.min(Math.max(playerCount, 5), 15);

    const roleData = calculateRoleAmounts(playerCount);
    const issues = setupIssues(roleData, playerCount);

    const PLUS_MINUS = String.fromCharCode(177);
    const AT_LEAST = String.fromCodePoint(0x2265);

    for (const type in roleData) {
        const data = roleData[type];
        let output = "";

        if (data["min"] == data["max"]) {
            output = `${data["count"]} / ${data["min"]}`;
        } else {
            output = `${data["count"]} of [${data["min"]} - ${data["max"]}]`;
        }

        if (data["offset"] > 0) {
            output += ` ${PLUS_MINUS} ${data["offset"]}`;
        }

        if (data["flag"] == "HALF") {
            output = `${data["count"]} ${AT_LEAST} ${data["min"]}`;
            valid = (data["count"] >= data["min"]);
        }

        if (data["flag"] == "ARBITRARY") {
            output = `${data["count"]} / ???`;
        }

        if (data["flag"] == "X") {
            output = `X = ${data["count"]}`;
        }

        const ratio_text = document.getElementById(`ratio_${type}`)

        ratio_text.innerText = output;
        if (data["valid"]) {
            ratio_text.style.color = "";
        } else {
            ratio_text.style.color = ASSIGNABLE_TEAMS["demon"]["color"];
        }
    }

    const menu_issues = document.getElementById("menu_issues")
    if (issues.length == 0) {
        menu_issues.style.color = "rgb(179, 179, 0)"
        menu_issues.innerText = "Everything looks good!"
    } else {
        menu_issues.style.color = "rgb(179, 179, 0)"
        let text = "Detected the following issues:<ul>"
        for (const issue of issues) {
            text += `<li>${issue}</li>`;
        }
        text += "</ul>";
        menu_issues.innerHTML = text;
    }
    computeDropdownHeight();
    
}

function calculateRoleAmounts(playerCount) {

    const roleCount = ROLE_COUNTS[playerCount - 5];

    const roleData = {
        "townsfolk": {
            "count": 0,
            "roles": [],
            "required": [
                // { EX:
                //     "role": "king",
                //     "requiredFor": "choirboy"
                // }
            ],
            "min": roleCount[0],
            "max": roleCount[0],
            "offset": 0, // plus-minus
            "flag": null,
            "valid": false,
        },
        "outsider": {
            "count": 0,
            "roles": [],
            "required": [],
            "min": roleCount[1],
            "max": roleCount[1],
            "offset": 0,
            "flag": null,
            "valid": false,
        },
        "minion": {
            "count": 0,
            "roles": [],
            "required": [],
            "min": roleCount[2],
            "max": roleCount[2],
            "offset": 0,
            "flag": null,
            "valid": false,
        },
        "demon": {
            "count": 0,
            "roles": [],
            "required": [],
            "min": roleCount[3],
            "max": roleCount[3],
            "offset": 0,
            "flag": null,
            "valid": false,
        },
    };


    const tokens = document.getElementsByClassName("role_token");
    for (const token of tokens) {
        const role = roles[token.getAttribute("role")];

        if (token.getAttribute("visibility") != "show") continue;

        if (role.team in roleData) {
            roleData[role.team]["count"] += 1;
            roleData[role.team]["roles"].push(role.id);
        }

        if (!("change_makeup" in role)) continue;

        const FLAG_PRIORITY = [
            null,
            "HALF",
            "ARBITRARY",
            "X",
            "ZERO"
        ]
        
        for (const change of role["change_makeup"]) {
            try {
                const changeKey = change["type"]
                const affectedData = roleData[change["team"]];

                switch (changeKey) {
                    case "FORCED_CHANGE":
                        // Mandatory change to count.
                        if (affectedData["flag"] != null) break;
                        affectedData["min"] += change["amount"];
                        affectedData["max"] += change["amount"];
                        break;
                    case "ALLOWED_INCREASE":
                        // Valid but not required increase to count.
                        if (affectedData["flag"] != null) break;
                        affectedData["max"] += change["amount"];
                        break;
                    case "ALLOWED_DECREASE":
                        // Valid but not required decrease to count. 
                        if (affectedData["flag"] != null) break;
                        affectedData["min"] -= change["amount"];
                        break;
                    case "OFFSET":
                        // Valid and required change in either direction to exact count.
                        if (affectedData["flag"] != null) break;
                        affectedData["offset"] += change["amount"];
                        break;
                    case "HALF":
                        // Most players are this role. 
                        if (FLAG_PRIORITY.indexOf(affectedData["flag"]) > FLAG_PRIORITY.indexOf("HALF")) break;
                        affectedData["flag"] = "HALF";
                        affectedData["min"] = Math.ceil(playerCount / 2.0);
                        affectedData["max"] = Math.min(playerCount - 2, 12);
                        break;
                    case "ARBITRARY":
                        // The amount of players on this team is arbitrary.
                        if (FLAG_PRIORITY.indexOf(affectedData["flag"]) > FLAG_PRIORITY.indexOf("ARBITRARY")) break;
                        affectedData["flag"] = "ARBITRARY";
                        affectedData["min"] = 0;
                        affectedData["max"] = 4;
                        break;
                    case "X":
                        // The amount of players on this team is arbitrary, 
                        // and significant for some ability.
                        if (FLAG_PRIORITY.indexOf(affectedData["flag"]) > FLAG_PRIORITY.indexOf("X")) break;
                        affectedData["flag"] = "X";
                        affectedData["min"] = 0;
                        affectedData["max"] = 4;
                        break;
                    case "ZERO":
                        // There cannot be any characters of this type.
                        if (FLAG_PRIORITY.indexOf(affectedData["flag"]) > FLAG_PRIORITY.indexOf("ZERO")) break;
                        affectedData["flag"] = "ZERO",
                        affectedData["min"] = 0;
                        affectedData["max"] = 0;
                        break;
                    case "REQUIRED":
                        // A specific role must be in play.
                        const otherRole = roles[change["role"]]
                        const otherTypeData = roleData[otherRole.team];
                        
                        otherTypeData["required"].push({
                            "role": change["role"],
                            "requiredFor": role.id
                        });
                        
                        // If the role is not a townsfolk, it may displace a townsfolk. (Damsel)
                        if (otherRole.team == "townsfolk") break;
                        if (otherTypeData["flag"] != null) break;
                        otherTypeData["max"] += 1;

                        break;
                    default:
                        console.error("Unknown/Invalid Setup modifier: " + changeKey);
                        break;
                }
            } catch (e) {
                console.error(e);
            }
            
        }
    }

    // Ensure nothing is negative.
    for (const type in roleData) {
        const data = roleData[type];
        data["min"] = Math.max(data["min"], 0);
        data["max"] = Math.max(data["max"], 0);
        data["offset"] = Math.max(data["offset"], 0);
    }

    // Townsfolk are whatever is left. 
    // Since all setup shenanigans are addressed, we compute the leftovers.
    const townsfolkData = roleData["townsfolk"];
    townsfolkData["max"] = playerCount;
    townsfolkData["min"] = playerCount;
    for (const type in roleData) {
        if (type == "townsfolk") continue;
        const otherData = roleData[type];
        townsfolkData["max"] -= otherData["min"];
        townsfolkData["max"] = Math.max(townsfolkData["max"], 0);
        townsfolkData["min"] -= otherData["max"];
        townsfolkData["min"] = Math.max(townsfolkData["min"], 0);
        townsfolkData["offset"] += otherData["offset"];
    }

    return roleData;
}

function pluralize(team) {
    if (team == "townsfolk") return team;
    return team + "s";
}

function setupIssues(roleData, targetPlayerCount) {
    const Issue = {
        NONE: 0,
        EXACT: 1,
        RANGE: 2,
        OFFSET_REQUIRED: 3,
        HALF: 4
    }

    const issues = []
    let totalPlayers = 0;
    for (const type in roleData) {
        let issue = Issue.NONE;
        const data = roleData[type];

        totalPlayers += data["count"];

        // Ensure the count is correct.
        if (data["min"] == data["max"]) {
            if (data["count"] != data["min"]) {
                issue = Issue.EXACT;
            }
        } else {
            if (data["count"] < data["min"] || data["count"] > data["max"]) {
                issue = Issue.RANGE;
            }
        }

        // Ensure the count is correct, accounting for offset. 
        // This could make or break certain setups. 
        if (data["offset"] > 0) {
            if (data["min"] == data["max"]) {
                if (Math.abs(data["count"] - data["min"]) != data["offset"]) {
                    issue = Issue.OFFSET_REQUIRED;
                }
            } else {
                if (Math.abs(data["min"] - data["count"]) <= data["offset"]) {
                    issue = Issue.NONE;
                }
                if (Math.abs(data["max"] - data["count"]) <= data["offset"]) {
                    issue = Issue.NONE;
                }
            }
        }

        // If Legion or similar is in play, ensure half of the town is that role.
        if (data["flag"] == "HALF") {
            if (data["count"] < data["min"]) {
                issue = Issue.HALF;
            } else {
                issue = Issue.NONE;
            }
        }

        // +/-?? and X. 
        if (data["flag"] == "ARBITRARY") {
            issue = Issue.NONE;
        }

        if (data["flag"] == "X") {
            issue = Issue.NONE;
        }

        // Actually adding the issues to the report. 
        const direction = (data["count"] < data["min"] - data["offset"] ? "Not enough" : "Too many"); 

        switch (issue) {
            case Issue.EXACT:
                issues.push(`${direction} ${pluralize(type)}.<br>There should be ${data["min"]}.`);
                break;
            case Issue.RANGE:
                issues.push(`${direction} ${pluralize(type)}.<br>Should be between ${data["min"] - data["offset"]} and ${data["max"] + data["offset"]}.`);
                break;
            case Issue.OFFSET_REQUIRED:
                const type_plural = (data["offset"] > 1 ? pluralize(type) : type);
                issues.push(`Cannot have exactly ${data["min"]} ${pluralize(type)}.\nAdd or remove ${data["offset"]} ${type_plural}.`);
                break;
            case Issue.HALF:
                issues.push(`${direction} ${pluralize(type)}.\nMore than ${data["min"]} must be ${pluralize(type)}.`)

            default:
            case Issue.NONE:
                data["valid"] = true;
                break;
        }

        for (const requirement of data["required"]) {
            if (!data["roles"].includes(requirement["role"])) {
                const requiredName = roles[requirement["role"]].name;
                const requiringName = roles[requirement["requiredFor"]].name;
                issues.push(`The ${requiringName} requires a ${requiredName} be in play. Add the ${requiredName} or remove the ${requiringName}.`);
            }
        }

        // Checking for duplicate / too many roles.
        const roleCounts = {};
        for (const role of data["roles"]) {
            if (!(role in roleCounts)) {
                roleCounts[role] = 0;
            }
            roleCounts[role]++;
        }

        for (const role in roleCounts) {
            const name = roles[role].name;
            const times = roleCounts[role];
            const maxCount = roles[role].maxCount
            if (maxCount === undefined && times > 1) {
                issues.push(`The ${name} role appears multiple times. Remove duplicate roles.`);
            } else if (times > maxCount) {
                issues.push(`The ${name} role appears more than ${maxCount} times. Remove extra roles.`);
            }
        }
    }

    // Hardcoded Atheist exception -- ignore everything that may be wrong. The ST probably knows what they're doing.
    if (roleData["townsfolk"]["roles"].includes("atheist")) {
        issues.length = 0; // Apparently this deletes the array. Dammit JS
        issues.push("Atheist game detected. Are you sure whatever you are doing is worth it?");
    }

    // Player count validation
    const tokens = Math.abs(targetPlayerCount - totalPlayers) > 1 ? "tokens" : "token";
    if (targetPlayerCount < totalPlayers) {
        issues.push(`Too many tokens for ${targetPlayerCount} players.<br>Remove or hide ${totalPlayers - targetPlayerCount} ${tokens}.`);
    }
    if (targetPlayerCount > totalPlayers) {
        issues.push(`Not enough tokens for ${targetPlayerCount} players. Add ${targetPlayerCount - totalPlayers} more ${tokens}.`)
    }

    return issues;
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
        computeDropdownHeight();
    }
}

function computeDropdownHeight() {
    const dropdown = document.getElementById("menu_settings_dropdown");
    if (dropdown.getAttribute("expand") != "true") return;
    dropdown.style.height = `${document.getElementById("menu_settings_dropdown_body").scrollHeight + 68}px`;
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
        if (tokens[i].getAttribute("visibility") == "show") {
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
