"""Tiny adb + uiautomator driver: tap:<text>, shot:<png>, sleep:<s>, type:<text>, back, dump."""
import re, subprocess, sys, time
import os
ADB = os.path.join(os.environ.get('ANDROID_HOME', os.path.expanduser('~/Android/Sdk')), 'platform-tools', 'adb')
def sh(*a): return subprocess.run([ADB, *a], capture_output=True, text=True).stdout
def dump():
    sh('shell', 'uiautomator', 'dump', '/sdcard/ui.xml')
    return sh('shell', 'cat', '/sdcard/ui.xml')
def tap(text, contains=True):
    for _ in range(6):
        xml = dump()
        for m in re.finditer(r'<node [^>]*?(?:text|content-desc|resource-id)="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml):
            pass
        for node in re.findall(r'<node [^>]*>', xml):
            vals = re.findall(r'(?:text|content-desc|resource-id)="([^"]*)"', node)
            if any((text in v) if contains else v == text for v in vals):
                x1, y1, x2, y2 = map(int, re.search(r'bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', node).groups())
                sh('shell', 'input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))
                return True
        time.sleep(1)
    raise SystemExit(f'not found: {text}')
def shot(path): open(path, 'wb').write(subprocess.run([ADB, 'exec-out', 'screencap', '-p'], capture_output=True).stdout)
if __name__ == '__main__':
    for step in sys.argv[1:]:
        kind, _, arg = step.partition(':')
        if kind == 'tap': tap(arg)
        elif kind == 'shot': shot(arg)
        elif kind == 'sleep': time.sleep(float(arg))
        elif kind == 'type': sh('shell', 'input', 'text', arg)
        elif kind == 'back': sh('shell', 'input', 'keyevent', '4')
        elif kind == 'dump': print(re.findall(r'text="([^"]+)"', dump()))
