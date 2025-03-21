/**
 * The Night Counter. A (currently unused) component that sits at the top 
 * of the screen and records what day or night it currently is. 
 */
class NightCounter {
  constructor() {
    this.gameplace = 1;
  }

  /**
   * Determine if it is currently night.
   * @returns True iff the game state is currently night.
   */
  isNight() {
    return this.gameplace % 2 == 0;
  }

  /**
   * Determine if it is current Setup. 
   * @returns True iff the game state is currently setup.
   */
  isSetup() {
    return this.gameplace == 1;
  }

  /**
   * Advance the night counter to the next position.
   */
  nextNight() {
    this.gameplace++;
  }

  /**
   * Revert the night counter to the previous position.
   */
  prevNight() {
    if (this.gameplace > 1) {
      this.gameplace--;
    }
  }

  /**
   * Determine how much the night wedge should be rotated on the screen.
   * @returns The rotation of the night counter, in degrees
   */
  getRot() {
    return this.gameplace * 180;
  }

  /**
   * Determine if the night wedge should report "Night X" or "Day X".
   * Note that this method returns nothing if it's currently setup. 
   * @returns Text for what the night wedge should report.
   */
  getcurrText() {
    if (this.isSetup()) {
      return "setup";
    } else {
      if (this.isNight()) {
        return "night";
      } else
      {
        return "day"
      }
    }
  }

  /**
   * Determine the number to display on the night wedge. 
   * @returns A numeric String of the current night/day, or the empty string 
   *          if it's currently setup.
   */
  getCurrNumber() {
    if (this.isSetup()) {
      return "";
    }
    return Math.floor(this.gameplace / 2).toString();
  }

  toString() {
    return "gameplace: " + this.gameplace + ", " + this.getcurrText() + " " + this.getCurrNumber();
  }
}
const counter = new NightCounter();


function night_wedge_next_day() {
  counter.nextNight();
  document.getElementById("night_wedge_rotate").style.transform = "rotate(" + counter.getRot() + "deg)";
  update_night_wedge_text();
}
function night_wedge_prev_day() {
  counter.prevNight();
  document.getElementById("night_wedge_rotate").style.transform = "rotate(" + counter.getRot() + "deg)";
  update_night_wedge_text();
}
function update_night_wedge_text() {
  if (counter.isNight()) {
    document.getElementById("night_wedge_night_text_pre").innerHTML = counter.getcurrText();
    document.getElementById("night_wedge_night_text_num").innerHTML = counter.getCurrNumber();
  } else
  {
    document.getElementById("night_wedge_day_text_pre").innerHTML = counter.getcurrText();
    document.getElementById("night_wedge_day_text_num").innerHTML = counter.getCurrNumber();
  }
}