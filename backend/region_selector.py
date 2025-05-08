# select region to filter

import tkinter as tk
import mss
import mss.tools
from PIL import Image, ImageTk, ImageEnhance
import tempfile
import os

def select_region(dimmed=True):
    """
    Screenshot-first approach to region selection.
    This ensures the coordinates match exactly what the user sees.
    
    Args:
        dimmed (bool): If True, show a dimmed version of the screen. If False, show the actual screen.
    """
    # Step 1: Take a screenshot of the entire screen
    with mss.mss() as sct:
        monitor = sct.monitors[1]  # Main monitor
        screenshot = sct.grab(monitor)
        
        # Convert to PIL Image directly
        screenshot_img = Image.frombytes('RGB', screenshot.size, screenshot.rgb)
        
        # Record the original monitor dimensions
        monitor_width = monitor["width"]
        monitor_height = monitor["height"]
        monitor_left = monitor["left"]
        monitor_top = monitor["top"]
    
    # Step 2: Create a window to display the screenshot and select region
    root = tk.Tk()
    root.title("Select Chat Region")
    
    # Set the window to fullscreen and topmost
    root.attributes('-fullscreen', True)
    root.attributes('-topmost', True)
    
    # Setup canvas
    canvas = tk.Canvas(root, highlightthickness=0, width=monitor_width, height=monitor_height)
    canvas.pack(fill='both', expand=True)
    
    # Process the screenshot (dim if requested)
    if dimmed:
        # Dim the screenshot to make selection easier to see
        enhancer = ImageEnhance.Brightness(screenshot_img)
        screenshot_img = enhancer.enhance(0.6)  # 60% brightness
    
    # Convert to PhotoImage and keep a reference
    photo = ImageTk.PhotoImage(screenshot_img)
    
    # Draw the screenshot on the canvas
    canvas.create_image(0, 0, image=photo, anchor='nw')
    
    # Variables to store selection
    selection_rect = None
    start_x = None
    start_y = None
    selection = None
    
    def on_mouse_down(event):
        nonlocal start_x, start_y, selection_rect
        start_x = event.x
        start_y = event.y
        if selection_rect:
            canvas.delete(selection_rect)
        selection_rect = canvas.create_rectangle(
            start_x, start_y, start_x, start_y,
            outline='red', width=3
        )
    
    def on_mouse_move(event):
        nonlocal selection_rect
        if selection_rect and start_x is not None:
            canvas.coords(selection_rect, start_x, start_y, event.x, event.y)
    
    def on_mouse_up(event):
        nonlocal selection
        if selection_rect:
            x1, y1, x2, y2 = canvas.coords(selection_rect)
            left = min(x1, x2)
            top = min(y1, y2)
            width = abs(x2 - x1)
            height = abs(y2 - y1)
            
            # Convert back to screen coordinates
            selection = {
                'left': monitor_left + left,
                'top': monitor_top + top,
                'width': width,
                'height': height,
                'img_x': left,   # Coordinates relative to the screenshot
                'img_y': top,    # for verification
                'img_width': width,
                'img_height': height
            }
            root.quit()
    
    def on_escape(event):
        nonlocal selection
        selection = None
        root.quit()
    
    # Bind events
    canvas.bind('<Button-1>', on_mouse_down)
    canvas.bind('<B1-Motion>', on_mouse_move)
    canvas.bind('<ButtonRelease-1>', on_mouse_up)
    root.bind('<Escape>', on_escape)
    
    # Add instructions
    canvas.create_text(
        monitor_width // 2,
        30,
        text="Click and drag to select chat region (ESC to cancel)",
        fill="red",
        font=("Arial", 16, "bold")
    )
    
    # Start the selection process
    root.mainloop()
    
    # Clean up
    root.destroy()
    
    # Step 3: Verify selection by cropping the original screenshot
    if selection:
        # Crop the original screenshot to show the selected region
        verify_img = screenshot_img.crop((
            selection['img_x'],
            selection['img_y'],
            selection['img_x'] + selection['img_width'],
            selection['img_y'] + selection['img_height']
        ))
        
        # Save the cropped image to a temporary file for verification
        temp_dir = tempfile.gettempdir()
        verify_file = os.path.join(temp_dir, "selection_preview.png")
        verify_img.save(verify_file)
    
    return selection