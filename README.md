# PHOTO LAB 📸

**PHOTO LAB** is a retro photography-inspired web app that creates vintage-style collages from your year's photos. Upload your memories and generate beautiful, shareable collages with authentic film filters and grid layouts.

## Features

- 🎨 **Retro Photography Aesthetic**: Vintage film grain, sepia tones, and authentic photography styling
- 📸 **Grid Collage Layouts**: Choose between square or portrait grid arrangements
- 🎞️ **Film Filters**: Multiple color grading styles (Fujifilm, Kodak Portra, Vintage, B&W, and more)
- 🖼️ **Unlimited Uploads**: Upload as many photos as you want for your collage
- 💾 **Local Storage**: Your progress is saved automatically in your browser
- 📥 **Export Options**: Download your collage as a PNG or export multiple versions
- ⚡ **Fast & Lightweight**: Generate your collage in seconds

## Tech Stack

- **Framework**: Next.js with static export
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Image Export**: html-to-image
- **ZIP Generation**: JSZip
- **Deployment**: GitHub Pages

## Getting Started

### Development

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build the static site:
```bash
npm run build
```

The static files will be generated in the `out/` directory.

### Deployment

The app is configured to deploy automatically to GitHub Pages via GitHub Actions. Simply push to the `main` branch and the workflow will:

1. Install dependencies
2. Build the static site
3. Deploy to GitHub Pages

Make sure GitHub Pages is enabled in your repository settings and the workflow has the necessary permissions.

## Project Structure

```
wrapped/
├── pages/              # Next.js pages
│   ├── index.js       # Landing page
│   ├── create.js      # Prompt flow
│   ├── upload.js      # Image upload
│   └── gallery.js     # Results gallery
├── components/         # React components
│   ├── PromptCard.js
│   ├── CardGallery.js
│   ├── CardPreview.js
│   └── ...
├── lib/               # Utilities
│   ├── cardGenerator.js
│   └── storage.js
├── utils/             # Helper functions
│   └── prompts.js
└── styles/            # Global styles
    └── globals.css
```

## Usage

1. Start from the landing page
2. Answer 7 playful prompts (all skippable)
3. Optionally upload 3-5 images
4. View your generated cards in the gallery
5. Download or share your cards

## License

ISC

