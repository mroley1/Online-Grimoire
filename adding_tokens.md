# adding tokens
#### Note that this process is mostly automated. Run scrape_tokens.py.


- place token image in `assets/icons/official/`. Either rip it from the [BOTC wiki](https://wiki.bloodontheclocktower.com/Main_Page), or find your own image.
- add entry to `data/tokens.json`. Entry should look something like this:
```json
    // This ID should be the same one used in the script tool on the BOTC wiki. 
    "tokenid": {
        // Same as above
        "id": "tokenid", 
        // Full name, with spaces and capitalization
        "name": "Token Name", 
        // Copy the text from the BOTC wiki
        "ability": "Your team wins. Everyone goes home and praises the developers",
        // GOOD, EVIL, or BOTH. 
        "alignment": "GOOD", 
         // townsfolk, outsider, minion, demon, traveller, or fabled. 
        "team": "townsfolk",
        "reminders": [
            // The phrase that should appear on each reminder. 
            // Do not put duplicates. 
            "No Ability" 
        ],
        // What the ST should do on the first night with this character.
        "firstNightReminder": "The role points at a player. Something Bad Happens.",
        // What the ST should do on other nights with this character. 
        "otherNightReminder": "",
        // If the character affects setup, it does so here. 
        "change_makeup": [
            // Each entry is an object with one element.
            {
                // HARD, SOFTPOS, SOFTNEG, LOCK, or REQ.
                "HARD": [
                    // Character type, and how many to increase/decrease/lock to. 
                    "out",
                    2
                ]
            },
            {
                "REQ": [
                    // Type of character, and what character must also be added.
                    "townsfolk",
                    "atheist"
                ]
            }
        ],
        // Does nothing, leave false.
        "hide_token": false,
        // Custom shrouds that this character should have. 
        "shrouds": [
            // Each shroud entry is its own entry in this array. 
            {
                // The card title in the info box.
                "cardTitle": "A short title", 
                // The color of the card in the info box.
                "cardColor": "red",
                // The title shown to the player.
                "title": "Hello player! Text shown to players goes here.",
                // The number of user-pickable role icons. 
                "icons": 1,
                // If the number of these icons cannot be changed. Default false.
                "iconsFixed": true,
                // If the first icon should be of this character. Default false.
                "autofill": true
            }
        ],
        // Jinxes -- poor interactions that need to be dealt with
        "jinx": [
            {
                "id": "otherCharacterId",
                "reason": "This breaks the game for some reason, so do this other thing with one of the roles instead"
            }
        ]
    },
```
- add role to `data/scripts/Gang's All Here.json` or `data/scripts/Unreleased Experimental.json`, based on type.
- add role to `data/nightsheet.json` if necessary.
- Test your character locally before submitting a PR. 

The token scraper adds in most details, except for the ID, setup effects, and the reminder tokens. 
