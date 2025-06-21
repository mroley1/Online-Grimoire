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
            // Each entry is an object with one elemnet. For some reason.
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
    },
```
- add role to `data/scripts/Gang's All Here.json` or `data/scripts/Unreleased Experimental.json`, based on type.
- add role to `data/nightsheet.json` if necessary.
- add and jinxes to `data/jinx.json` if necessary.
- Test your character locally before submitting a PR. 

The token scraper adds in most details, except for the ID, setup effects, and the reminder tokens. 
