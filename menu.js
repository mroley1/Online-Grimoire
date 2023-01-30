
function toggle() {
    var el0 = document.getElementById("menu_toggle")
    var el1 = document.getElementById("menu_main")
    if (el0.style.rotate == "180deg") {
        el0.style.rotate = "0deg";
        el1.style.transform = "translateX(-270px)";
        el1.style.opacity = "";
    } else {
        el0.style.rotate = "180deg";
        el1.style.transform = "translateX(0px)";
        el1.style.opacity = "1";
    }
}

async function get_JSON(path) {
    return await (await fetch("./data/"+path)).json();
}

async function populate_script(x){
    var script_names = await get_JSON("scripts/scripts.json")
    var script = await get_JSON("scripts/"+script_names[x]["file"]+".json")
    function header(text,landing) {
        var span = document.createElement(span);
        span.style = "color: white;";
        span.innerHTML = text;
        document.getElementById(landing).appendChild(span);
        var br = document.createElement("br");
        document.getElementById(landing).appendChild(br);
    }
    function options(tokenNames) {
        tokenNames.forEach(async function(tokenName){
            tokenJSON = await get_JSON("tokens/"+tokenName+".json");
            var landing = document.getElementById(tokenJSON["class"])
            var input = document.createElement("input");
            input.type = "checkbox";
            input.id = tokenName;
            input.setAttribute("onclick", "javascript:cast_change('"+ tokenName+"')");
            landing.appendChild(input);
            landing.insertAdjacentHTML("beforeend", "&nbsp;");
            var label = document.createElement("label");
            label.setAttribute("for", tokenName);
            label.classList = "menu_list";
            label.title = tokenJSON["description"];
            label.innerHTML = tokenJSON["name"];
            landing.appendChild(label);
            var br = document.createElement("br");
            landing.appendChild(br);
        })
    }
    function clear(div) {
        document.getElementById(div).innerHTML = ""
    }
    clear("TOWN")
    header("Town","TOWN")
    options(script["townsfolk"])
    clear("OUT")
    header("Outsiders", "OUT")
    options(script["outsiders"])
    clear("MIN")
    header("Minions", "MIN")
    options(script["minions"])
    clear("DEM")
    header("Demons", "DEM")
    options(script["demons"])
}

async function load_scripts(){
    var scripts = await get_JSON("scripts/scripts.json")
    scripts.forEach(element => {
        option = document.createElement("option");
        optionText = document.createTextNode(element["name"]);
        option.appendChild(optionText);
        document.getElementById("script_options").appendChild(option);
    });
    populate_script(0)
    
}

function script_change() {
    populate_script(document.getElementById("script_options").options.selectedIndex)
}

function spawnToken(id) {
    var div = document.createElement("div");
    div.setAttribute("onclick", "javascript:infoCall('"+ id +"')");
    div.classList = "role_token drag";
    div.style = "background-image: url('assets/roles/"+id+"_token.png'); left: "+(parseInt(window.visualViewport.width/2)-75)+"px; top: calc(50% - 75px)";
    div.id = id+"_token";
    document.getElementById("token_layer").appendChild(div);

    const dragSpots = document.getElementsByClassName("drag");
    for (var i = 0; i < dragSpots.length; i++) {
        var container = dragSpots[i];
    
        var active = false;
        var currentX;
        var currentY;
        var xOffset = 0;
        var yOffset = 0;
    
        container.addEventListener("touchstart", dragStart, false);
        container.addEventListener("touchend", dragEnd, false);
        container.addEventListener("touchmove", drag, false);
    
        container.addEventListener("mousedown", dragStart, false);
        container.addEventListener("mouseup", dragEnd, false);
        container.addEventListener("mousemove", drag, false);
      }
    
      function dragStart(e) {
        if (document.getElementById("move_toggle").style.backgroundColor!="green"){return}
        var pos = getComputedStyle(e.target)
        if (e.type === "touchstart") {
          xOffset = e.touches[0].clientX - pos.getPropertyValue('left').match(/\d+/)[0];
          yOffset = e.touches[0].clientY - pos.getPropertyValue('top').match(/\d+/)[0];
        } else {
          xOffset = e.clientX - pos.getPropertyValue('left').match(/\d+/)[0];
          yOffset = e.clientY - pos.getPropertyValue('top').match(/\d+/)[0];
        }
        active = true;
      }
    
      function dragEnd(e) {
        active = false;
      }
    
      function drag(e) {
        if (active) {
        
          e.preventDefault();
        
          if (e.type === "touchmove") {
            currentX = e.touches[0].clientX - xOffset;
            currentY = e.touches[0].clientY - yOffset;
          } else {
            currentX = e.clientX - xOffset;
            currentY = e.clientY - yOffset;
          }
    
          setTranslate(currentX, currentY, e.target);
        }
      }
    
      function setTranslate(xPos, yPos, el) {
        //el.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)";
        el.style.left =  xPos + "px"
        el.style.top =  yPos + "px"
      }
}

function cast_change(interest) {
    var check = document.getElementById(interest)
    console.log(check.checked)
    if (check.checked) {
        spawnToken(interest)
    } else {
        
    }
}

load_scripts()