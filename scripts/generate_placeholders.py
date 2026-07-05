"""Generate placeholder pixel art sprite sheets for the RPG demo.
Run: python scripts/generate_placeholders.py
Replace the output PNGs with AI-generated art (keep same filename & grid layout).
"""
import json, os
from PIL import Image, ImageDraw

BASE = os.path.join(os.path.dirname(__file__), "..", "assets")
T = 32  # tile size

def new_sheet(cols, rows=1):
    return Image.new("RGBA", (cols * T, T * rows), (0, 0, 0, 0))

def draw_rect(d, x, y, w, h, color):
    d.rectangle([x, y, x + w - 1, y + h - 1], fill=color)

# --- Player sheets (4 directions per row: down, up, left, right) ---
def gen_player():
    directions = ["down", "up", "left", "right"]
    # Idle: 2 frames per direction -> 8 frames total
    idle = new_sheet(8)
    d = ImageDraw.Draw(idle)
    for di, dr in enumerate(directions):
        for fi in range(2):
            ox = (di * 2 + fi) * T
            draw_rect(d, ox + 8, 8, 16, 16, (74, 144, 217))
            draw_rect(d, ox + 10, 2, 12, 10, (255, 213, 160))
            if dr == "down":
                draw_rect(d, ox + 12, 5, 3, 3, (34, 34, 34))
                draw_rect(d, ox + 18, 5, 3, 3, (34, 34, 34))
            elif dr == "left":
                draw_rect(d, ox + 10, 5, 3, 3, (34, 34, 34))
            elif dr == "right":
                draw_rect(d, ox + 19, 5, 3, 3, (34, 34, 34))
            lo = 0 if fi == 0 else 2
            draw_rect(d, ox + 9, 24, 6, 6 + lo, (58, 58, 92))
            draw_rect(d, ox + 17, 24, 6, 6 - lo + 2, (58, 58, 92))
    idle.save(os.path.join(BASE, "sprites", "player", "idle.png"))

    # Run: 4 frames per direction -> 16 frames
    run = new_sheet(16)
    d = ImageDraw.Draw(run)
    for di, dr in enumerate(directions):
        for fi in range(4):
            ox = (di * 4 + fi) * T
            draw_rect(d, ox + 8, 8, 16, 16, (74, 144, 217))
            draw_rect(d, ox + 10, 2, 12, 10, (255, 213, 160))
            if dr == "down":
                draw_rect(d, ox + 12, 5, 3, 3, (34, 34, 34))
                draw_rect(d, ox + 18, 5, 3, 3, (34, 34, 34))
            elif dr == "left":
                draw_rect(d, ox + 10, 5, 3, 3, (34, 34, 34))
            elif dr == "right":
                draw_rect(d, ox + 19, 5, 3, 3, (34, 34, 34))
            lo = fi % 2 * 3
            draw_rect(d, ox + 9, 24, 6, 6 + lo, (58, 58, 92))
            draw_rect(d, ox + 17, 24, 6, 8 - lo, (58, 58, 92))
    run.save(os.path.join(BASE, "sprites", "player", "run.png"))

    # Attack: 3 frames per direction -> 12 frames
    atk = new_sheet(12)
    d = ImageDraw.Draw(atk)
    for di, dr in enumerate(directions):
        for fi in range(3):
            ox = (di * 3 + fi) * T
            draw_rect(d, ox + 8, 8, 16, 16, (74, 144, 217))
            draw_rect(d, ox + 10, 2, 12, 10, (255, 213, 160))
            draw_rect(d, ox + 9, 24, 6, 6, (58, 58, 92))
            draw_rect(d, ox + 17, 24, 6, 6, (58, 58, 92))
            if dr == "right":
                draw_rect(d, ox + 24, 10, 4, 12 + fi * 2, (192, 192, 192))
            elif dr == "left":
                draw_rect(d, ox + 4 - fi * 2, 10, 4, 12 + fi * 2, (192, 192, 192))
            elif dr == "down":
                draw_rect(d, ox + 14, 24 + fi * 2, 4, 10, (192, 192, 192))
            else:
                draw_rect(d, ox + 14, 2 - fi * 2, 4, 10, (192, 192, 192))
    atk.save(os.path.join(BASE, "sprites", "player", "attack.png"))

def gen_slime(name, color, alt_color):
    idle = new_sheet(4)
    d = ImageDraw.Draw(idle)
    for fi in range(4):
        ox = fi * T
        sq = 0 if fi % 2 == 0 else 2
        d.ellipse([ox + 4, 12 + sq, ox + 28, 30 + sq], fill=color)
        d.ellipse([ox + 8, 14 + sq, ox + 16, 20 + sq], fill=alt_color)
        draw_rect(d, ox + 10, 16 + sq, 5, 5, (255, 255, 255))
        draw_rect(d, ox + 18, 16 + sq, 5, 5, (255, 255, 255))
        draw_rect(d, ox + 12, 18 + sq, 2, 2, (34, 34, 34))
        draw_rect(d, ox + 20, 18 + sq, 2, 2, (34, 34, 34))
    idle.save(os.path.join(BASE, "sprites", "enemies", f"{name}_idle.png"))

    hurt = new_sheet(2)
    d = ImageDraw.Draw(hurt)
    for fi in range(2):
        ox = fi * T
        d.ellipse([ox + 4, 12, ox + 28, 30], fill=(255, 107, 107))
        d.ellipse([ox + 8, 14, ox + 16, 20], fill=(255, 180, 180))
        draw_rect(d, ox + 10, 16, 5, 5, (255, 255, 255))
        draw_rect(d, ox + 18, 16, 5, 5, (255, 255, 255))
        draw_rect(d, ox + 12, 18, 2, 2, (34, 34, 34))
        draw_rect(d, ox + 20, 18, 2, 2, (34, 34, 34))
    hurt.save(os.path.join(BASE, "sprites", "enemies", f"{name}_hurt.png"))

def gen_tileset():
    names = ["grass", "dirt", "wall", "water", "flowers", "tree"]
    ts = new_sheet(len(names))
    d = ImageDraw.Draw(ts)
    colors = {
        "grass": (74, 140, 63), "dirt": (139, 115, 85),
        "wall": (107, 107, 107), "water": (58, 123, 213),
        "flowers": (74, 140, 63), "tree": (139, 94, 60),
    }
    for i, name in enumerate(names):
        ox = i * T
        c = colors[name]
        d.rectangle([ox, 0, ox + T - 1, T - 1], fill=c)
        if name == "grass":
            for j in range(6):
                d.rectangle([ox + (j*7+5)%28+2, (j*5+3)%28+2]*2, fill=(90, 156, 79))
        elif name == "wall":
            d.rectangle([ox, 0, ox+T-1, 1], fill=(136,136,136))
            d.rectangle([ox, 0, ox+1, T-1], fill=(136,136,136))
            d.rectangle([ox, 14, ox+T-1, 15], fill=(90,90,90))
            d.rectangle([ox+15, 0, ox+16, 14], fill=(90,90,90))
            d.rectangle([ox+8, 16, ox+9, 31], fill=(90,90,90))
        elif name == "water":
            for j in range(3):
                d.rectangle([ox+2+j*4, 10+j*8, ox+10+j*4, 11+j*8], fill=(90,155,229))
        elif name == "flowers":
            fc = [(255,107,107),(255,217,61),(192,132,252)]
            for j in range(4):
                d.rectangle([ox+(j*8+3)%26+2, (j*6+5)%26+3]*2, fill=fc[j%3])
        elif name == "tree":
            d.rectangle([ox+12, 16, ox+19, 31], fill=c)
            d.ellipse([ox+2, 2, ox+30, 22], fill=(45, 140, 45))
            d.ellipse([ox+6, 4, ox+20, 16], fill=(58, 156, 58))
    ts.save(os.path.join(BASE, "tilesets", "overworld.png"))

def gen_ui():
    items = [
        ("icon_sword", (192,192,192), (139,69,19)),
        ("icon_shield", (100,149,237), (139,69,19)),
        ("icon_potion", (255,80,80), (255,180,180)),
    ]
    for name, c1, c2 in items:
        img = Image.new("RGBA", (T, T), (0,0,0,0))
        d = ImageDraw.Draw(img)
        if "sword" in name:
            d.rectangle([14,4,17,22], fill=c1); d.rectangle([10,22,21,26], fill=c2)
        elif "shield" in name:
            d.ellipse([6,4,26,28], fill=c1); d.rectangle([12,10,20,22], fill=c2)
        else:
            d.rectangle([10,8,22,24], fill=c1); d.rectangle([12,4,20,8], fill=c2)
        img.save(os.path.join(BASE, "ui", f"{name}.png"))

def gen_anim_config():
    config = {
        "player": {
            "idle": {"file":"assets/sprites/player/idle.png","frameWidth":32,"frameHeight":32,
                     "directions":["down","up","left","right"],"framesPerDirection":2,"fps":6,"loop":True},
            "run":  {"file":"assets/sprites/player/run.png","frameWidth":32,"frameHeight":32,
                     "directions":["down","up","left","right"],"framesPerDirection":4,"fps":10,"loop":True},
            "attack":{"file":"assets/sprites/player/attack.png","frameWidth":32,"frameHeight":32,
                      "directions":["down","up","left","right"],"framesPerDirection":3,"fps":12,"loop":False}
        },
        "slime": {
            "idle":{"file":"assets/sprites/enemies/slime_idle.png","frameWidth":32,"frameHeight":32,"frames":4,"fps":6,"loop":True},
            "hurt":{"file":"assets/sprites/enemies/slime_hurt.png","frameWidth":32,"frameHeight":32,"frames":2,"fps":8,"loop":False}
        },
        "red_slime": {
            "idle":{"file":"assets/sprites/enemies/red_slime_idle.png","frameWidth":32,"frameHeight":32,"frames":4,"fps":6,"loop":True},
            "hurt":{"file":"assets/sprites/enemies/red_slime_hurt.png","frameWidth":32,"frameHeight":32,"frames":2,"fps":8,"loop":False}
        },
        "tileset": {
            "file":"assets/tilesets/overworld.png","tileSize":32,
            "tiles":{"grass":0,"dirt":1,"wall":2,"water":3,"flowers":4,"tree":5}
        }
    }
    with open(os.path.join(BASE, "animations.json"), "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    gen_player()
    gen_slime("slime", (92, 184, 92), (140, 210, 140))
    gen_slime("red_slime", (217, 83, 79), (240, 140, 140))
    gen_tileset()
    gen_ui()
    gen_anim_config()
    print("Done! Placeholder PNGs generated in assets/")