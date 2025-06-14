SAO_PREFIXES = [
    "You start knowing",
    "At night",
    "Each dusk*",
    "Each night",
    "Each night*",
    "Each day",
    "Once per game, at night",
    "Once per game, at night*",
    "Once per game, during the day",
    "Once per game",
    "On your 1st night",
    "On your 1st day",
    "On Night X",

    "You think",
    "You are",
    "You have",
    "You do not know",
    "You might",
    "You",

    "When you die",
    "When you learn that you died",
    "When",

    "If you die",
    "If you died",
    "If you are \"mad\"",
    "If you",
    "If the Demon dies",
    "If the Demon kills",
    "If the Demon",
    "If both",
    "If there are 5 or more players alive",
    "If",

    "All players",
    "All",
    "The 1st time",
    "The",

    "Good",
    "Evil",
    "Players",
    "Minions",
    // Fallthrough:
    "",
];

/**
 * Generate an HTML page that can be printed to create a PDF from the currently
 * loaded "script". 
 * 
 * This script consists of only and exactly the tiles on screen at the time,
 * unless the user has not placed any tokens, in which case the currently
 * loaded script is used instead. 
 * 
 * @author The-ai123
 */
async function generateHTMLDocument() {
    update_current_script()

    // Start the HTML structure

    let html = "<!DOCTYPE html>\n"
    html += `<html lang="en">\n`

    html += getScriptPdfHead();

    html += `<body>\n`;
    html += `<h1>${CURRENT_SCRIPT[0].name}</h1>\n`;

    html += `<h2>Townsfolk<h2>\n`;
    html += generateTableForTeam("townsfolk");
    html += `<h2>Outsiders<h2>\n`;
    html += generateTableForTeam("outsider");
    html += `<h2>Minions<h2>\n`;
    html += generateTableForTeam("minion");
    html += `<h2>Demons<h2>\n`;
    html += generateTableForTeam("demon");

    html += generateNightOrderTable();

    html += generateJinxesTable();


    html += `<h2>Travellers<h2>\n`;
    html += generateTableForTeam("traveller");
    html += `<h2>Fabled<h2>\n`;
    html += generateTableForTeam("fabled");

    html += "</body>\n";
    html += "</html>";

    console.log(html)

    // Automatically open the generated HTML in a new window
    const newWindow = window.open();
    newWindow.document.write(html);
    newWindow.document.close();
}

/**
 * The <head> syntax for any Script PDFs. 
 */
function getScriptPdfHead() {
    return `
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${CURRENT_SCRIPT[0].name}</title>
    <style>
        @font-face {
            font-family: PiratesBay;
            src: url(sansation_light.woff);
        }
        body {
            margin: 10px;
            font-family: PiratesBay;
            font-size:x-small;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            padding: 0;
            
        }
        td {
            vertical-align: top;
            padding: 3px;
            font-size:15px
        }
        img {
            max-width: 100%;
            height: auto;
        }
        h1 {
            font-size:30px
        }
            h2 {
            font-size:20px
        }
    </style>
    <script>
        setTimeout(() => alert("Print page to pdf"), 250);
    </script>
</head>\n`
}

/**
 * Roughly index the sorting order of a character's text in
 * Steven-Approved Order (SAO). This implements the SAO specification used
 * for all future scripts as given at
 * https://bloodontheclocktower.com/news/sort-order-sao-update.
 *
 * @param {String} text The ability text of the character in question
 * @returns An integer value. This can be compared to the results from other
 * calls to this function. Lower values indicate that the role appears higher
 * on the script.
 */
function saoIndex(text) {

    // Atheist -- hardcoded exception
    if (text.startsWith("The Storyteller can break the game rules")) {
        return Infinity;
    }

    for (const [i, prefix] of SAO_PREFIXES.entries()) {
        if (text.startsWith(prefix))
            return i;
    }
}

/**
 * Implements the Steven-Approved Order (SAO) sorting used in all scripts, as
 * specified by https://bloodontheclocktower.com/news/sort-order-sao-update.
 *
 * First, sort the abilities based on the first few words of their ability text.
 * Consult {@link saoIndex} for more details.
 * If that cannot determine the order of two characters, then use
 * the length of the character text, with longer going later.
 * If that fails, use the length of the characters' names,
 * with longer going later.
 * If that fails, sort the characters alphabetically.
 * @param {*} first One of the characters being compared
 * @param {*} second One of the characters being compared
 * @returns an integer. If negative, then `first`  comes first in SAO.
 * Otherwise, `second` goes first in SAO.
 */
function compareRoles(first, second) {
    out = saoIndex(first["ability"]) - saoIndex(second["ability"]);
    if (out == 0) {
        out = first["ability"].length - second["ability"].length;
    }
    if (out == 0) {
        out = first["name"].length - second["name"].length;
    }
    if (out == 0) {
        out = first["name"] > second["name"] ? 1 : -1;
    }
    return out;
}

/**
 * Generate a HTML table containing all roles in a team. 
 * @param {String} teamId The id of a "team" to be put in this table.
 * @returns A <table> containing all of the roles in this team, in this format:
 * Picture, Name: Ability. 
 */
function generateTableForTeam(teamId) {
    const relevantRoles = CURRENT_SCRIPT.slice(1)
            .map(role => roles[role.id])
            .filter(role => role.team == teamId)
            .sort(compareRoles)

    let table = "    <table>\n"
    for (const role of relevantRoles) {
        if (roles[role.id].team == teamId) {
            table += `      <tr>
        <td style="width: 7.5%;"><img src="${getTokenImageLink(role.id)}" alt="${roles[role.id].name}"></td>
        <td style="width: 15%; font-weight: bold;">${roles[role.id].name}</td>
        <td style="width: 75%;">${roles[role.id].ability}</td>
      </tr>\n`;
        }
    }
    table += "    </table>\n"
    return table
}

/**
 * Generate an HTML table containg the waking order of all the roles on script,
 * for both the first night and other nights. 
 * 
 * This is two columns. It's likely that one column is longer than the other.
 * @returns A <table> containing night order information. 
 */
function generateNightOrderTable() {
    let nightOrderHtml = "";

    const firstNightOrder = CURRENT_SCRIPT.slice(1)
        .map(role => roles[role.id])
        .filter(role => role && role.firstNight > 0)
        .filter(role => role.team != "traveller")
        .sort((a, b) => a.firstNight - b.firstNight)

    const otherNightOrder = CURRENT_SCRIPT.slice(1)
        .map(role => roles[role.id])
        .filter(role => role && role.otherNight > 0)
        .filter(role => role.team != "traveller")
        .sort((a, b) => a.otherNight - b.otherNight)

    nightOrderHtml += `<table>
    <tr>
        <th><h2>First Night</h2></th>
        <th><h2>Other Nights</h2></th>
    </tr>\n`;

    for (let i = 0; i < Math.max(firstNightOrder.length, otherNightOrder.length); i++) {
        const firstEntry = firstNightOrder[i];
        const otherEntry = otherNightOrder[i];

        nightOrderHtml += "<tr>\n"

        if (firstEntry) {
            nightOrderHtml += `<td><img style="width: 7.5%" src="${getTokenImageLink(firstEntry.id)}" alt="${firstEntry.name}"> <b>${firstEntry.name}</b></td>\n`;
        }
        if (otherEntry) {
            nightOrderHtml += `<td><img style="width: 7.5%" src="${getTokenImageLink(otherEntry.id)}" alt="${otherEntry.name}"> <b>${otherEntry.name}</b></td>\n`;
        }
        nightOrderHtml += "</tr>\n"
    }

    nightOrderHtml += "</table>\n"

    return nightOrderHtml;
}

/**
 * Generate an HTML table containing all jinxes and their reasons. 
 * 
 * Note that if there are no Jinxes, this method returns an empty string
 * instead of a blank table. 
 * @returns A table of jinx pairs and their "Reason" text, or nothing.
 */
function generateJinxesTable() {
    let jinxHtml = ""

    const scriptIdSet = new Set(CURRENT_SCRIPT.slice(1).map(role => role.id));
    const relevantJinxes = [];

    for (const role of CURRENT_SCRIPT.slice(1)) {
        const jinxes = roles[role.id].jinx;
        console.log(jinxes)
        if (!jinxes) continue;

        for (const jinx of jinxes) {
            if (!scriptIdSet.has(jinx.id)) continue;

            relevantJinxes.push([role.id, jinx.id, jinx.reason]);
        }
    }

    if (relevantJinxes.length == 0) return "";

    jinxHtml += "<h2>Jinxes<h2>\n";
    jinxHtml += "<table>\n";

    for (const jinx of relevantJinxes) {
        jinxHtml += `    <tr>
        <td style="width: 7.5%;"><img src="${getTokenImageLink(jinx[0])}" alt="${roles[jinx[0]].name}"></td>
        <td style="width: 15%; font-weight: bold;">${roles[jinx[0]].name}</td>
        <td style="width: 7.5%;"><img src="${getTokenImageLink(jinx[1])}" alt="${roles[jinx[1]].name}"></td>
        <td style="width: 15%; font-weight: bold;">${roles[jinx[1]].name}</td>
        <td style="width: 70%;">${jinx[2]}</td>
    </tr>\n`;
    }
    jinxHtml += "</table>\n"

    return jinxHtml;
}