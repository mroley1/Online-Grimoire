
export const Visibility = {
    VISIBLE: 0,
    HIDDEN: 1,
    BLUFF: 2
}

export const Viability = {
    ALIVE: 0,
    DEADVOTE: 1,
    DEAD: 2
}

export class Token {
    #json; // json containing init values
    role; // role e.g. Alchemist, Amnesiac
    uid; // UNIX timecode to differenciate duplicate tokens
    name; // name associated with this token
    #visibility; // is this token visible, hidden, or a bluff
    #viablity; // are they alive, dead, or dead w/ a vote
    #hideFace; // should the role icon be visible during the night e.g. travellers
    #left; // token offset from left
    #top; // token offset from top
    
    getJson() {return this.#json;}
    
    constructor(json) { // pass in json object for token
        this.#json = json; //(async () => {await fetch("./data/tokens").json()[role];})
        this.role = json["id"];
        var time = new Date();
        this.uid = time.getTime();
        this.name = "";
        this.#visibility = () => {
            if (this.#json["hide_token"]) {return Visibility.HIDDEN;}
            else {return Visibility.VISIBLE;}
        }
        this.#hideFace = this.#json["hide_face"]
        this.left = "calc(50% - 75px)";
        this.top = "calc(50% - 75px)";
        //document.getElementById("token_layer").appendChild(this.formHtml());
        // update_role_counts();
        // player_count_change();
        // dragInit();
        // populate_night_order();
    }
    formHtml() {
        var div = document.createElement("div");
        div.setAttribute("onclick", "javascript:infoCall('"+ id + "', " + uid +")");
        div.classList = "role_token drag";
        div.style = "background-image: url('assets/roles/"+id+"_token.png'); left: "+left+"; top: " + top;
        div.id = id+"_token_"+uid;
        div.setAttribute("role", id);
        div.setAttribute("viability", viability);
        div.setAttribute("uid", uid);
        div.setAttribute("visibility", visibility);
        div.setAttribute("cat", cat);
        div.setAttribute("show_face", !hide_face);
        var death = document.createElement("img");
        death.src = "assets/shroud.png";
        death.classList = "token_death";
        death.id = id + "_" + uid + "_death";
        div.appendChild(death);
        var visibility_pip = document.createElement("div");
        visibility_pip.classList = "token_visibility_pip background_image";
        visibility_pip.id = id+"_"+uid+"_visibility_pip";
        div.appendChild(visibility_pip);
        var vote = document.createElement("img");
        vote.src = "assets/vote_token.png";
        vote.classList = "token_vote";
        vote.id = id + "_" + uid + "_vote";
        div.appendChild(vote);
        var oursider_betray = document.createElement("div");
        if (cat == "TRAV"){
            oursider_betray.style.backgroundImage = "url('assets/icons/"+id+".png')"
        }
        oursider_betray.classList = "token_oursider_betray background_image";
        oursider_betray.id = id+"_"+uid+"_oursider_betray";
        div.appendChild(oursider_betray);
        var name = document.createElement("span")
        name.innerHTML = nameText;
        name.classList = "token_text"
        name.id = id+"_name_"+uid;
        div.appendChild(name);
        return div;
    }
}