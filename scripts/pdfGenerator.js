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
  throw new Error("NOT IMPLEMENTED");
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
 * @returns an integer. If positive, then `first`  comes first in SAO.
 * Otherwise, `second` goes first in SAO.
 */
function compareRoles(first, second) {
  throw new Error("NOT IMPLEMENTED");
}

/**
 * Generate an HTML page that contains script data for all of the characters 
 * listed on the Grimoire. This page may then be printed to a PDF. 
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
  for (i = 0; i < order["firstnight"].length; i++) {
    id = order["firstnight"][i]
    for (j = 0; j < CURRENT_SCRIPT.length; j++) {
      if (CURRENT_SCRIPT[j].id === id && tokens_ref[id].team != "traveller") { first_night.push(id) }
    }
  }
  for (i = 0; i < order["othernight"].length; i++) {
    id = order["othernight"][i]
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
 * Create a script containing only the characters whose tokens are on
 * the grimoire currently, and download that script as a .json file. 
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
 * Change the name of the script based on user input. 
 * 
 * @author The-ai123
 */
function update_current_script_name() {
  CURRENT_SCRIPT[0].name = document.getElementById("script_upload_feedback").textContent;
}

/**
 * Update the CURRENT_SCRIPT to be only tokens that are on-screen currently. 
 * This deletes all previous script data. Only do this when generating a new script!
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
