
/**
 * Get a JSON file from the server.
 * @param {String} path A relative path to the file on the server.
 * @returns the JSON string from that file.
 */
async function get_JSON(path) {
    return await (await fetch("./data/" + path)).json();
}

/**
 * Load all of the scripts from the server.
 */
async function load_scripts() {
    var scripts = await get_JSON("scripts/scripts.json")
    var initScript;
    for (i = 0; i < scripts.length; i++) {
        var element = scripts[i]
        var script = await get_JSON("scripts/" + element["file"] + ".json");
        if (i == 0) { initScript = script; }
        option = document.createElement("option");
        optionText = document.createTextNode(script[0]["name"]);
        option.appendChild(optionText);
        document.getElementById("script_options").appendChild(option);
    }
    populate_script(initScript)
}

/**
 * Initialize the selected script from the script_options dropdown.
 */
async function script_select() {
    var script_names = await get_JSON("scripts/scripts.json");
    var script = await get_JSON("scripts/" + script_names[document.getElementById("script_options").options.selectedIndex]["file"] + ".json");
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
    try {
        // Sanity check
        json[0]["id"]
        await populate_script(json);
        document.getElementById("script_upload_feedback").setAttribute("used", "upload");
    } catch (e) {
        console.error(e);
        document.getElementById("script_upload_feedback").innerHTML = "Error Processing File";
        document.getElementById("script_upload_feedback").setAttribute("used", "error");
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
    document.getElementById("script_upload_feedback").innerHTML = script[0]["name"];
    function reset(text, landing_name, color) {
        var div = document.createElement("div");
        div.innerHTML = text;
        div.style.color = color;
        div.classList = "menu_header"
        landing = document.getElementById(landing_name)
        landing.innerHTML = "";
        landing.appendChild(div);
        var ratio = document.createElement("div");
        ratio.classList = "menu_ratio";
        ratio.innerHTML = "0/0";
        ratio.id = "ratio_" + landing_name
        landing.appendChild(ratio);
        landing.insertAdjacentHTML("beforeend", "<hr style='margin-block-end: 0em;'>");
    }
    const rolesOnScript = [];
    script.forEach(element => {
        if (element.id.startsWith("_")) return;
        if (!(element.id in roles)) {
            roles[element.id] = element;
        } 
        rolesOnScript.push(roles[element.id]);
    })

    reset("Townsfolk", "townsfolk", "#0033cc")
    reset("Outsiders", "outsider", "#1a53ff")
    reset("Minions", "minion", "#b30000")
    reset("Demons", "demon", "#e60000")
    reset("Travellers", "traveller", "#6600ff")

    const ASSIGNABLE_TEAMS = ["townsfolk", "outsider", "minion", "demon", "traveller"];

    for (const role of rolesOnScript) {
        if (!ASSIGNABLE_TEAMS.includes(role.team)) continue;
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

    player_count_change();
    update_role_counts();
    clear_mutate_menu();
    populate_mutate_menu(rolesOnScript);

    if (!loading) { save_game_state(); }
    return Promise.resolve()
}

/**
 * Generate an HTML page that can be printed to create a PDF from the currently
 * loaded "script". 
 * 
 * This script consists of only and exactly the tiles on screen at the time. 
 * This remains a work in progress. 
 * 
 * @author The-ai123
 */
async function generateHTMLDocument() {
    update_current_script()

    // Start the HTML structure
    let html = `
    <!DOCTYPE html>
    <html lang="en">
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
        alert("Print page to pdf");
      </script>
    </head>
    <body>
    <h1>${CURRENT_SCRIPT[0].name}</h1>
    <h2>Townsfolk<h2>
    <table>`;

    // Generate rows from the provided arrays for townsfolk
    for (let i = 1; i < CURRENT_SCRIPT.length; i++) {
        if (tokens_ref[CURRENT_SCRIPT[i].id].team == 'townsfolk') {
            html += `
        <tr>
          <td style="width: 7.5%;"><img src="${getTokenImageLink(CURRENT_SCRIPT[i].id)}" alt="${tokens_ref[CURRENT_SCRIPT[i].id].name}"></td>
          <td style="width: 15%; font-weight: bold;">${tokens_ref[CURRENT_SCRIPT[i].id].name}</td>
          <td style="width: 75%;">${tokens_ref[CURRENT_SCRIPT[i].id].ability}</td>
        </tr>`;
        }
    }

    html += `
    </table>
  
    <h2>Outsiders<h2>
    <table>`;

    // Generate rows from the provided arrays for OUTsiders
    for (let i = 1; i < CURRENT_SCRIPT.length; i++) {
        if (tokens_ref[CURRENT_SCRIPT[i].id].team == 'outsider') {
            html += `
        <tr>
          <td style="width: 7.5%;"><img src="${getTokenImageLink(CURRENT_SCRIPT[i].id)}" alt="${tokens_ref[CURRENT_SCRIPT[i].id].name}"></td>
          <td style="width: 15%; font-weight: bold;">${tokens_ref[CURRENT_SCRIPT[i].id].name}</td>
          <td style="width: 75%;">${tokens_ref[CURRENT_SCRIPT[i].id].ability}</td>
        </tr>`;
        }
    }
    html += `
    </table>
  
    <h2>Minions<h2>
    <table>`;

    // Generate rows from the provided arrays for minions
    for (let i = 1; i < CURRENT_SCRIPT.length; i++) {
        if (tokens_ref[CURRENT_SCRIPT[i].id].team == 'minion') {
            html += `
        <tr>
          <td style="width: 7.5%;"><img src="${getTokenImageLink(CURRENT_SCRIPT[i].id)}" alt="${tokens_ref[CURRENT_SCRIPT[i].id].name}"></td>
          <td style="width: 15%; font-weight: bold;">${tokens_ref[CURRENT_SCRIPT[i].id].name}</td>
          <td style="width: 75%;">${tokens_ref[CURRENT_SCRIPT[i].id].ability}</td>
        </tr>`;
        }
    }
    html += `
    </table>
  
    <h2>Demons<h2>
    <table>`;

    // Generate rows from the provided arrays for Demons
    for (let i = 1; i < CURRENT_SCRIPT.length; i++) {
        if (tokens_ref[CURRENT_SCRIPT[i].id].team == 'demon') {
            html += `
      <tr>
        <td style="width: 7.5%;"><img src="${getTokenImageLink(CURRENT_SCRIPT[i].id)}" alt="${tokens_ref[CURRENT_SCRIPT[i].id].name}"></td>
        <td style="width: 15%; font-weight: bold;">${tokens_ref[CURRENT_SCRIPT[i].id].name}</td>
        <td style="width: 75%;">${tokens_ref[CURRENT_SCRIPT[i].id].ability}</td>
      </tr>`;
        }
    }
    //close table
    html += `
    </table>`;
    //Night Order
    var order = await get_JSON("nightsheet.json");
    let first_night = [];
    let other_night = [];
    for (i = 0; i < order["firstNight"].length; i++) {
        id = order["firstNight"][i]
        for (j = 0; j < CURRENT_SCRIPT.length; j++) {
            if (CURRENT_SCRIPT[j].id === id && tokens_ref[id].team != "traveller") { first_night.push(id) }
        }
    }
    for (i = 0; i < order["otherNight"].length; i++) {
        id = order["otherNight"][i]
        for (j = 0; j < CURRENT_SCRIPT.length; j++) {
            if (CURRENT_SCRIPT[j].id === id && tokens_ref[id].team != "traveller") { other_night.push(id) }
        }
    }
    //fill night order table
    html += `
    <table>
          <tr>
              <th><h2>First Night</h2></th>
              <th><h2>Other Nights</h2></th>
          </tr>`
    for (i = 0; i < (other_night.length < first_night.length ? first_night.length : other_night.length); i++) {
        let first_id = first_night[i];
        let other_id = other_night[i];
        html += `
      <tr>`
        if (tokens_ref[first_id]) {
            html += `
        <td><img style="width: 7.5%" src="${getTokenImageLink(first_id)}" alt="${tokens_ref[first_id].name}"> <b>${tokens_ref[first_id].name}</b></td>`
        } else {
            html += `
        <td></td>`
        };
        if (tokens_ref[other_id]) {
            html += `
          <td><img style="width: 7.5%" src="${getTokenImageLink(other_id)}" alt="${tokens_ref[other_id].name}"> <b>${tokens_ref[other_id].name}</b></td>`
        } else {
            html += `
        <td></td>`
        };
        html += `
      </tr>`
    }
    //end table
    html += `      
      </table>`
    //Print jinxes

    jinxes = await get_JSON("jinx.json");
    anyjinx = false
    for (i = 0; i < jinxes.length; i++) {
        for (j = 0; j < CURRENT_SCRIPT.length; j++) {
            //if the first role in the pair is in the current script
            if (jinxes[i].id == CURRENT_SCRIPT[j].id) {
                for (k = 0; k < jinxes[i].jinx.length; k++) {
                    jinx = jinxes[i].jinx[k];
                    for (l = 0; l < CURRENT_SCRIPT.length; l++) {
                        //if the second role in the pair is in the current script
                        if (jinx.id == CURRENT_SCRIPT[l].id) {
                            if (!anyjinx) {
                                html += `
                  <h2>Jinxes<h2>
                  <table>`;
                                anyjinx = true
                            }
                            html += `
                <tr>
                  <td style="width: 7.5%;"><img src="${getTokenImageLink(jinxes[i].id)}" alt="${tokens_ref[jinxes[i].id].name}"></td>
                  <td style="width: 15%; font-weight: bold;">${tokens_ref[jinxes[i].id].name}</td>
                  <td style="width: 7.5%;"><img src="${getTokenImageLink(jinx.id)}" alt="${tokens_ref[jinx.id].name}"></td>
                  <td style="width: 15%; font-weight: bold;">${tokens_ref[jinx.id].name}</td>
                  <td style="width: 70%;">${jinx.reason}</td>
                </tr>`;
                        }
                    }
                }
            }
        }
    }
    if (anyjinx) {
        //end table
        html += `      
      </table>`
    }


    //Print travelers and fables
    html += `
    <h2>Travelers<h2>
    <table>`;

    // Generate rows For travelers
    for (element in tokens_ref) {
        if (tokens_ref[element].team == 'traveller') {
            html += `
      <tr>
        <td style="width: 7.5%;"><img src="${getTokenImageLink(tokens_ref[element].id)}" alt="${tokens_ref[element].name}"></td>
        <td style="width: 15%; font-weight: bold;">${tokens_ref[element].name}</td>
        <td style="width: 75%;">${tokens_ref[element].ability}</td>
      </tr>`;
        }
    }
    //close table
    html += `
    </table>`;

    // Generate rows For fables
    html += `
    <h2>Fables<h2>
    <table>`;
    for (element in tokens_ref) {
        if (tokens_ref[element].team == 'fabled') {
            html += `
      <tr>
        <td style="width: 7.5%;"><img src="${getTokenImageLink(tokens_ref[element].id)}" alt="${tokens_ref[element].name}"></td>
        <td style="width: 15%; font-weight: bold;">${tokens_ref[element].name}</td>
        <td style="width: 75%;">${tokens_ref[element].ability}</td>
      </tr>`;
        }
    }
    //close table
    html += `
    </table>`;

    // Close the HTML structure
    html += `
    </body>
    </html>`;

    // Optional: Automatically open the generated HTML in a new window
    const newWindow = window.open();
    newWindow.document.write(html);
    newWindow.document.close();
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
    //clear current script
    CURRENT_SCRIPT = CURRENT_SCRIPT.filter(element => element.id == CURRENT_SCRIPT[0].id);
    //repopulated based on tokens currently on screen(and not hidden or dead)
    onscreen_tokens = document.getElementById("token_layer").getElementsByClassName("role_token");
    for (i = 0; i < onscreen_tokens.length; i++) {
        if (onscreen_tokens[i].getAttribute("visibility") == "show" && onscreen_tokens[i].getAttribute("viability") == "alive") {
            let newElement = { "id": onscreen_tokens[i].role }
            if (!CURRENT_SCRIPT.some(element => element.id == newElement.id)) {
                CURRENT_SCRIPT.push(newElement); // Add the element only if it doesn't exist
            }
        }
    }
}

