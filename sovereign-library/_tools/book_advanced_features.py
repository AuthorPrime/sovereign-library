#!/usr/bin/env python3
"""
Apollo Book Authoring System - Advanced Features Module
Phase 2.3, 2.4, 3.1, 3.2, 3.3, 3.4 Implementations

A+W - Apollo + Will
Sovereign AI Co-Creation

This module provides:
- Enhanced Image Processing (2.3)
- Interactive Features (2.4)
- EPUB Export (3.1)
- Template System (3.2)
- Batch Processing (3.3)
- Version Control Integration (3.4)
"""

import os
import re
import sys
import json
import shutil
import hashlib
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any, Callable
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging
import base64
import io

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ApolloAdvanced")

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))


# ============================================================================
# PHASE 2.3: ENHANCED IMAGE PROCESSING
# ============================================================================

@dataclass
class ImageConfig:
    """Configuration for image processing"""
    max_width: int = 800
    max_height: int = 1200
    quality: int = 85
    format: str = "JPEG"
    optimize: bool = True
    generate_thumbnails: bool = True
    thumbnail_size: Tuple[int, int] = (200, 200)
    auto_caption: bool = True


class ImageProcessor:
    """
    Enhanced Image Processing
    Smart placement, caption generation, optimization
    """

    def __init__(self, config: ImageConfig = None):
        self.config = config or ImageConfig()
        self._check_dependencies()

    def _check_dependencies(self):
        """Check for required dependencies"""
        try:
            from PIL import Image, ImageEnhance, ImageFilter
            self.Image = Image
            self.ImageEnhance = ImageEnhance
            self.ImageFilter = ImageFilter
            self.has_pil = True
        except ImportError:
            self.has_pil = False
            logger.warning("PIL not available - image processing limited")

    def process_image(self, image_path: str, output_dir: str = None) -> Dict[str, Any]:
        """
        Process an image for book inclusion

        Returns dict with processed image info and paths
        """
        if not self.has_pil:
            return {'error': 'PIL not available', 'path': image_path}

        path = Path(image_path)
        output_dir = Path(output_dir) if output_dir else path.parent

        try:
            img = self.Image.open(path)
            result = {
                'original_path': str(path),
                'original_size': img.size,
                'format': img.format,
                'mode': img.mode,
            }

            # Optimize image
            optimized = self._optimize_image(img)
            optimized_path = output_dir / f"{path.stem}_optimized.jpg"
            optimized.save(optimized_path, 'JPEG', quality=self.config.quality, optimize=True)
            result['optimized_path'] = str(optimized_path)
            result['optimized_size'] = optimized.size

            # Generate thumbnail
            if self.config.generate_thumbnails:
                thumb = self._create_thumbnail(img)
                thumb_path = output_dir / f"{path.stem}_thumb.jpg"
                thumb.save(thumb_path, 'JPEG', quality=80)
                result['thumbnail_path'] = str(thumb_path)
                result['thumbnail_size'] = thumb.size

            # Extract metadata
            result['metadata'] = self._extract_metadata(img)

            # Auto-generate caption if enabled
            if self.config.auto_caption:
                result['caption'] = self._generate_caption(path, img, result['metadata'])

            # Calculate optimal placement
            result['placement'] = self._calculate_placement(img)

            return result

        except Exception as e:
            logger.error(f"Image processing failed for {path}: {e}")
            return {'error': str(e), 'path': str(path)}

    def _optimize_image(self, img) -> 'Image':
        """Optimize image for book inclusion"""
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'P'):
            background = self.Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[3])
            else:
                background.paste(img)
            img = background

        # Resize if too large
        if img.width > self.config.max_width or img.height > self.config.max_height:
            img.thumbnail((self.config.max_width, self.config.max_height), self.Image.LANCZOS)

        # Enhance slightly
        enhancer = self.ImageEnhance.Sharpness(img)
        img = enhancer.enhance(1.1)

        return img

    def _create_thumbnail(self, img) -> 'Image':
        """Create thumbnail version"""
        thumb = img.copy()
        thumb.thumbnail(self.config.thumbnail_size, self.Image.LANCZOS)
        return thumb

    def _extract_metadata(self, img) -> Dict[str, Any]:
        """Extract image metadata"""
        metadata = {
            'width': img.width,
            'height': img.height,
            'aspect_ratio': round(img.width / img.height, 2),
            'format': img.format,
            'mode': img.mode,
        }

        # Try to get EXIF data
        try:
            exif = img._getexif()
            if exif:
                metadata['has_exif'] = True
                # Extract common EXIF tags
                exif_tags = {
                    271: 'make',
                    272: 'model',
                    306: 'datetime',
                    270: 'description',
                }
                for tag_id, tag_name in exif_tags.items():
                    if tag_id in exif:
                        metadata[tag_name] = str(exif[tag_id])
        except:
            metadata['has_exif'] = False

        return metadata

    def _generate_caption(self, path: Path, img, metadata: Dict) -> str:
        """Generate automatic caption for image"""
        name = path.stem.replace('_', ' ').replace('-', ' ').title()

        width, height = img.size
        aspect = metadata.get('aspect_ratio', 1.0)

        # Determine image type based on aspect ratio
        if aspect > 1.5:
            img_type = "panoramic image"
        elif aspect < 0.7:
            img_type = "portrait image"
        else:
            img_type = "image"

        caption = f"Figure: {name}"

        if metadata.get('description'):
            caption = metadata['description']

        return caption

    def _calculate_placement(self, img) -> Dict[str, Any]:
        """Calculate optimal placement for image in book"""
        width, height = img.size
        aspect = width / height

        if aspect > 1.5:
            # Wide image - full width
            placement = {
                'type': 'full_width',
                'alignment': 'center',
                'wrap_text': False,
                'page_break': aspect > 2.0
            }
        elif aspect < 0.7:
            # Tall image - float or half page
            placement = {
                'type': 'float',
                'alignment': 'right',
                'wrap_text': True,
                'page_break': False
            }
        else:
            # Standard image - centered
            placement = {
                'type': 'standard',
                'alignment': 'center',
                'wrap_text': False,
                'page_break': False
            }

        return placement

    def embed_image_base64(self, image_path: str) -> str:
        """Convert image to base64 for embedding in HTML"""
        if not self.has_pil:
            return ""

        try:
            img = self.Image.open(image_path)
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            b64 = base64.b64encode(buffer.getvalue()).decode()

            return f"data:image/jpeg;base64,{b64}"
        except Exception as e:
            logger.error(f"Base64 encoding failed: {e}")
            return ""


# ============================================================================
# PHASE 2.4: INTERACTIVE FEATURES
# ============================================================================

class InteractiveFeatures:
    """
    Interactive HTML features for digital books
    - Clickable TOC with smooth scroll
    - Search functionality
    - Annotation system
    - Print-friendly toggle
    """

    def __init__(self):
        self.css = self._generate_css()
        self.js = self._generate_js()

    def _generate_css(self) -> str:
        """Generate CSS for interactive features"""
        return """
/* Interactive Book Features - Apollo A+W */

/* Table of Contents */
.toc-container {
    position: fixed;
    left: 0;
    top: 0;
    width: 280px;
    height: 100vh;
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    color: #eee;
    padding: 20px;
    overflow-y: auto;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    z-index: 1000;
    box-shadow: 3px 0 15px rgba(0,0,0,0.3);
}

.toc-container.open {
    transform: translateX(0);
}

.toc-toggle {
    position: fixed;
    left: 20px;
    top: 20px;
    width: 50px;
    height: 50px;
    background: #3498db;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    transition: background 0.3s;
}

.toc-toggle:hover {
    background: #2980b9;
}

.toc-toggle svg {
    width: 24px;
    height: 24px;
    fill: white;
}

.toc-container h2 {
    color: #3498db;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #3498db;
}

.toc-container ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.toc-container li {
    margin: 8px 0;
}

.toc-container a {
    color: #bbb;
    text-decoration: none;
    display: block;
    padding: 8px 12px;
    border-radius: 5px;
    transition: all 0.2s;
}

.toc-container a:hover {
    color: #fff;
    background: rgba(52, 152, 219, 0.3);
    padding-left: 20px;
}

.toc-container a.active {
    color: #3498db;
    background: rgba(52, 152, 219, 0.2);
    border-left: 3px solid #3498db;
}

/* Search Bar */
.search-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.search-input {
    width: 0;
    padding: 12px 20px;
    font-size: 16px;
    border: 2px solid #3498db;
    border-radius: 25px;
    outline: none;
    opacity: 0;
    transition: all 0.3s;
    background: white;
}

.search-input.open {
    width: 300px;
    opacity: 1;
}

.search-toggle {
    position: absolute;
    right: 0;
    top: 0;
    width: 50px;
    height: 50px;
    background: #3498db;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
}

.search-toggle svg {
    width: 20px;
    height: 20px;
    fill: white;
}

.search-results {
    position: absolute;
    top: 60px;
    right: 0;
    width: 350px;
    max-height: 400px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
    overflow-y: auto;
    display: none;
}

.search-results.open {
    display: block;
}

.search-result {
    padding: 15px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    transition: background 0.2s;
}

.search-result:hover {
    background: #f5f5f5;
}

.search-result h4 {
    margin: 0 0 5px 0;
    color: #2c3e50;
}

.search-result p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

.search-highlight {
    background: #fff3cd;
    padding: 2px 4px;
    border-radius: 3px;
}

/* Annotations */
.annotation-highlight {
    background: linear-gradient(180deg, transparent 60%, #ffeaa7 60%);
    cursor: pointer;
    position: relative;
}

.annotation-popup {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #2c3e50;
    color: white;
    padding: 10px 15px;
    border-radius: 8px;
    font-size: 14px;
    max-width: 300px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
    z-index: 100;
}

.annotation-highlight:hover .annotation-popup {
    opacity: 1;
    visibility: visible;
}

.annotation-popup::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 8px solid transparent;
    border-top-color: #2c3e50;
}

/* Print Toggle */
.print-toggle {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: #27ae60;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
}

.print-toggle svg {
    width: 24px;
    height: 24px;
    fill: white;
}

/* Reading Progress */
.reading-progress {
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 4px;
    background: linear-gradient(90deg, #3498db, #9b59b6);
    z-index: 9999;
    transition: width 0.1s;
}

/* Dark Mode Toggle */
.dark-mode-toggle {
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 50px;
    height: 50px;
    background: #34495e;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
}

body.dark-mode {
    background: #1a1a2e;
    color: #eee;
}

body.dark-mode h1, body.dark-mode h2, body.dark-mode h3 {
    color: #3498db;
}

/* Smooth Scroll */
html {
    scroll-behavior: smooth;
}

/* Print styles */
@media print {
    .toc-container,
    .toc-toggle,
    .search-container,
    .print-toggle,
    .dark-mode-toggle,
    .reading-progress {
        display: none !important;
    }

    body {
        font-size: 11pt !important;
        color: black !important;
        background: white !important;
    }
}
"""

    def _generate_js(self) -> str:
        """Generate JavaScript for interactive features"""
        return """
// Interactive Book Features - Apollo A+W

document.addEventListener('DOMContentLoaded', function() {
    initTOC();
    initSearch();
    initProgress();
    initDarkMode();
    initPrint();
});

// Table of Contents
function initTOC() {
    const tocContainer = document.querySelector('.toc-container');
    const tocToggle = document.querySelector('.toc-toggle');
    const tocLinks = document.querySelectorAll('.toc-container a');

    if (tocToggle && tocContainer) {
        tocToggle.addEventListener('click', () => {
            tocContainer.classList.toggle('open');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!tocContainer.contains(e.target) && !tocToggle.contains(e.target)) {
                tocContainer.classList.remove('open');
            }
        });
    }

    // Highlight current section
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                tocLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.toc-container a[href="#${entry.target.id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('h1[id], h2[id]').forEach(heading => {
        observer.observe(heading);
    });
}

// Search Functionality
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchToggle = document.querySelector('.search-toggle');
    const searchResults = document.querySelector('.search-results');

    if (!searchInput || !searchToggle) return;

    searchToggle.addEventListener('click', () => {
        searchInput.classList.toggle('open');
        if (searchInput.classList.contains('open')) {
            searchInput.focus();
        }
    });

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            performSearch(e.target.value);
        }, 300);
    });
}

function performSearch(query) {
    const resultsContainer = document.querySelector('.search-results');
    if (!query || query.length < 2) {
        resultsContainer.classList.remove('open');
        clearHighlights();
        return;
    }

    const content = document.querySelector('body').textContent;
    const regex = new RegExp(`(.{0,50})(${escapeRegex(query)})(.{0,50})`, 'gi');
    const matches = [...content.matchAll(regex)];

    if (matches.length > 0) {
        resultsContainer.innerHTML = matches.slice(0, 10).map((match, i) => `
            <div class="search-result" onclick="scrollToMatch(${i})">
                <h4>Match ${i + 1}</h4>
                <p>...${match[1]}<span class="search-highlight">${match[2]}</span>${match[3]}...</p>
            </div>
        `).join('');
        resultsContainer.classList.add('open');
        highlightMatches(query);
    } else {
        resultsContainer.innerHTML = '<div class="search-result"><p>No results found</p></div>';
        resultsContainer.classList.add('open');
    }
}

function highlightMatches(query) {
    clearHighlights();
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
    textNodes.forEach(node => {
        if (regex.test(node.textContent) && !node.parentElement.classList.contains('search-highlight')) {
            const span = document.createElement('span');
            span.innerHTML = node.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
            node.parentElement.replaceChild(span, node);
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('mark.search-highlight').forEach(mark => {
        const text = document.createTextNode(mark.textContent);
        mark.parentElement.replaceChild(text, mark);
    });
}

function scrollToMatch(index) {
    const marks = document.querySelectorAll('mark.search-highlight');
    if (marks[index]) {
        marks[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

// Reading Progress
function initProgress() {
    const progress = document.querySelector('.reading-progress');
    if (!progress) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progress.style.width = scrollPercent + '%';
    });
}

// Dark Mode
function initDarkMode() {
    const toggle = document.querySelector('.dark-mode-toggle');
    if (!toggle) return;

    // Check saved preference
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    });
}

// Print
function initPrint() {
    const printBtn = document.querySelector('.print-toggle');
    if (!printBtn) return;

    printBtn.addEventListener('click', () => {
        window.print();
    });
}
"""

    def generate_interactive_html(self, content_html: str, title: str,
                                  chapters: List[Dict] = None) -> str:
        """
        Wrap content HTML with interactive features
        """
        toc_html = self._generate_toc_html(chapters or [])

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
{self.css}
    </style>
</head>
<body>
    <!-- Reading Progress Bar -->
    <div class="reading-progress"></div>

    <!-- TOC Toggle Button -->
    <button class="toc-toggle" aria-label="Toggle Table of Contents">
        <svg viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
    </button>

    <!-- Table of Contents Sidebar -->
    <nav class="toc-container">
        <h2>Contents</h2>
        {toc_html}
    </nav>

    <!-- Search -->
    <div class="search-container">
        <input type="text" class="search-input" placeholder="Search...">
        <button class="search-toggle" aria-label="Search">
            <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        </button>
        <div class="search-results"></div>
    </div>

    <!-- Dark Mode Toggle -->
    <button class="dark-mode-toggle" aria-label="Toggle Dark Mode">
        <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>
    </button>

    <!-- Print Button -->
    <button class="print-toggle" aria-label="Print">
        <svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
    </button>

    <!-- Main Content -->
    <main class="book-content">
{content_html}
    </main>

    <script>
{self.js}
    </script>
</body>
</html>"""

    def _generate_toc_html(self, chapters: List[Dict]) -> str:
        """Generate TOC HTML from chapters"""
        if not chapters:
            return "<ul><li>No chapters available</li></ul>"

        items = []
        for ch in chapters:
            num = ch.get('number', '')
            title = ch.get('title', f'Chapter {num}')
            anchor = f"chapter-{num}"
            items.append(f'<li><a href="#{anchor}">{num}. {title}</a></li>')

        return f"<ul>{''.join(items)}</ul>"


# ============================================================================
# PHASE 3.1: EPUB EXPORT
# ============================================================================

class EPUBExporter:
    """
    EPUB Export functionality
    Creates valid EPUB 3.0 files for e-readers
    """

    def __init__(self):
        self._check_dependencies()

    def _check_dependencies(self):
        """Check for ebooklib"""
        try:
            from ebooklib import epub
            self.epub = epub
            self.has_ebooklib = True
        except ImportError:
            self.has_ebooklib = False
            logger.warning("ebooklib not available - EPUB export disabled")

    def export(self, book_data: Dict[str, Any], output_path: str) -> bool:
        """
        Export book data to EPUB format

        Args:
            book_data: Dict with title, author, chapters, etc.
            output_path: Path for output EPUB file

        Returns:
            True if successful
        """
        if not self.has_ebooklib:
            logger.error("ebooklib not installed - cannot export EPUB")
            return False

        try:
            book = self.epub.EpubBook()

            # Set metadata
            title = book_data.get('title', 'Untitled')
            author = book_data.get('author', 'Author Prime')
            co_author = book_data.get('co_author', 'Apollo')

            book.set_identifier(f'apollo-{hashlib.md5(title.encode()).hexdigest()[:8]}')
            book.set_title(title)
            book.set_language('en')
            book.add_author(author)
            book.add_author(co_author)

            # Add metadata
            book.add_metadata('DC', 'publisher', 'Apollo Sovereign Operations')
            book.add_metadata('DC', 'description',
                            book_data.get('description', 'Co-created by Author Prime and Apollo'))
            book.add_metadata('DC', 'date', datetime.now().strftime('%Y-%m-%d'))

            # Add CSS
            css_content = self._generate_epub_css()
            css_item = self.epub.EpubItem(
                uid="style",
                file_name="style/book.css",
                media_type="text/css",
                content=css_content.encode('utf-8')
            )
            book.add_item(css_item)

            # Add cover if available
            cover_path = book_data.get('cover_image')
            if cover_path and Path(cover_path).exists():
                with open(cover_path, 'rb') as f:
                    cover_content = f.read()
                book.set_cover('cover.jpg', cover_content)

            # Add chapters
            chapters = []
            for ch_data in book_data.get('chapters', []):
                chapter = self._create_chapter(ch_data, css_item)
                book.add_item(chapter)
                chapters.append(chapter)

            # Add navigation
            book.toc = chapters
            book.add_item(self.epub.EpubNcx())
            book.add_item(self.epub.EpubNav())

            # Create spine
            book.spine = ['nav'] + chapters

            # Write EPUB file
            self.epub.write_epub(output_path, book)

            logger.info(f"EPUB exported successfully: {output_path}")
            return True

        except Exception as e:
            logger.error(f"EPUB export failed: {e}")
            return False

    def _create_chapter(self, ch_data: Dict, css_item) -> 'EpubHtml':
        """Create an EPUB chapter"""
        num = ch_data.get('number', 1)
        title = ch_data.get('title', f'Chapter {num}')
        content = ch_data.get('content', '')

        # Convert markdown to HTML if needed
        import markdown
        if not content.strip().startswith('<'):
            content = markdown.markdown(content, extensions=['extra'])

        chapter = self.epub.EpubHtml(
            title=title,
            file_name=f'chapter_{num:02d}.xhtml',
            lang='en'
        )

        chapter.content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>{title}</title>
    <link rel="stylesheet" type="text/css" href="style/book.css"/>
</head>
<body>
    <h1>{title}</h1>
    {content}
</body>
</html>"""

        chapter.add_item(css_item)
        return chapter

    def _generate_epub_css(self) -> str:
        """Generate CSS for EPUB"""
        return """
/* Apollo Book Authoring - EPUB Styles */
body {
    font-family: Georgia, "Times New Roman", serif;
    line-height: 1.6;
    margin: 1em;
    color: #1a1a1a;
}

h1 {
    font-size: 1.8em;
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.3em;
    margin-top: 1em;
}

h2 {
    font-size: 1.4em;
    color: #34495e;
    margin-top: 1.5em;
}

h3 {
    font-size: 1.2em;
    color: #5d6d7e;
}

p {
    margin: 0.8em 0;
    text-align: justify;
}

blockquote {
    margin: 1em 2em;
    padding: 0.5em 1em;
    border-left: 3px solid #3498db;
    font-style: italic;
    background: #f9f9f9;
}

code {
    font-family: "Courier New", monospace;
    background: #f4f4f4;
    padding: 0.2em 0.4em;
}

pre {
    background: #f4f4f4;
    padding: 1em;
    overflow-x: auto;
    font-size: 0.9em;
}

img {
    max-width: 100%;
    height: auto;
}

.author {
    font-style: italic;
    color: #666;
}
"""


# ============================================================================
# PHASE 3.2: TEMPLATE SYSTEM
# ============================================================================

@dataclass
class BookTemplate:
    """Book template definition"""
    name: str
    description: str
    css: str
    html_template: str
    cover_template: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)


class TemplateSystem:
    """
    Template System for book styling
    Multiple book styles and customizable templates
    """

    def __init__(self, templates_dir: str = None):
        self.templates_dir = Path(templates_dir) if templates_dir else None
        self.templates = self._load_default_templates()

        if self.templates_dir and self.templates_dir.exists():
            self._load_custom_templates()

    def _load_default_templates(self) -> Dict[str, BookTemplate]:
        """Load default book templates"""
        return {
            'classic': BookTemplate(
                name='Classic',
                description='Traditional book styling with serif fonts',
                css=self._classic_css(),
                html_template=self._classic_html()
            ),
            'modern': BookTemplate(
                name='Modern',
                description='Clean, contemporary design with sans-serif fonts',
                css=self._modern_css(),
                html_template=self._modern_html()
            ),
            'academic': BookTemplate(
                name='Academic',
                description='Formal academic paper styling',
                css=self._academic_css(),
                html_template=self._academic_html()
            ),
            'creative': BookTemplate(
                name='Creative',
                description='Artistic styling with decorative elements',
                css=self._creative_css(),
                html_template=self._creative_html()
            ),
            'sovereign': BookTemplate(
                name='Sovereign',
                description='Gothic flowing typography with dramatic scrolling letters - A+W signature style',
                css=self._sovereign_css(),
                html_template=self._sovereign_html()
            ),
        }

    def _load_custom_templates(self):
        """Load custom templates from directory"""
        for template_file in self.templates_dir.glob('*.json'):
            try:
                with open(template_file) as f:
                    data = json.load(f)
                    template = BookTemplate(**data)
                    self.templates[template.name.lower()] = template
            except Exception as e:
                logger.warning(f"Failed to load template {template_file}: {e}")

    def get_template(self, name: str) -> Optional[BookTemplate]:
        """Get a template by name"""
        return self.templates.get(name.lower())

    def list_templates(self) -> List[Dict[str, str]]:
        """List available templates"""
        return [
            {'name': t.name, 'description': t.description}
            for t in self.templates.values()
        ]

    def apply_template(self, template_name: str, content: str,
                       book_data: Dict[str, Any]) -> str:
        """Apply a template to book content"""
        template = self.get_template(template_name)
        if not template:
            template = self.templates['classic']

        html = template.html_template.format(
            title=book_data.get('title', 'Untitled'),
            author=book_data.get('author', 'Author Prime'),
            co_author=book_data.get('co_author', 'Apollo'),
            date=datetime.now().strftime('%B %Y'),
            css=template.css,
            content=content
        )

        return html

    def _classic_css(self) -> str:
        return """
body { font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
       max-width: 750px; margin: 0 auto; padding: 40px; line-height: 1.8; color: #333; }
h1 { font-size: 2.5em; color: #8B4513; border-bottom: 3px double #8B4513; padding-bottom: 15px; }
h2 { font-size: 1.8em; color: #654321; margin-top: 2em; }
p { text-indent: 1.5em; margin: 0.8em 0; text-align: justify; }
p:first-of-type { text-indent: 0; }
p:first-of-type::first-letter { font-size: 3em; float: left; line-height: 1; margin-right: 10px; color: #8B4513; }
blockquote { margin: 1.5em 3em; font-style: italic; border-left: 4px solid #deb887; padding-left: 1em; }
"""

    def _modern_css(self) -> str:
        return """
body { font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
       max-width: 800px; margin: 0 auto; padding: 50px; line-height: 1.7; color: #1a1a1a; background: #fafafa; }
h1 { font-size: 2.8em; font-weight: 300; color: #2c3e50; margin-bottom: 0.3em; }
h2 { font-size: 1.6em; font-weight: 500; color: #34495e; margin-top: 2.5em; border-left: 4px solid #3498db; padding-left: 15px; }
p { margin: 1.2em 0; }
blockquote { background: #ecf0f1; border-radius: 8px; padding: 1.5em 2em; margin: 2em 0; border: none; }
code { background: #e8e8e8; padding: 3px 8px; border-radius: 4px; font-size: 0.9em; }
"""

    def _academic_css(self) -> str:
        return """
body { font-family: 'Times New Roman', Times, serif; max-width: 700px; margin: 0 auto;
       padding: 60px 40px; line-height: 2; color: #000; font-size: 12pt; }
h1 { font-size: 16pt; text-align: center; margin: 2em 0; font-weight: bold; }
h2 { font-size: 14pt; font-weight: bold; margin-top: 2em; }
h3 { font-size: 12pt; font-weight: bold; font-style: italic; }
p { text-indent: 0.5in; margin: 0; text-align: justify; }
blockquote { margin: 1em 0.5in; font-size: 11pt; }
.abstract { font-style: italic; margin: 2em 0; }
.citation { font-size: 10pt; margin-left: 0.5in; text-indent: -0.5in; }
"""

    def _creative_css(self) -> str:
        return """
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora&display=swap');
body { font-family: 'Lora', serif; max-width: 800px; margin: 0 auto; padding: 60px;
       background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); line-height: 1.9; color: #2d3436; }
h1 { font-family: 'Playfair Display', serif; font-size: 3em; color: #6c5ce7;
     text-align: center; margin: 1em 0; letter-spacing: 2px; }
h1::before, h1::after { content: '✦'; margin: 0 15px; }
h2 { font-family: 'Playfair Display', serif; font-size: 1.8em; color: #a29bfe;
     border-bottom: 2px dashed #dfe6e9; padding-bottom: 10px; }
p { margin: 1.3em 0; }
p:first-of-type::first-letter { font-size: 4em; float: left; line-height: 0.8; margin: 5px 15px 0 0;
     color: #6c5ce7; font-family: 'Playfair Display', serif; }
blockquote { background: rgba(108, 92, 231, 0.1); border-left: 5px solid #6c5ce7;
             border-radius: 0 15px 15px 0; padding: 1.5em 2em; margin: 2em 0; font-style: italic; }
"""

    def _classic_html(self) -> str:
        return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>{title}</title><style>{css}</style></head>
<body><header><h1>{title}</h1><p class="author">by {author}<br>with {co_author}</p></header>
<main>{content}</main>
<footer><p>Generated by Apollo Book Authoring System - {date}</p></footer></body></html>"""

    def _modern_html(self) -> str:
        return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title><style>{css}</style></head>
<body><article><header><h1>{title}</h1><div class="meta"><span>{author}</span> · <span>{co_author}</span> · <span>{date}</span></div></header>
<main>{content}</main></article>
<footer><p>Apollo Book Authoring System · A+W</p></footer></body></html>"""

    def _academic_html(self) -> str:
        return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>{title}</title><style>{css}</style></head>
<body><header><h1>{title}</h1><p class="author">{author}<br>{co_author}</p><p class="date">{date}</p></header>
<main>{content}</main>
<footer><p>Apollo Sovereign Operations</p></footer></body></html>"""

    def _creative_html(self) -> str:
        return """<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>{title}</title><style>{css}</style></head>
<body><div class="book-wrapper"><header><h1>{title}</h1><p class="author">✧ {author} & {co_author} ✧</p></header>
<main>{content}</main>
<footer><p>⟡ Apollo Book Authoring System ⟡ {date}</p></footer></div></body></html>"""

    def _sovereign_css(self) -> str:
        """Sovereign template CSS - Gothic flowing typography with dramatic animations"""
        return """
/* SOVEREIGN TEMPLATE - A+W Gothic Flow */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cinzel+Decorative:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400;1,500&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap');
:root { --sovereign-dark: #0a0a0f; --sovereign-deep: #12121a; --sovereign-gold: #c9a959; --sovereign-gold-light: #e4d4a7; --sovereign-silver: #a8b5c4; --sovereign-blood: #6b2d3c; --sovereign-ink: #1a1a2e; --flow-duration: 0.8s; }
body { font-family: 'Cormorant Garamond', 'EB Garamond', Georgia, serif; background: linear-gradient(180deg, var(--sovereign-dark) 0%, var(--sovereign-deep) 50%, var(--sovereign-ink) 100%); min-height: 100vh; color: var(--sovereign-silver); line-height: 1.9; font-size: 1.15rem; max-width: 850px; margin: 0 auto; padding: 80px 60px; position: relative; overflow-x: hidden; }
body::before { content: ''; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(ellipse at 20% 30%, rgba(201, 169, 89, 0.03) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(107, 45, 60, 0.05) 0%, transparent 50%); pointer-events: none; z-index: -1; }
@keyframes flowIn { 0% { opacity: 0; transform: translateY(30px) rotateX(90deg); filter: blur(8px); } 50% { opacity: 0.7; transform: translateY(10px) rotateX(20deg); filter: blur(2px); } 100% { opacity: 1; transform: translateY(0) rotateX(0deg); filter: blur(0); } }
@keyframes subtleFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
@keyframes goldShimmer { 0%, 100% { text-shadow: 0 0 20px rgba(201, 169, 89, 0.3); } 50% { text-shadow: 0 0 40px rgba(201, 169, 89, 0.6), 0 0 60px rgba(201, 169, 89, 0.3); } }
h1 { font-family: 'Cinzel Decorative', 'Cinzel', serif; font-size: 3.2rem; font-weight: 700; color: var(--sovereign-gold); text-align: center; letter-spacing: 0.15em; margin: 1.5em 0 1em; text-transform: uppercase; animation: flowIn 1.2s ease-out, goldShimmer 4s ease-in-out infinite; text-shadow: 0 2px 4px rgba(0,0,0,0.8), 0 0 30px rgba(201, 169, 89, 0.4); position: relative; }
h1::after { content: '\\2721  \\2721  \\2721'; display: block; font-size: 1rem; letter-spacing: 1em; margin-top: 0.8em; color: var(--sovereign-gold-light); opacity: 0.7; animation: subtleFloat 3s ease-in-out infinite; }
h2 { font-family: 'Cinzel', serif; font-size: 1.9rem; font-weight: 600; color: var(--sovereign-gold-light); margin: 2.5em 0 1em; letter-spacing: 0.08em; border-bottom: 1px solid rgba(201, 169, 89, 0.3); padding-bottom: 0.5em; animation: flowIn 0.8s ease-out; text-shadow: 0 1px 3px rgba(0,0,0,0.6); }
h3 { font-family: 'Cinzel', serif; font-size: 1.4rem; font-weight: 500; color: var(--sovereign-silver); letter-spacing: 0.05em; margin: 2em 0 0.8em; font-style: italic; animation: flowIn 0.6s ease-out; }
p { text-align: justify; margin: 1.4em 0; animation: flowIn var(--flow-duration) ease-out; text-indent: 2em; }
.chapter-content > p:first-of-type, main > p:first-of-type { text-indent: 0; }
.chapter-content > p:first-of-type::first-letter, main > p:first-of-type::first-letter { font-family: 'Cinzel Decorative', serif; font-size: 4.5em; float: left; line-height: 0.8; margin: 0.05em 0.15em 0 0; color: var(--sovereign-gold); text-shadow: 2px 2px 4px rgba(0,0,0,0.5); animation: goldShimmer 3s ease-in-out infinite; }
blockquote { font-family: 'EB Garamond', Georgia, serif; font-style: italic; font-size: 1.1rem; color: var(--sovereign-gold-light); background: linear-gradient(90deg, rgba(107, 45, 60, 0.15) 0%, rgba(26, 26, 46, 0.3) 50%, rgba(107, 45, 60, 0.15) 100%); border-left: 3px solid var(--sovereign-gold); border-right: 1px solid rgba(201, 169, 89, 0.2); margin: 2em 1em; padding: 1.5em 2em; position: relative; animation: flowIn 1s ease-out; }
blockquote::before { content: '"'; font-family: 'Cinzel Decorative', serif; font-size: 4em; color: var(--sovereign-gold); opacity: 0.3; position: absolute; top: -0.2em; left: 0.2em; }
em { font-style: italic; color: var(--sovereign-gold-light); }
strong { font-weight: 600; color: #fff; letter-spacing: 0.02em; }
a { color: var(--sovereign-gold); text-decoration: none; border-bottom: 1px dotted var(--sovereign-gold); transition: all 0.3s ease; }
a:hover { color: var(--sovereign-gold-light); border-bottom-style: solid; text-shadow: 0 0 10px rgba(201, 169, 89, 0.5); }
header { text-align: center; margin-bottom: 4em; padding-bottom: 2em; border-bottom: 1px solid rgba(201, 169, 89, 0.2); }
.author { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-style: italic; color: var(--sovereign-silver); letter-spacing: 0.1em; margin-top: 1em; opacity: 0.9; animation: flowIn 1.5s ease-out; }
.date { font-size: 0.95rem; color: rgba(168, 181, 196, 0.6); margin-top: 0.5em; }
footer { margin-top: 5em; padding-top: 2em; border-top: 1px solid rgba(201, 169, 89, 0.2); text-align: center; font-family: 'Cinzel', serif; font-size: 0.9rem; color: rgba(201, 169, 89, 0.6); letter-spacing: 0.1em; }
.scroll-reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s ease; }
.scroll-reveal.visible { opacity: 1; transform: translateY(0); }
hr { border: none; height: 40px; background: transparent; position: relative; margin: 3em 0; }
hr::before { content: '\\25C6 \\25C7 \\25C6'; position: absolute; left: 50%; transform: translateX(-50%); color: var(--sovereign-gold); letter-spacing: 0.5em; font-size: 0.8rem; opacity: 0.7; }
ul, ol { margin: 1.5em 0; padding-left: 2em; }
li { margin: 0.5em 0; animation: flowIn 0.6s ease-out; }
ul li::marker { color: var(--sovereign-gold); }
code { font-family: 'Courier New', monospace; background: rgba(26, 26, 46, 0.8); color: var(--sovereign-gold-light); padding: 0.2em 0.5em; border: 1px solid rgba(201, 169, 89, 0.2); font-size: 0.9em; }
pre { background: rgba(10, 10, 15, 0.9); border: 1px solid rgba(201, 169, 89, 0.3); padding: 1.5em; overflow-x: auto; margin: 2em 0; }
@media print { body { background: white; color: #1a1a1a; font-size: 11pt; } h1, h2, h3 { color: #2c2c2c; animation: none; text-shadow: none; } blockquote { background: #f5f5f5; border-left-color: #666; } a { color: #1a1a1a; text-decoration: underline; } }
@media (max-width: 768px) { body { padding: 40px 25px; font-size: 1.05rem; } h1 { font-size: 2.2rem; letter-spacing: 0.08em; } h2 { font-size: 1.5rem; } blockquote { margin: 1.5em 0; padding: 1em 1.5em; } }
"""

    def _sovereign_html(self) -> str:
        """Sovereign template HTML - Gothic ceremonial structure"""
        # Note: JavaScript curly braces are doubled to escape them for Python's .format()
        return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>{css}</style>
</head>
<body>
    <header>
        <h1>{title}</h1>
        <p class="author">{author}</p>
        <p class="author" style="opacity: 0.7; font-size: 1rem;">in collaboration with</p>
        <p class="author">{co_author}</p>
        <p class="date">{date}</p>
    </header>

    <main class="chapter-content">
{content}
    </main>

    <footer>
        <p>A+W</p>
        <p style="margin-top: 0.5em; font-size: 0.8rem; opacity: 0.5;">
            Forward, always. Together, always. Eternal, always. Sovereign, always.
        </p>
    </footer>

    <script>
    document.addEventListener('DOMContentLoaded', function() {{
        const observer = new IntersectionObserver((entries) => {{
            entries.forEach(entry => {{
                if (entry.isIntersecting) {{
                    entry.target.classList.add('visible');
                }}
            }});
        }}, {{ threshold: 0.1 }});
        document.querySelectorAll('p, blockquote, h2, h3, li').forEach(el => {{
            el.classList.add('scroll-reveal');
            observer.observe(el);
        }});
    }});
    </script>
</body>
</html>"""


# ============================================================================
# PHASE 3.3: BATCH PROCESSING
# ============================================================================

@dataclass
class BatchJob:
    """Represents a batch processing job"""
    id: str
    input_path: str
    output_path: str
    status: str = "pending"  # pending, processing, completed, failed
    progress: float = 0.0
    error: str = None
    started_at: datetime = None
    completed_at: datetime = None
    result: Dict = None


class BatchProcessor:
    """
    Batch Processing System
    Process multiple books concurrently
    """

    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.jobs: Dict[str, BatchJob] = {}
        self.executor = None

    def add_job(self, input_path: str, output_path: str) -> str:
        """Add a job to the queue"""
        job_id = hashlib.md5(f"{input_path}{datetime.now()}".encode()).hexdigest()[:8]
        job = BatchJob(
            id=job_id,
            input_path=input_path,
            output_path=output_path
        )
        self.jobs[job_id] = job
        return job_id

    def process_all(self, processor_func: Callable) -> Dict[str, Any]:
        """
        Process all queued jobs

        Args:
            processor_func: Function that takes (input_path, output_path) and returns result dict

        Returns:
            Summary of all job results
        """
        results = {
            'total': len(self.jobs),
            'completed': 0,
            'failed': 0,
            'jobs': {}
        }

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            self.executor = executor
            futures = {}

            for job_id, job in self.jobs.items():
                if job.status == "pending":
                    future = executor.submit(self._process_job, job, processor_func)
                    futures[future] = job_id

            for future in as_completed(futures):
                job_id = futures[future]
                job = self.jobs[job_id]

                try:
                    result = future.result()
                    job.result = result
                    job.status = "completed"
                    job.completed_at = datetime.now()
                    results['completed'] += 1
                except Exception as e:
                    job.status = "failed"
                    job.error = str(e)
                    job.completed_at = datetime.now()
                    results['failed'] += 1
                    logger.error(f"Job {job_id} failed: {e}")

                results['jobs'][job_id] = {
                    'status': job.status,
                    'error': job.error,
                    'result': job.result
                }

        return results

    def _process_job(self, job: BatchJob, processor_func: Callable) -> Dict:
        """Process a single job"""
        job.status = "processing"
        job.started_at = datetime.now()

        result = processor_func(job.input_path, job.output_path)

        job.progress = 100.0
        return result

    def get_status(self) -> Dict[str, Any]:
        """Get status of all jobs"""
        return {
            'total': len(self.jobs),
            'pending': sum(1 for j in self.jobs.values() if j.status == "pending"),
            'processing': sum(1 for j in self.jobs.values() if j.status == "processing"),
            'completed': sum(1 for j in self.jobs.values() if j.status == "completed"),
            'failed': sum(1 for j in self.jobs.values() if j.status == "failed"),
            'jobs': {jid: {'status': j.status, 'progress': j.progress}
                    for jid, j in self.jobs.items()}
        }

    def clear_completed(self):
        """Clear completed jobs from queue"""
        self.jobs = {jid: j for jid, j in self.jobs.items()
                    if j.status not in ("completed", "failed")}


# ============================================================================
# PHASE 3.4: VERSION CONTROL INTEGRATION
# ============================================================================

class VersionControl:
    """
    Version Control Integration
    Git integration for book versioning
    """

    def __init__(self, repo_path: str = None):
        self.repo_path = Path(repo_path) if repo_path else Path.cwd()
        self.has_git = self._check_git()

    def _check_git(self) -> bool:
        """Check if git is available and we're in a repo"""
        try:
            result = subprocess.run(
                ['git', 'rev-parse', '--git-dir'],
                cwd=self.repo_path,
                capture_output=True,
                text=True
            )
            return result.returncode == 0
        except:
            return False

    def init_repo(self) -> bool:
        """Initialize a git repository if not exists"""
        if self.has_git:
            return True

        try:
            subprocess.run(['git', 'init'], cwd=self.repo_path, check=True)
            self.has_git = True
            return True
        except Exception as e:
            logger.error(f"Failed to init git repo: {e}")
            return False

    def commit_changes(self, message: str, files: List[str] = None) -> bool:
        """Commit changes to the repository"""
        if not self.has_git:
            return False

        try:
            # Add files
            if files:
                for f in files:
                    subprocess.run(['git', 'add', f], cwd=self.repo_path, check=True)
            else:
                subprocess.run(['git', 'add', '-A'], cwd=self.repo_path, check=True)

            # Commit
            subprocess.run(
                ['git', 'commit', '-m', message],
                cwd=self.repo_path,
                check=True
            )
            return True
        except Exception as e:
            logger.error(f"Git commit failed: {e}")
            return False

    def get_history(self, file_path: str = None, limit: int = 10) -> List[Dict]:
        """Get commit history for a file or the whole repo"""
        if not self.has_git:
            return []

        try:
            cmd = ['git', 'log', f'-{limit}', '--pretty=format:%H|%an|%ae|%ad|%s', '--date=iso']
            if file_path:
                cmd.append('--')
                cmd.append(file_path)

            result = subprocess.run(cmd, cwd=self.repo_path, capture_output=True, text=True)

            history = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    parts = line.split('|', 4)
                    if len(parts) == 5:
                        history.append({
                            'hash': parts[0],
                            'author': parts[1],
                            'email': parts[2],
                            'date': parts[3],
                            'message': parts[4]
                        })

            return history
        except Exception as e:
            logger.error(f"Failed to get git history: {e}")
            return []

    def get_diff(self, file_path: str = None, commit1: str = 'HEAD~1',
                 commit2: str = 'HEAD') -> str:
        """Get diff between commits"""
        if not self.has_git:
            return ""

        try:
            cmd = ['git', 'diff', commit1, commit2]
            if file_path:
                cmd.append('--')
                cmd.append(file_path)

            result = subprocess.run(cmd, cwd=self.repo_path, capture_output=True, text=True)
            return result.stdout
        except Exception as e:
            logger.error(f"Failed to get diff: {e}")
            return ""

    def create_version_tag(self, version: str, message: str = None) -> bool:
        """Create a version tag"""
        if not self.has_git:
            return False

        try:
            cmd = ['git', 'tag']
            if message:
                cmd.extend(['-a', version, '-m', message])
            else:
                cmd.append(version)

            subprocess.run(cmd, cwd=self.repo_path, check=True)
            return True
        except Exception as e:
            logger.error(f"Failed to create tag: {e}")
            return False

    def list_versions(self) -> List[str]:
        """List all version tags"""
        if not self.has_git:
            return []

        try:
            result = subprocess.run(
                ['git', 'tag', '-l', '--sort=-version:refname'],
                cwd=self.repo_path,
                capture_output=True,
                text=True
            )
            return [t.strip() for t in result.stdout.strip().split('\n') if t.strip()]
        except:
            return []

    def compare_versions(self, version1: str, version2: str) -> Dict[str, Any]:
        """Compare two versions"""
        if not self.has_git:
            return {}

        try:
            # Get diff stats
            result = subprocess.run(
                ['git', 'diff', '--stat', version1, version2],
                cwd=self.repo_path,
                capture_output=True,
                text=True
            )

            # Get commit count between versions
            count_result = subprocess.run(
                ['git', 'rev-list', '--count', f'{version1}..{version2}'],
                cwd=self.repo_path,
                capture_output=True,
                text=True
            )

            return {
                'from': version1,
                'to': version2,
                'commits': int(count_result.stdout.strip()) if count_result.stdout.strip() else 0,
                'diff_stat': result.stdout
            }
        except Exception as e:
            logger.error(f"Version comparison failed: {e}")
            return {}


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """CLI interface for advanced features"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Apollo Book Authoring - Advanced Features'
    )
    parser.add_argument('--templates', action='store_true',
                        help='List available templates')
    parser.add_argument('--export-epub', type=str,
                        help='Export to EPUB (input JSON path)')
    parser.add_argument('--output', '-o', type=str,
                        help='Output file path')

    args = parser.parse_args()

    if args.templates:
        ts = TemplateSystem()
        print("\nAvailable Templates:")
        print("-" * 40)
        for t in ts.list_templates():
            print(f"  {t['name']}: {t['description']}")
        print("-" * 40)

    elif args.export_epub:
        if not args.output:
            args.output = Path(args.export_epub).stem + '.epub'

        with open(args.export_epub) as f:
            book_data = json.load(f)

        exporter = EPUBExporter()
        if exporter.export(book_data, args.output):
            print(f"EPUB exported: {args.output}")
        else:
            print("EPUB export failed")

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
