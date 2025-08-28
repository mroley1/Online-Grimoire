/**
 * Create a reminder token for the background of the info box. When
 * "ghost" tokens are removed from the info box, this background creates the
 * illusion of infinitely many reminder tokens that can be pulled out.
 * @param {String} roleName The ID of the role that this reminder belongs to.
 * @param {String} reminder The text to put inside of the reminder.
 * @param {Number} uid The element ID.
 * @returns an HTML element that can be put into the info box.
 */
function generateReminderBacking(roleName, reminder, uid) {

    var div = document.createElement("div");
    div.className = "info_tokens";
    div.id = "info_" + reminder + "_" + uid;

    var base = document.createElement("img");
    base.src = "assets/reminder.png"
    base.style.width = "100%";
    base.style.height = "100%";
    base.style.pointerEvents = "none";
    div.appendChild(base);

    var role = document.createElement("img");
    role.id = "info_img_role";
    role.style.position = "absolute";
    role.style.pointerEvents = "none";
    role.src = getTokenImageLink(roleName);
    div.appendChild(role);

    var text = document.createElement("p");
    text.innerText = reminder;
    text.classList = "reminder_ghost_text";
    div.appendChild(text);

    return div;
    // document.getElementById("info_token_landing").appendChild(div);
}

/**
 * Create a fake "ghost" reminder that gets put in the info box.
 * This reminder is slightly larger than an actual reminder that ends up on
 * the grimoire, but can be dragged and ostensibly 'dropped" onto the grimoire
 * by the user.
 * @param {Number} left The offset of the reminder from the left of the info box,
 * in pixels.
 * @param {Number} top The offset of the reminder from the top of the info box,
 * in pixels.
 * @param {String} roleName The ID of the role that this reminder belongs to.
 * @param {String} reminder The text to put inside of the reminder.
 * @param {String} longId The Element ID.
 */
function spawnReminderGhost(left, top, roleName, reminder, longId) {
    // Create a reminder that we put in the info box. 
    // This is slightly larger than the actual reminder, and appears larger until we put it onto the page.
    const uid = makeUid()

    var div = document.createElement("div");
    div.classList = "info_tokens_drag drag";
    div.style = `left: ${left}; top: ${top}; border-radius: 100%; pointer-events: all; width: 100px; height 100px;`
    div.id = longId + "_" + uid;
    div.setAttribute("ghost", "true");
    div.setAttribute("token_from", "info");
    div.setAttribute("role", roleName);

    var base = document.createElement("img");
    base.src = "assets/reminder.png"
    base.style.width = "100%";
    base.style.height = "100%";
    base.style.pointerEvents = "none";
    div.appendChild(base);

    var role = document.createElement("img");
    role.id = "info_img_role";
    role.style.position = "absolute";
    role.style.pointerEvents = "none";
    role.src = getTokenImageLink(roleName);
    div.appendChild(role);

    var text = document.createElement("p");
    text.innerText = reminder;
    text.classList = "reminder_ghost_text";
    div.appendChild(text);

    document.getElementById("info_token_dragbox").prepend(div);
    makeDraggable(div);
}

/**
 * Create a new reminder to put onto the grimoire.
 * @param {String} roleName The ID of the role this reminder is from.
 * @param {String} reminder The text to put on this reminder.
 * @param {String} uid The Unique ID assigned to this reminder.
 * @param {Number} left The offset of the reminder from the top of the screen,
 * in pixelNumber.
 * @param {Number} top The offset of the reminder from the top of the screen,
 * in pixels.
 */
function spawnReminder(roleName, reminder, uid, left, top) {

    var div = document.createElement("div");
    div.classList = "reminder drag";
    div.style = `left: ${left}; top: ${top}; border-radius: 100%; pointer-events: all;`
    div.id = roleName + "_" + uid;
    div.setAttribute("uid", uid);
    div.setAttribute("role", roleName);
    div.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + div.id + "')");

    var base = document.createElement("img");
    base.src = "assets/reminder.png"
    base.style.width = "100%";
    base.style.height = "100%";
    base.style.pointerEvents = "none";
    div.appendChild(base);

    var role = document.createElement("img");
    role.id = "info_img_role";
    role.style.position = "absolute";
    role.style.pointerEvents = "none";
    role.src = getTokenImageLink(roleName);
    div.appendChild(role);

    var text = document.createElement("p");
    text.innerText = reminder;
    text.classList = "reminder_text";
    div.appendChild(text);

    var trash = document.createElement("img");
    trash.classList = "reminder_delete"
    trash.src = "assets/delete.png";
    trash.id = roleName + "_" + uid + "_img";
    div.appendChild(trash);

    document.getElementById("reminder_layer").appendChild(div);
    makeDraggable(div)

    attachTokenToToken(div);//Make new reminder tokens check to see if they should be attach to a character token
    if (!loading) { save_game_state(); }
    return div;
}

/**
 * Remove all reminder tokens assosicated with this UID.
 * @param {String} uid The Unique ID to search on.
 */
function clean_tokens(uid) {
    let reminders = document.getElementById("reminder_layer").getElementsByClassName("reminder");
    for (i = reminders.length - 1; i != -1; --i) {
        if (reminders[i].getAttribute("uid").substring(0, UID_LENGTH) == uid) {
            document.getElementById("reminder_layer").removeChild(reminders[i]);
        }
    }
}

/**
 * Generate a Fabled reminder.
 * @param {String} roleName The name of the fabled this reminder comes from.
 * @param {String} reminder The text to put on the reminder.
 */
function spawnFabledReminder(roleName, reminder) {
    spawnReminder(roleName, reminder, makeUid(), 'calc(50% - 40px)', 'calc(50% - 40px)')
}

/**
 * Spawn a reminder on the Pip layer. This layer contains only the
 * alignment/special reminders, as they have different handling than the other
 * reminder
 * @param {"good"|"evil"|"reminder_pip"} type The type of the reminder.
 * @param {String} left The offset of the reminder from the left of the screen,
 * in pixels.
 * @param {String} top The offset of the reminder from the top of the screen,
 * in pixels.
 * @param {String} stacked If the reminder is one of the three "Generators" on
 * the left side of the screen.
 */
function dragPipLayerSpawn(type, left, top, stacked) {
    const uid = makeUid();
    var div = document.createElement("div");
    div.classList = "reminder drag";
    div.style = "background-image: url('assets/reminders/" + type + ".png'); left: " + left + "; top: " + top + "; border-radius: 100%; pointer-events: all;";
    div.id = type + "_" + uid;
    div.setAttribute("disposable-reminder", true);
    div.setAttribute("alignment", type);
    div.setAttribute("stacked", stacked);
    var img = document.createElement("img");
    img.style = "width: 80%; height: 80%; margin: 10%; pointer-events: none; display: none; border-radius: 100%; user-select: none";
    img.src = "assets/delete.png";
    img.id = type + "_" + uid + "_img";
    div.appendChild(img);
    makeDraggable(div);
    // document.getElementById("dragPipLayer").prepend(div);
    // if (!loading) { save_game_state(); }
    return div;
}

/**
 * Spawn one of the three default reminder tokens in the top left of
 * the screen.
 * @param {"good"|"evil"|"reminder_pip"} type The type of the reminder.
 */
function dragPipLayerSpawnDefault(type) {
    const ref = { "good": "90px", "evil": "175px", "reminder_pip": "260px" }
    const div = dragPipLayerSpawn(type, "5px", ref[type], "true");
    document.getElementById("dragPipLayer").prepend(div);
}

function resetDragPipLayer() {
    document.getElementById("dragPipLayer").innerHTML = "";
    dragPipLayerSpawnDefault("good");
    dragPipLayerSpawnDefault("evil");
    dragPipLayerSpawnDefault("reminder_pip");
}

/**
 * Prompt the user if they want to delete a reminder.
 * the prompt consists simply of a trash icon appearing over the reminder.
 * Clicking again deletes it.
 * @param {String} id The ID of the reminder token.
 */
function prompt_delete_reminder(id) {
    document.getElementById(id + "_img").style.display = "inherit";
    document.getElementById(id).setAttribute("onmouseup", null);
    setTimeout(function () { try { document.getElementById(id).setAttribute("onclick", "javascript:delete_reminder('" + id + "')"); } catch (TypeError) { null }; }, 30)
}

/**
 * Delete a reminder, removing it from the grimoire.
 * @param {String} id The ID of the reminder token.
 */
function delete_reminder(id) {
    document.getElementById(id).setAttribute("onmouseup", null);
    document.getElementById(id).parentNode.removeChild(document.getElementById(id));
    if (!loading) { save_game_state(); }
}

/**
 * Remove all reminder deletion prompts from the grimoire.
 */
function unprompt_reminders() {
    const specialReminders = document.getElementById("dragPipLayer").children;
    for (const reminder of specialReminders) {
        document.getElementById(reminder.id + "_img").style.display = "none";
        reminder.setAttribute("onclick", null);
        reminder.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + reminder.id + "')");
    }

    const looseRoleReminders = document.getElementById("reminder_layer").children;
    for (const reminder of looseRoleReminders) {
        document.getElementById(reminder.id + "_img").style.display = "none";
        reminder.setAttribute("onclick", null);
        reminder.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + reminder.id + "')");
    }
    const attachedRoleReminders = document.getElementsByClassName("reminder drag");
    for (const reminder of attachedRoleReminders) {
        document.getElementById(reminder.id + "_img").style.display = "none";
        reminder.setAttribute("onclick", null);
        reminder.setAttribute("onmouseup", "javascript:prompt_delete_reminder('" + reminder.id + "')");
    }
}
