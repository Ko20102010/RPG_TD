with open("js/engine.js", "r", encoding="utf-8") as f:
    code = f.read()

# Let's inspect how selectPadBlueprint is written
import re
m = re.search(r"selectPadBlueprint:\s*function\([^\)]*\)\s*\{[^}]*\}", code)
if m:
    print("Found selectPadBlueprint:\n", m.group(0))

