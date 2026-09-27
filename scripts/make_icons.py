"""Renders Airtime app icons (flight-arc mark) as PNGs using only the Python standard library."""
import math, struct, zlib, os

BG = (0x0B, 0x0D, 0x12)
LIME = (0xC6, 0xFF, 0x3D)
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')


def png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xFFFFFFFF)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
    data += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)


def dist_seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)


def mark_coverage(u, v, scale):
    """Coverage 0..1 of the mark at normalised coords (u, v in 0..1): a parabolic flight arc, apex dot, ground line."""
    cx, s = 0.5, scale
    pts = [(cx + (i / 40 - 0.5) * 0.62 * s, 0.5 + 0.2 * s - 0.44 * s * (1 - (2 * (i / 40) - 1) ** 2)) for i in range(41)]
    d_arc = min(dist_seg(u, v, *pts[i], *pts[i + 1]) for i in range(40))
    arc = d_arc < 0.035 * s
    dot = math.hypot(u - cx, v - (0.5 - 0.24 * s)) < 0.075 * s
    ground = abs(v - (0.5 + 0.27 * s)) < 0.022 * s and abs(u - cx) < 0.4 * s
    return arc or dot or ground


def render(path, size, scale, bg, fg, rounded=False, ss=3):
    px = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            hits = 0
            for sy in range(ss):
                for sx in range(ss):
                    if mark_coverage((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size, scale):
                        hits += 1
            a = hits / (ss * ss)
            i = (y * size + x) * 4
            if bg is None:
                px[i:i + 4] = bytes((*fg, round(255 * a)))
            else:
                px[i:i + 4] = bytes(tuple(round(bg[k] + (fg[k] - bg[k]) * a) for k in range(3)) + (255,))
    png(path, size, size, px)


if __name__ == '__main__':
    render(os.path.join(OUT, 'icon.png'), 1024, 1.0, BG, LIME)
    render(os.path.join(OUT, 'android-icon-foreground.png'), 512, 0.62, None, LIME)
    render(os.path.join(OUT, 'android-icon-monochrome.png'), 432, 0.62, None, (255, 255, 255))
    png(os.path.join(OUT, 'android-icon-background.png'), 512, 512, bytearray(bytes((*BG, 255)) * 512 * 512))
    render(os.path.join(OUT, 'splash-icon.png'), 512, 0.8, None, LIME)
    render(os.path.join(OUT, 'favicon.png'), 48, 1.0, BG, LIME)
