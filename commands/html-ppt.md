---
description: "Create HTML presentations from text or markdown content"
---

# HTML PPT Generator

## Purpose
Generate beautiful HTML presentations from user-provided content. The presentations use modern CSS, are responsive, and can be opened in any browser.

## User Input
$ARGUMENTS

## Instructions

Create an HTML presentation based on the user's input. Follow these guidelines:

### Structure
1. **Title Slide**: Create a visually appealing title slide with the presentation title and subtitle
2. **Content Slides**: Break down the content into logical slides (5-10 slides recommended)
3. **Conclusion Slide**: End with a summary or call-to-action

### Design Requirements
- Use modern, clean CSS with smooth transitions
- Include keyboard navigation (arrow keys, spacebar)
- Make it responsive for different screen sizes
- Use a professional color scheme (suggest: dark background with light text, or vice versa)
- Include slide numbers and progress indicator
- Add subtle animations for slide transitions

### Technical Implementation
- Single HTML file with embedded CSS and JavaScript
- No external dependencies (fully self-contained)
- Support for:
  - Bullet points and numbered lists
  - Code blocks with syntax highlighting
  - Images (via URLs)
  - Charts (using simple CSS/SVG)
  - Speaker notes (hidden by default, toggle with 'N' key)

### Navigation
- Left/Right arrow keys: Previous/Next slide
- Spacebar: Next slide
- Escape: Overview mode
- 'N': Toggle speaker notes
- 'F': Fullscreen mode

## Output
Generate a complete, self-contained HTML file that can be saved and opened in any browser. The file should be named `presentation.html` unless the user specifies otherwise.

## Tips for Best Results
- Be specific about the number of slides if needed
- Provide key points or outline for better structure
- Specify color preferences if you have them
- Mention if you need specific charts or diagrams
