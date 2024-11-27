import concurrent.futures as cf
import json
import os
import requests
from bs4 import BeautifulSoup
from functools import cache
from requests.exceptions import HTTPError

WIKI_URL = "https://wiki.bloodontheclocktower.com"

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


def is_offical(entry):
    # An official character has a wiki page for itself.
    return get_soup_by_name(entry["name"]) != None

def sync_description(entry):
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
    summary_element = summary_header.parent.nextSibling.nextSibling
    summary = summary_element.text[1:-2]

    # Step 3: determine if an update is necessary.
    if summary == entry["description"]: return

    entry["description"] = summary
    print("UPDATE   " + (entry["name"] + ": ").ljust(20) + summary)

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


def sync_image(entry):
    icon_url = "https://wiki.bloodontheclocktower.com/File:Icon_{}.png"
    name = entry["name"]
    id = entry["id"]

    # Step 1: Get HTML for the image page
    soup = get_soup(icon_url.format(id))

    if soup is None:
        print(f"Image page for ID {id} not found.")

    # Step 2: Parse HTML to find the element with id "file"
    file_element = soup.find(id='file')

    if file_element is None:
        print(f"No element with id 'file' found for ID {id}.")
        return

    # Step 3: Get the first child which should be an <img> tag
    img_tag = file_element.find('img')
    if not img_tag or 'src' not in img_tag.attrs:
        print(f"No <img> found for ID {id}.")
        return
    
    # Step 4: Get the relative src url
    # Cut off the trailing URL metadata, which changes constantly and is redundant.
    relative_url = img_tag['src'].split("?")[0]
    full_image_url = WIKI_URL + relative_url

    if "image" in entry and full_image_url == entry["image"]: return

    entry["image"] = full_image_url
    print("IMAGE " + (name + ": ").ljust(20) + relative_url)

    # # Step 5: Download and save the image
    # img_response = requests.get(full_image_url)
    # img_response.raise_for_status()

    # # Step 6: Compare to existing image, and see if an edit is necessary.
    # filePath = f"assets/icons/official/{id}.png"
    # if os.path.exists(filePath): 
    #     with open(filePath, "rb") as f:
    #         if f.read() == img_response.content:
    #             return

    # # Save the image
    # with open(filePath, 'wb') as img_file:
    #     img_file.write(img_response.content)
    # print("DOWNLOAD " + (name + ": ").ljust(20) + f"{id}.png")

def check_type(entry, official_keys, homebrew_keys):
    # Unofficial characters will break the parser if we try to search for
    # Them. 
    if is_offical(entry): 
        official_keys.append(entry["id"])
    homebrew_keys.append(entry["id"])

def main():

    with open("data/tokens.json") as f:
        data = json.loads(f.read())

    official_keys = list()
    homebrew_keys = list()

    with cf.ThreadPoolExecutor(max_workers=16) as executor:
        official_threader = [executor.submit(check_type, data[k], official_keys, homebrew_keys) for k in data.keys()]
        cf.wait(official_threader)

    # print(official_keys)

    with cf.ThreadPoolExecutor(max_workers=16) as executor:
        # download_image(entry)
        # sync_description(entry)
        downloader_threader = [executor.submit(sync_image, data[k]) for k in official_keys]
        desc_threader = [executor.submit(sync_description, data[k]) for k in official_keys]
        flavor_threader = [executor.submit(sync_flavor, data[k]) for k in official_keys]
        cf.wait(downloader_threader)
        cf.wait(desc_threader)
        cf.wait(flavor_threader)

    # The tokens.json file is intended to be sorted in alphabetical order.
    # However, unofficial characters MUST come after official characters.
    homebrew_keys.sort()
    official_keys.sort()

    new_data = dict()
    for k in official_keys:
        new_data[k] = data[k]
    for k in homebrew_keys:
        new_data[k] = data[k]

    # Put the data back in the box.
    with open("data/tokens.json", "w") as f:
        f.write(json.dumps(new_data, indent=4))

if __name__ == "__main__":
    main()
