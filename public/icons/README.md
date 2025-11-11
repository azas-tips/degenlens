# DegenLens Icons

This directory contains all icon assets for the DegenLens Chrome extension.

## Design Concept

The DegenLens icon combines two key elements:
- **🔍 Magnifying Glass (Lens)**: Represents scanning and analysis
- **😈 Devil Horns**: Represents the "degen" crypto trader culture

**Color Scheme:**
- Primary: Purple (#A855F7) - Main brand color
- Accent: Green (#10b981) - Positive signals
- Accent: Orange (#f59e0b) - Warning signals
- Accent: Red (#ef4444) - Alert signals
- Background: Dark (#1a1a1a) - Matches app UI

## Files

### Extension Icons (Required by Chrome)
These are referenced in `manifest.json`:

- **16.png** (1.6KB) - Browser toolbar icon
- **48.png** (6.0KB) - Extension management page
- **128.png** (9.1KB) - Chrome Web Store listing

### Promotional Images (Chrome Web Store)
Required for Chrome Web Store listing:

- **promo-small.png** (35KB) - Small Promo Tile (440×280px)
  - Used in Chrome Web Store search results
  - Features logo, app name, and key features

- **promo-marquee.png** (93KB) - Marquee Promo Tile (1400×560px)
  - Featured promotional banner
  - Displays main tagline: "Analyze Crypto Tokens with AI"
  - Shows feature badges: AI-Powered, 7 Chains, Real-time, Private

### Source Files (SVG)
Vector source files for editing and regeneration:

- **icon.svg** - Main icon source
- **promo-small.svg** - Small promo source
- **promo-marquee.svg** - Marquee promo source

## Regenerating Icons

If you need to modify the icons, edit the SVG files and regenerate PNGs using ImageMagick:

```bash
# Navigate to icons directory
cd public/icons

# Regenerate extension icons from icon.svg
convert -background none icon.svg -resize 128x128 128.png
convert -background none icon.svg -resize 48x48 48.png
convert -background none icon.svg -resize 16x16 16.png

# Regenerate promotional images
convert -background none promo-small.svg -resize 440x280 promo-small.png
convert -background none promo-marquee.svg -resize 1400x560 promo-marquee.png
```

## Design Guidelines

When modifying icons, follow these guidelines:

1. **Visibility**: Icons must be clear at 16×16px (smallest size)
2. **Consistency**: Maintain the purple (#A855F7) brand color
3. **Dark Mode**: Design for dark backgrounds (extension uses dark theme)
4. **Simplicity**: Avoid excessive detail that becomes muddy when scaled down
5. **Contrast**: Ensure sufficient contrast for accessibility

## Chrome Web Store Requirements

- **Icon sizes**: 16×16, 48×48, 128×128 (PNG)
- **Small Promo Tile**: 440×280 (PNG or JPEG)
- **Marquee Promo Tile**: 1400×560 (PNG or JPEG, optional but recommended)
- **Screenshots**: 1280×800 or 640×400 (PNG or JPEG, minimum 1 required)

See `CHROME_STORE_LISTING.md` in the project root for complete submission requirements.

## License

These icons are part of the DegenLens project and follow the same MIT license.
