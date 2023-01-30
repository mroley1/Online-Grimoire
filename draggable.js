
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
