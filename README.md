# EXIF Scrubber

A privacy-first web application to view and remove hidden GPS & camera metadata (EXIF) from your images. Built with Next.js, Tailwind CSS, and shadcn/ui.

## 🔗 Live Demo
[Try EXIF Scrubber](https://exif-scrubber.vercel.app) - View and remove EXIF metadata from your images in seconds

---

## ✨ Features
- **Drag & drop image upload** (JPG/PNG) with instant preview
- **Comprehensive EXIF metadata viewer** (including GPS coordinates, camera settings, timestamps)
- **Interactive map visualization** for images with GPS data (lazy-loaded on demand)
- **Format-preserving download** (PNG stays PNG, JPEG stays JPEG)
- **100% client-side processing** (zero server uploads, complete privacy)

---

## 🚀 Tech Stack
- **Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **EXIF Parsing:** [exifr](https://github.com/MikeKovarik/exifr)
- **Maps:** [Leaflet](https://leafletjs.com/)

---

## 🏗️ Architecture & Key Technical Decisions

### Performance Optimizations
- **Lazy map loading:** Leaflet library and CSS are only loaded when user explicitly requests map visualization, eliminating unnecessary third-party requests for typical use cases
- **Memory management:** Proper cleanup of object URLs and map instances to prevent memory leaks
- **Format preservation:** Canvas-based scrubbing maintains original image format (PNG/JPEG) without forced conversion
- **Client-side only:** Zero network requests for image processing; all operations use browser APIs (FileReader, Canvas)

### Privacy & Security
- **Content Security Policy:** Strict CSP headers configured to prevent unintended network egress
- **No data transmission:** All EXIF extraction and image scrubbing happens entirely in the browser
- **Blob URL management:** Secure handling of temporary object URLs with automatic cleanup

### User Experience
- **Progressive enhancement:** Map feature loads on-demand, reducing initial page load time
- **Accessibility:** ARIA labels, keyboard navigation, and semantic HTML throughout
- **Theme synchronization:** Dark mode toggle accurately reflects system preferences and resolved theme state

---

## 🖥️ Local Development

```bash
# Clone the repo
git clone https://github.com/Yashman-Singh/exif-scrubber.git
cd exif-scrubber

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Privacy & Security
- All image processing is done in your browser.
- No files or metadata are uploaded or stored.
- No analytics, tracking, or cookies.

---

## 📝 License
MIT — Free for personal and commercial use.

---

## 🙏 Credits
This project is built around [exifr](https://github.com/MikeKovarik/exifr) by [MikeKovarik](https://github.com/MikeKovarik) for EXIF metadata extraction. Thank you for creating such a powerful and easy-to-use library that makes client-side EXIF parsing possible.

---

## Author
[Yashman](https://github.com/Yashman-Singh)
