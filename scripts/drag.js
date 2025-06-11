/** The element that is currently being dragged. */
var active = null;
/** The X offset between the cursor and a dragged element */
var xOffset = 0;
/** The Y offset between the cursor and a dragged element */
var yOffset = 0;

/**
 * Make an element draggable.
 * @param {HTMLElement} element An element to give the drag callbacks to.
 */
function makeDraggable(element) {
    element.addEventListener("touchstart", dragStart, false);
    element.addEventListener("touchend", dragEnd, false);
    element.addEventListener("touchmove", drag, false);

    element.addEventListener("mousedown", dragStart, false);
    element.addEventListener("mouseup", dragEnd, false);
    element.addEventListener("mousemove", drag, false);
}

/**
 * Initialize the logic for dragging an element.
 * @param {Event} e The event that triggered this function.
 */
function dragStart(e) {
    const token = getActualDragged(e.target);
    if (e.target.parentNode.getAttribute("class") == "role_token drag") {
        tokenlayer = document.getElementById("reminder_layer");
        tokenlayer.appendChild(e.target);
        e.target.style.position = 'absolute';
        let elementPos = e;
        if (e.type == "touchstart") {
            elementPos = e.touches[0];
        }
        e.target.style.left = elementPos.clientX - 37.5
        e.target.style.top = elementPos.clientY - 37.5
        token.style.position = 'absolute';

    }
    if (!draggingEnabledFor(token)) {
        return;
    }
    active = token;
    active.style.zIndex = 1;
    var pos = getComputedStyle(token);
    if (e.type === "touchstart") {
        xOffset = e.touches[0].clientX - pos.getPropertyValue('left').match(/\d+/)[0];
        yOffset = e.touches[0].clientY - pos.getPropertyValue('top').match(/\d+/)[0];
    } else {
        xOffset = e.clientX - pos.getPropertyValue('left').match(/\d+/)[0];
        yOffset = e.clientY - pos.getPropertyValue('top').match(/\d+/)[0];
    }
}

/**
 * Finalize the dragging of an element. 
 * @param {Event} e The event that triggered this function.
 */
function dragEnd(e) {
    if (active == null) return; // Can happen if you release click over a token
    //if a reminder token is touching a role token it 'attaches' itself to the role token
    if (active.getAttribute("class") == "reminder drag") {
        if (attachTokenToToken(active)) {
            e.preventDefault();
        }
    }
    // The good, evil, and generic reminder tokens.
    if (active.getAttribute("disposable-reminder")) {
        if (active.getAttribute("stacked") == "true") {
            dragPipLayerSpawnDefault(active.getAttribute("alignment"));
        }
        active.setAttribute("stacked", false);
        active.style.cursor = "pointer";
    }

    // If a new reminder token is to be instantiated.
    if (active.getAttribute("ghost") == "true") {
        const role = active.getAttribute("role");
        const reminder = active.children[2].innerText;
        spawnReminder(
            role,
            reminder,
            active.id.substring(e.target.id.length - (2 * UID_LENGTH) - 1, e.target.id.length),
            active.getBoundingClientRect().left + 12.5,
            e.target.getBoundingClientRect().top + 12.5
        );
        if (e.target.getAttribute("token_from") == "info") {
            let x = document.getElementById(active.id.substring(0, e.target.id.length - UID_LENGTH - 1)).getBoundingClientRect().x - document.getElementById("info_token_landing").getBoundingClientRect().x;
            let y = document.getElementById(active.id.substring(0, e.target.id.length - UID_LENGTH - 1)).getBoundingClientRect().y - document.getElementById("info_token_landing").getBoundingClientRect().y;
            // SCUFFED AF
            spawnReminderGhost(
                x,
                y,
                role,
                reminder,
                e.target.id.substring(0, e.target.id.length - UID_LENGTH - 1)
            );
        }
        e.target.parentNode.removeChild(e.target);
    }

    active.style.zIndex = ""; // The default, for some reason
    const container = active.parentElement;
    if (container != null) {
        container.removeChild(active);
        container.appendChild(active);
    }

    active = null;
    if (!loading) {
        save_game_state();
    }
}

/**
 * Drag a token for a single frame. 
 * @param {Event} e The event that triggered this.
 */
function drag(e) {
    if (active == null) return;
    e.preventDefault();
    let moved = active;

    while (moved.localName != "html" && moved.localName != "div") {
        moved = moved.parentElement;
    }
    //if (!moved.classList.contains("role_token")) return;

    if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - xOffset;
        currentY = e.touches[0].clientY - yOffset;
    } else {
        currentX = e.clientX - xOffset;
        currentY = e.clientY - yOffset;
    }

    setTranslate(currentX, currentY);
}

/**
 * Set the offset of this token from the top-left corner of its containing box.
 * This should be the dragZone div!
 * @param {Number} xPos The offset, in pixels, from the left side of the screen.
 * @param {Number} yPos The offset, in pixels, from the top of the screen.
 */
function setTranslate(xPos, yPos) {
    active.style.left = xPos + "px"
    active.style.top = yPos + "px"
}

/**
 * Determine the root of the object being dragged. Users might click on
 * the picture or text elment, and we need to propogate the offsetting to the
 * base div element of the token. 
 * @param {HTMLElement} el The element the user clicked on.
 * @returns The element that should be dragged. 
 */
function getActualDragged(el) {
    let root = el;
    while (root.localName != "body") {
        if (root.classList.contains("role_token")) return root;
        root = root.parentElement;
    }
    return el;
}

/**
 * Determine if this is a role token. See {@link getActualDragged}
 * @param {HTMLElement} el The element the user clicked on.
 * @returns True iff this is a role token. 
 */
function isRoleToken(el) {
    while (el.localName != "body") {
        if (el.classList.contains("role_token")) return true;
        el = el.parentElement;
    }
    return false;
}

/**
 * Determine if the clicked item is actually draggable.
 * @param {EventTarget} target The item that is being clicked.
 * @returns 
 */
function draggingEnabledFor(target) {
    if (document.getElementById("move_toggle").style.backgroundColor != "green" && isRoleToken(target)) {
        return false;
    }
    return target.classList.contains("drag");
}


/**
 * Reset the UI if the user clicks somewhere that isn't a token. 
 */
function neutralClick() {
    active = null;
    hideInfo()
    close_menu()
    unprompt_reminders()
}
