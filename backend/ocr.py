# optical character recognition

import pytesseract
from region_selector import select_region
from screen_capture import grab_chat_region


def extract_text_from_image(pil_img):
    text = pytesseract.image_to_string(pil_img, lang="eng").strip()
    return text

if __name__ == "__main__":
    print("Select the chat region...")
    print("The selection window will open in 2 seconds...")
    import time
    time.sleep(2)  # Give the user time to prepare
    
    region = select_region()
    
    if region:
        print(f"Region selected: {region}")
        chat_img = grab_chat_region(region)
        chat_img.show()
        
        text = extract_text_from_image(chat_img)
        
        print("\nExtracted text:")
        print("=" * 50)
        print(text)
        print("=" * 50)
    else:
        print("No region selected or selection cancelled.")