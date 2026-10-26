import json, urllib.request, sys
key, pid = sys.argv[1], "PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1"
items, tok = [], ""
while True:
    u = f"https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId={pid}&key={key}&pageToken={tok}"
    d = json.load(urllib.request.urlopen(u))
    items += [{"pos": i["snippet"]["position"], "id": i["contentDetails"]["videoId"], "title": i["snippet"]["title"]} for i in d["items"]]
    tok = d.get("nextPageToken")
    if not tok: break
json.dump(items, open(sys.argv[2], "w"), indent=1)
for i in items: print(i["pos"], i["id"], i["title"])
