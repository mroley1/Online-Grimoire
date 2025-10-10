import concurrent.futures as cf
import json
import os
import sys
from functools import cache
from requests.exceptions import HTTPError

import requests
from bs4 import BeautifulSoup

WIKI_URL = "https://wiki.bloodontheclocktower.com"
NIGHTSHEET_JSON = json.loads(requests.get("https://script.bloodontheclocktower.com/data/nightsheet.json", timeout=10).content)
JINX_JSON = json.loads(requests.get("https://script.bloodontheclocktower.com/data/jinx.json", timeout=10).content)
JINX_JSON = {x["id"]: x for x in JINX_JSON}

@cache
def get_soup(uri: str) -> BeautifulSoup | None:
    response = requests.get(uri)
    try:
        response.raise_for_status()
    except HTTPError as e:
        # An unofficial character has no wiki page. 
        if e.response.reason == "Not Found": return None
        # Other errors that may occur are unintended.
        raise e
    
    return BeautifulSoup(response.content, "html.parser")
        
def get_soup_by_name(name: str):
    character_path = "/" + name.replace(" ", "_")
    return get_soup(WIKI_URL + character_path)

def sync_ability(entry):
    # Step 1: Get the HTML for the character.
    soup = get_soup_by_name(entry["name"])

    # Step 2: Find the "Summary" elment. 
    summary_header = soup.find(id='Summary')
    # The wiki is set up in a very predictable manner:
    # <h2>
    #   <div id="Summary"> ... </div>
    # <h2>
    # \n
    # <p> "Each night, something bad happens."\n</p>
    # This gets the text and trims the quotes.
    summary_element = summary_header.parent.next_sibling.next_sibling
    summary = summary_element.text[1:-2]

    # Step 3: determine if an update is necessary.
    if "ability" in entry and summary == entry["ability"]: return

    entry["ability"] = summary
    print("UPDATE " + (entry["name"] + ": ").ljust(20) + summary)

def sync_flavor(entry):
    # Step 1: Get the HTML for the character.
    soup = get_soup_by_name(entry["name"])

    # Step 2: Find the "Flavor" element. 
    flavor_element = soup.find(class_="flavour")
    flavor_text = flavor_element.text[1:-1]

    # Step 3: determine if an update is necessary
    if "flavor" in entry and entry["flavor"] == flavor_text: return
    entry["flavor"] = flavor_text

    if len(flavor_text) > 100: flavor_text = flavor_text[:97] + "..."
    flavor_text = '"' + flavor_text + '"'
    print("FLAVOR " + (entry["name"] + ": ").ljust(20) + flavor_text)

def sync_image_url(entry):
    icon_url = "https://wiki.bloodontheclocktower.com/File:Icon_{}.png"
    name = entry["name"]
    id = entry["id"]

    # Step 1: Get HTML for the image page
    soup = get_soup(icon_url.format(id))

    if soup is None:
        file_path = f"assets/icons/official/{id}.png"
        if "image" in entry and file_path == entry["image"]: return

        entry["image"] = file_path
        print("IMAGE " + (name + ": ").ljust(20) + file_path)
        print(f"ERROR " + (name + ":").ljust(20) + "Image page not found.")
        return

    # Step 2: Parse HTML to find the element with id "file"
    file_element = soup.find(id='file')

    if file_element is None:
        print(f"ERROR " + (name + ":").ljust(20) + "No element with id 'file' found")
        return

    # Step 3: Get the first child which should be an <img> tag
    img_tag = file_element.find('img')
    if not img_tag or 'src' not in img_tag.attrs:
        print(f"ERROR " + (name + ":").ljust(20) + "No <img> found")
        return
    
    # Step 4: Get the relative src url
    # Cut off the trailing URL metadata, which only serves to stop caching
    relative_url = img_tag['src'].split("?")[0]
    full_image_url = WIKI_URL + relative_url

    # # Step 5: Download and save the image
    try:
        img_response = requests.get(full_image_url)
        img_response.raise_for_status()
    except HTTPError as e:
        if e.response.reason == "Not Found":
            print("ERROR " + (name + ": ").ljust(20) + relative_url.ljust(30) + " NOT FOUND!")
            return
        raise e

    # Step 6: Compare to existing image, and see if an edit is necessary.
    overwrite = True
    file_path = f"assets/icons/official/{id}.png"
    if os.path.exists(file_path): 
        with open(file_path, "rb") as f:
            if f.read() == img_response.content:
                overwrite = False

    # Save the image
    if overwrite:
        with open(file_path, 'wb') as img_file:
            img_file.write(img_response.content)
        print("DOWNLOAD " + (name + ": ").ljust(20) + f"{id}.png")

    if "image" in entry and file_path == entry["image"]: return

    entry["image"] = file_path
    print("IMAGE " + (name + ": ").ljust(20) + relative_url)

    

def sync_nightorder(entry):
    # Step 1: get night order from TPI
    firstList: list = NIGHTSHEET_JSON["firstNight"]
    otherList = NIGHTSHEET_JSON["otherNight"]


    if entry["id"] in firstList:
        first = firstList.index(entry["id"]) + 1
    else:
        first = 0

    if entry["id"] in otherList:
        other = otherList.index(entry["id"]) + 1
    else:
        other = 0

    if "firstNight" not in entry or entry["firstNight"] != first:
        if "firstNight" not in entry:
            print("N1 SET " + (entry["name"] + ": ").ljust(20) + str(first))
        else:
            print("N1 UPDATE " + (entry["name"] + ": ").ljust(20) + f"{entry["firstNight"]} --> {first}")
        entry["firstNight"] = first

    if "otherNight" not in entry or entry["otherNight"] != other:
        if "otherNight" not in entry:
            print("EN SET " + (entry["name"] + ": ").ljust(20) + str(other))
        else:
            print("EN UPDATE " + (entry["name"] + ": ").ljust(20) + f"{entry["otherNight"]} --> {other}")
        entry["otherNight"] = other

def sync_jinxes(entry):
    if entry["id"] not in JINX_JSON: return
    jinxes = JINX_JSON[entry["id"]]["jinx"]
    if "jinx" in entry and entry["jinx"] == jinxes: return

    entry["jinx"] = jinxes
    print("JINXES " + (entry["name"] + ": ").ljust(20) + str(len(jinxes)) + " jinxes")

def force_compatibility(entry):
    ALLOWED = set([
        "id", 
        "name", 
        "description", "ability",
        "team", "class", 
        "tokens", "reminders", "remindersGlobal", # All the same, for most purposes
        "first_night_desc", "firstNightReminder",
        "other_night_desc", "otherNightReminder",
        "firstNight",
        "otherNight",
        "change_makeup", # TODO: depreciate
        "image",
        "flavor",
        "shrouds", # Custom shroud data
    ])

    CHANGE = {
        # OLD --> NEW
        "class": "team",
        "description": "ability",
        "tokens": "reminders",
        "first_night_desc": "firstNightReminder",
        "other_night_desc": "otherNightReminder",
    }
    
    new_entry = dict()
    for key in entry.keys():
        if key not in ALLOWED: continue
        if key in CHANGE:
            new_entry[CHANGE[key]] = entry[key]
        else:
            new_entry[key] = entry[key]
    
    return new_entry

def main():
    print("TOKEN SCRAPER")
    print("LOADING DATA...")
    with open("data/tokens.json") as f:
        data: dict = json.loads(f.read())

    official_keys = sorted(data.keys())
    
    relevant_keys = official_keys
    if len(sys.argv) > 1:
        start = sys.argv[1]
        relevant_keys = [x for x in relevant_keys if x.startswith(start)]

    print("CACHING WIKI PAGES...")
    with cf.ThreadPoolExecutor(max_workers=16) as executor:
        cacher = [executor.submit(get_soup_by_name, v) for v in relevant_keys]

    data = {k: force_compatibility(v) for k, v in data.items()}

    with cf.ThreadPoolExecutor(max_workers=16) as executor:
        print("SYNCING IMAGES...")
        downloader_threader = [executor.submit(sync_image_url, data[k]) for k in relevant_keys]
        cf.wait(downloader_threader)

        print("SYNCING DESCRIPTION...")
        desc_threader = [executor.submit(sync_ability, data[k]) for k in relevant_keys]
        cf.wait(desc_threader)

        print("SYNCING FLAVOR...")
        flavor_threader = [executor.submit(sync_flavor, data[k]) for k in relevant_keys]
        cf.wait(flavor_threader)

        print("SYNCING NGIHT ORDER...")
        order_threader = [executor.submit(sync_nightorder, data[k]) for k in relevant_keys]
        cf.wait(order_threader)

        print("SYNCING JINXES...")
        jinx_threader = [executor.submit(sync_jinxes, data[k]) for k in relevant_keys]
        cf.wait(jinx_threader)

    print("FINALIZING...")
    new_data = dict()

    for k in official_keys:
        new_data[k] = data[k]

    # Put the data back in the box.
    with open("data/tokens.json", "w") as f:
        f.write(json.dumps(new_data, indent=4))

if __name__ == "__main__":
    main()
