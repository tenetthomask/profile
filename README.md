# Personal Hub - [Your Full Name]

A premium, responsive single-page profile interface with a glassmorphism aesthetic.

## Features
- **Voice Command Layer**: Interactive "Listen" button utilizing Web Speech API (STT).
- **Live Status**: Real-time indicator for current work focus.
- **Dark/Light Mode**: Automatic system-based theme matching with manual toggle.
- **Glassmorphism Design**: High-blur, semi-transparent backgrounds for a modern vibe.
- **Asset Optimized**: Fast loading speeds with WebP images.

## Setup & Local Development

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd profile
   ```

2. **Environment Variables**:
   - Rename `secrets.env.example` to `secrets.env`.
   - Add your specific social media links and contact info.

3. **Run Locally**:
   - Using Python (installed by default on most systems):
     ```bash
     python -m http.server 8000
     ```
   - Open `http://localhost:8000` in your browser.

## Technologies
- HTML5 / Vanilla CSS3
- Javascript (Web Speech API)
- Responsive Grid/Flexbox Layout
- Google Fonts (Outfit)
