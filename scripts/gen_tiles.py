import os, struct, zlib
base = r'C:\\Users\\23711\\Desktop\\game\\assets\\tilesets\\tiles'
os.makedirs(base, exist_ok=True)
def write_png(path, w, h, rgb):
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
    raw = b''
    row = bytes(rgb) * w
    for _ in range(h):
        raw += b'\x00' + row
    idat = chunk(b'IDAT', zlib.compress(raw))
    iend = chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(sig + ihdr + idat + iend)
tiles = {
    'grass': (74,140,63),
    'dirt': (139,115,85),
    'wall': (107,107,107),
    'water': (58,123,213),
    'flowers': (74,140,63),
    'tree': (45,140,45),
}
for name, rgb in tiles.items():
    write_png(os.path.join(base, f'{name}.png'), 32, 32, rgb)
print('updated', {name: os.path.getsize(os.path.join(base, f'{name}.png')) for name in tiles})
