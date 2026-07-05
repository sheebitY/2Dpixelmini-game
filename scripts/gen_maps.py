import json, os
base = os.path.join(os.path.dirname(__file__), '..', 'assets', 'maps')
os.makedirs(base, exist_ok=True)

W=25; H=19
GRASS=0; DIRT=1; WALL=2; WATER=3; FLOWERS=4; TREE=5

def grid(fill):
    return [[fill]*W for _ in range(H)]

def borders(g, t=WALL):
    for x in range(W):
        g[0][x]=t; g[H-1][x]=t
    for y in range(H):
        g[y][0]=t; g[y][W-1]=t

def rect(g,x,y,w,h,t):
    for j in range(y,y+h):
        for i in range(x,x+w):
            if 0<=i<W and 0<=j<H:
                g[j][i]=t

def pathH(g,y,x1,x2,t=DIRT):
    for x in range(x1,x2+1):
        g[y][x]=t

def pathV(g,x,y1,y2,t=DIRT):
    for y in range(y1,y2+1):
        g[y][x]=t

def save(mid,g,ps,es):
    json.dump({"id":mid,"cols":W,"rows":H,"player":ps,"enemies":es,"grid":g}, open(os.path.join(base,f"{mid}.json"),"w",encoding="utf-8"), ensure_ascii=False)

# Meadow Village
g=grid(GRASS); borders(g)
rect(g,1,1,7,4,FLOWERS)
rect(g,17,1,7,4,TREE)
pathH(g,9,1,23,DIRT); pathV(g,12,1,17,DIRT)
rect(g,10,7,5,5,DIRT)
rect(g,3,4,3,3,WALL); rect(g,19,4,3,3,WALL); rect(g,3,12,3,3,WALL); rect(g,19,12,3,3,WALL)
rect(g,6,6,2,2,TREE); rect(g,16,6,2,2,TREE); rect(g,6,12,2,2,TREE); rect(g,16,12,2,2,TREE)
rect(g,2,2,2,2,TREE); rect(g,21,2,2,2,TREE); rect(g,2,15,2,2,TREE); rect(g,21,15,2,2,TREE)
save("meadow_village", g, {"x":12,"y":8}, [
  {"type":"slime","x":5,"y":3},
  {"type":"slime","x":7,"y":15},
  {"type":"red_slime","x":20,"y":3},
  {"type":"eagle","x":22,"y":16},
  {"type":"skeleton","x":15,"y":10}
])

# Forest Path
g=grid(GRASS); borders(g)
pathH(g,9,1,23,DIRT)
pathV(g,7,3,15,DIRT); pathV(g,17,3,15,DIRT)
for x in [3,4,5,19,20,21]:
    for y in [5,6,7,11,12,13]:
        g[y][x]=TREE
rect(g,10,4,5,5,FLOWERS); rect(g,10,10,5,5,FLOWERS)
save("forest_path", g, {"x":2,"y":9}, [
  {"type":"slime","x":4,"y":6},
  {"type":"slime","x":20,"y":12},
  {"type":"red_slime","x":12,"y":6},
  {"type":"eagle","x":12,"y":12},
  {"type":"skeleton","x":22,"y":4}
])

# Lakeside Camp
g=grid(GRASS); borders(g)
rect(g,9,7,7,5,WATER)
pathH(g,6,1,23,DIRT); pathV(g,12,1,17,DIRT)
pathV(g,12,7,11,DIRT)
rect(g,2,3,6,6,TREE)
rect(g,18,12,5,4,TREE)
rect(g,4,2,3,2,FLOWERS); rect(g,20,2,3,2,FLOWERS); rect(g,4,15,3,2,FLOWERS); rect(g,20,15,3,2,FLOWERS)
save("lakeside_camp", g, {"x":4,"y":6}, [
  {"type":"slime","x":8,"y":4},
  {"type":"slime","x":20,"y":4},
  {"type":"red_slime","x":20,"y":14},
  {"type":"eagle","x":12,"y":2},
  {"type":"skeleton","x":6,"y":15}
])

# Desert Outpost
g=grid(DIRT); borders(g)
rect(g,1,1,W-2,H-2,DIRT)
rect(g,5,3,4,4,WATER); rect(g,16,12,4,4,WATER)
rect(g,12,8,1,1,TREE)
rect(g,10,4,5,3,WALL); rect(g,10,12,5,3,TREE)
pathH(g,9,1,23,DIRT); pathV(g,12,1,17,DIRT)
for (x,y) in [(3,5),(21,5),(3,13),(21,13),(8,8),(16,8),(8,13),(16,13)]:
    g[y][x]=TREE
save("desert_outpost", g, {"x":2,"y":9}, [
  {"type":"slime","x":6,"y":4},
  {"type":"slime","x":18,"y":13},
  {"type":"red_slime","x":12,"y":6},
  {"type":"eagle","x":12,"y":15},
  {"type":"orc","x":20,"y":6}
])

# Dungeon Lair
g=grid(GRASS); borders(g)
rect(g,1,1,W-2,H-2,DIRT)
rect(g,1,1,W-2,2,WALL); rect(g,1,16,W-2,2,WALL)
rect(g,1,1,2,H-2,WALL); rect(g,22,1,2,H-2,WALL)
rect(g,6,1,2,10,WALL); rect(g,17,8,2,10,WALL)
rect(g,10,4,2,9,WALL); rect(g,14,4,2,9,WALL)
pathH(g,3,3,21,DIRT); pathH(g,15,3,21,DIRT)
pathV(g,4,3,15,DIRT); pathV(g,12,3,15,DIRT); pathV(g,20,3,15,DIRT)
rect(g,2,5,3,3,WALL); rect(g,20,10,3,3,WALL)
save("dungeon_lair", g, {"x":3,"y":3}, [
  {"type":"skeleton","x":7,"y":4},
  {"type":"skeleton","x":18,"y":12},
  {"type":"orc","x":21,"y":5},
  {"type":"red_slime","x":10,"y":12},
  {"type":"eagle","x":14,"y":6}
])
print('generated maps')
