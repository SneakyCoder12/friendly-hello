# Prompt for Lovable AI (React Migration)

Copy the text below and paste it into Lovable to convert your project to a modern React application.

---

**Project Goal:**  
I have a custom HTML/JS website for selling UAE Number Plates. The core feature is a **custom canvas-based plate generator** that renders realistic number plates (Embrossed effect, correct fonts, layouts for 7 Emirates).  
I want you to convert this entire project into a **Modern React Application (using Vite + Tailwind CSS)** for better performance and maintainability.

**Key Requirements:**

1. **Tech Stack:**  
   - [ ] React 18+  
   - [ ] Vite (Fast build tool)  
   - [ ] Tailwind CSS (Reuse existing classes from `code.html`)  
   - [ ] Lucide React (or similar) for icons instead of Material Icons  

2. **Core Functionality to Preserve (CRITICAL):**  
   - [ ] **The Plate Generator Engine:** You MUST port the detailed logic from `plate-generator.js` exactly. It handles:  
     - Pixel-perfect rendering for 7 different emirates (Abu Dhabi, Dubai, etc.).  
     - Custom fonts (`GL-Nummernschild-Mtl.ttf`, `DIN-1451.ttf`) loaded via FontFace API.  
     - Canvas drawing with `ctx.shadow`, `ctx.filter` (emboss effects), and clipping paths.  
     - **DO NOT simplify this logic.** It is carefully tuned. Wrap it in a `usePlateGenerator` hook or a utility class.  

3. **Page Structure:**  
   - [ ] **Header/Navbar**: Logo, Navigation.  
   - [ ] **Hero Section**: The search bars and main banner.  
   - [ ] **Plate Listings (Home)**: 7 Sections (Abu Dhabi, Dubai, Sharjah, etc.). Each section has 4 cards.  
     - *Important*: The plates inside the cards are NOT static images. They are rendered dynamically using the Generator Engine. Use the data structure from `homepage-plates.js` as your source of truth.  
   - [ ] **Live Generator (Preview)**: The "Create Your Plate" section. Users pick an emirate, type updates live on the canvas. Includes "Download HD" button (port the `downloadPlate` function).  
   - [ ] **Footer**: Links and copyright.  

4. **Performance Optimization:**  
   - Lazy load the plate generator engine (it's heavy).  
   - Memoize the generated plate canvases in the listing cards so they don't re-render on every scroll.  
   - Use `next/image` or standard `<img>` with proper aspect ratios.  

5. **Files to Use as Reference:**  
   - `code.html` (Current UI structure & Tailwind classes)  
   - `plate-generator.js` (The CORE rendering engine logic - copy this logic!)  
   - `homepage-plates.js` (The data for the 28 listing cards)  
   - Images in root folder (`abudhabi-plate.png`, logos, etc.) -> Move these to `/public` folder in React.  
   - Fonts in `/fonts` -> Move to `/public/fonts`.  

**Output:**  
Scaffold the full project structure. Start by creating the `PlateGenerator` utility and the `PlateCard` component.
