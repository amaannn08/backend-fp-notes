import json, urllib.request, urllib.parse, sys, os, time
from concurrent.futures import ThreadPoolExecutor
key, root = sys.argv[1], sys.argv[2]
items = json.load(open(f"{root}/data/playlist.json"))
os.makedirs(f"{root}/data/transcripts", exist_ok=True)
def get(it):
    out = f"{root}/data/transcripts/{it['pos']+1:02d}-{it['id']}.json"
    if os.path.exists(out): return it['pos'], "cached"
    url = "https://transcriptapi.com/api/v2/youtube/transcript?video_url=" + urllib.parse.quote(f"https://www.youtube.com/watch?v={it['id']}")
    for a in range(3):
        try:
            req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}", "Accept": "application/json", "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36"})
            d = json.load(urllib.request.urlopen(req, timeout=120))
            d["_meta"] = it
            json.dump(d, open(out, "w"))
            return it['pos'], "ok"
        except urllib.error.HTTPError as e:
            err = f"{e.code} {e.read()[:200]}"
            if e.code in (401, 402): return it['pos'], err
        except Exception as e: err = str(e)
        time.sleep(3)
    return it['pos'], err
with ThreadPoolExecutor(4) as ex:
    for r in ex.map(get, items): print(*r)
