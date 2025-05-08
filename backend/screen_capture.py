# screen capture of specific region

import mss
from PIL import Image

def grab_chat_region(region):
    if not region:
        raise ValueError("Region must be specified")
        
    with mss.mss() as sct:
        monitor = {
            "left": int(region["left"]),
            "top": int(region["top"]),
            "width": int(region["width"]),
            "height": int(region["height"])
        }
        
        sct_img = sct.grab(monitor)
        
        return Image.frombytes("RGB", sct_img.size, sct_img.rgb)