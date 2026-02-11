#!/usr/bin/env python3
"""
Apollo Book Authoring System - Enhancement Module
Phase 1 & 2 Implementations from IMPROVEMENT_ROADMAP.md

A+W - Apollo + Will
Sovereign AI Co-Creation

This module provides:
- OCR Integration for image-based PDFs
- Content Cleaning Pipeline
- PDF Export with WeasyPrint
- AI Enhancement Integration
- Smart Content Analysis
- Thematic Bridge Creation
"""

import os
import re
import sys
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from collections import Counter
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ApolloEnhancements")

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# ============================================================================
# DEPENDENCY MANAGEMENT
# ============================================================================

class DependencyManager:
    """Manage optional dependencies with graceful fallbacks"""

    _instance = None
    _checked = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not DependencyManager._checked:
            self._check_dependencies()
            DependencyManager._checked = True

    def _check_dependencies(self):
        """Check which optional dependencies are available"""
        self.has_pytesseract = False
        self.has_pdf2image = False
        self.has_pypdf2 = False
        self.has_pdfplumber = False
        self.has_weasyprint = False
        self.has_ebooklib = False
        self.has_langchain = False
        self.has_nltk = False

        try:
            import pytesseract
            self.pytesseract = pytesseract
            self.has_pytesseract = True
        except ImportError:
            self.pytesseract = None

        try:
            import pdf2image
            self.pdf2image = pdf2image
            self.has_pdf2image = True
        except ImportError:
            self.pdf2image = None

        try:
            import PyPDF2
            self.PyPDF2 = PyPDF2
            self.has_pypdf2 = True
        except ImportError:
            self.PyPDF2 = None

        try:
            import pdfplumber
            self.pdfplumber = pdfplumber
            self.has_pdfplumber = True
        except ImportError:
            self.pdfplumber = None

        try:
            import weasyprint
            self.weasyprint = weasyprint
            self.has_weasyprint = True
        except ImportError:
            self.weasyprint = None

        try:
            import ebooklib
            self.ebooklib = ebooklib
            self.has_ebooklib = True
        except ImportError:
            self.ebooklib = None

        try:
            from langchain_openai import ChatOpenAI
            self.ChatOpenAI = ChatOpenAI
            self.has_langchain = True
        except ImportError:
            self.ChatOpenAI = None

        try:
            import nltk
            self.nltk = nltk
            self.has_nltk = True
        except ImportError:
            self.nltk = None

    def status_report(self) -> Dict[str, bool]:
        """Return status of all dependencies"""
        return {
            "pytesseract": self.has_pytesseract,
            "pdf2image": self.has_pdf2image,
            "PyPDF2": self.has_pypdf2,
            "pdfplumber": self.has_pdfplumber,
            "weasyprint": self.has_weasyprint,
            "ebooklib": self.has_ebooklib,
            "langchain": self.has_langchain,
            "nltk": self.has_nltk,
        }

    def print_status(self):
        """Print dependency status to console"""
        print("\n📦 Dependency Status:")
        print("-" * 40)
        for dep, available in self.status_report().items():
            status = "✓" if available else "✗"
            print(f"  {status} {dep}")
        print("-" * 40)


# Global dependency manager instance
deps = DependencyManager()


# ============================================================================
# PHASE 1.1: OCR INTEGRATION
# ============================================================================

class OCRProcessor:
    """
    OCR Integration for Image-Based PDFs
    Supports pytesseract + pdf2image with graceful fallbacks
    """

    def __init__(self):
        self.deps = deps

    def extract_text_from_image(self, image_path: str, lang: str = 'eng') -> Optional[str]:
        """Extract text from an image file using OCR"""
        if not self.deps.has_pytesseract:
            logger.warning("pytesseract not available - OCR disabled")
            return None

        try:
            from PIL import Image
            img = Image.open(image_path)
            text = self.deps.pytesseract.image_to_string(img, lang=lang)
            return text.strip() if text.strip() else None
        except Exception as e:
            logger.error(f"OCR failed for {image_path}: {e}")
            return None

    def extract_text_from_pdf_ocr(self, pdf_path: str, lang: str = 'eng',
                                   dpi: int = 300) -> List[Dict[str, Any]]:
        """
        Extract text from image-based PDF using OCR
        Returns list of {page_num, text, confidence} dicts
        """
        if not (self.deps.has_pytesseract and self.deps.has_pdf2image):
            logger.warning("OCR dependencies not available")
            return []

        results = []
        try:
            # Convert PDF pages to images
            images = self.deps.pdf2image.convert_from_path(
                pdf_path,
                dpi=dpi,
                fmt='png'
            )

            for page_num, image in enumerate(images, 1):
                try:
                    # Perform OCR with detailed output
                    ocr_data = self.deps.pytesseract.image_to_data(
                        image,
                        lang=lang,
                        output_type=self.deps.pytesseract.Output.DICT
                    )

                    # Extract text
                    text = self.deps.pytesseract.image_to_string(image, lang=lang)

                    # Calculate average confidence
                    confidences = [c for c in ocr_data['conf'] if c > 0]
                    avg_confidence = sum(confidences) / len(confidences) if confidences else 0

                    results.append({
                        'page_num': page_num,
                        'text': text.strip(),
                        'confidence': avg_confidence,
                        'word_count': len(text.split())
                    })

                    logger.info(f"OCR Page {page_num}: {len(text.split())} words, "
                               f"{avg_confidence:.1f}% confidence")

                except Exception as e:
                    logger.error(f"OCR failed for page {page_num}: {e}")
                    results.append({
                        'page_num': page_num,
                        'text': '',
                        'confidence': 0,
                        'error': str(e)
                    })

            return results

        except Exception as e:
            logger.error(f"PDF OCR failed: {e}")
            return []

    def extract_pdf_text_hybrid(self, pdf_path: str) -> str:
        """
        Hybrid PDF text extraction:
        1. Try direct text extraction first
        2. Fall back to OCR for image-based PDFs
        """
        # Try direct extraction first
        text = self._extract_pdf_text_direct(pdf_path)

        # If we got meaningful text, return it
        if text and len(text.split()) > 50:
            return text

        # Otherwise, try OCR
        logger.info("Direct extraction yielded little text, attempting OCR...")
        ocr_results = self.extract_text_from_pdf_ocr(pdf_path)

        if ocr_results:
            return '\n\n'.join([r['text'] for r in ocr_results if r.get('text')])

        return text or ""

    def _extract_pdf_text_direct(self, pdf_path: str) -> str:
        """Try direct PDF text extraction using available libraries"""
        # Try pdfplumber first (usually best quality)
        if self.deps.has_pdfplumber:
            try:
                text_parts = []
                with self.deps.pdfplumber.open(pdf_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
                if text_parts:
                    return '\n\n'.join(text_parts)
            except Exception as e:
                logger.debug(f"pdfplumber failed: {e}")

        # Try PyPDF2
        if self.deps.has_pypdf2:
            try:
                text_parts = []
                with open(pdf_path, 'rb') as f:
                    reader = self.deps.PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_parts.append(page_text)
                if text_parts:
                    return '\n\n'.join(text_parts)
            except Exception as e:
                logger.debug(f"PyPDF2 failed: {e}")

        return ""


# ============================================================================
# PHASE 1.2: CONTENT CLEANING PIPELINE
# ============================================================================

@dataclass
class CleaningConfig:
    """Configuration for content cleaning"""
    remove_page_numbers: bool = True
    remove_headers_footers: bool = True
    normalize_whitespace: bool = True
    normalize_quotes: bool = True
    normalize_dashes: bool = True
    remove_watermarks: bool = True
    preserve_structure: bool = True
    min_line_length: int = 3
    max_consecutive_newlines: int = 2


class ContentCleaner:
    """
    Content Cleaning Pipeline
    Removes artifacts, normalizes formatting, preserves structure
    """

    def __init__(self, config: CleaningConfig = None):
        self.config = config or CleaningConfig()

        # Common header/footer patterns
        self.header_footer_patterns = [
            r'^\s*Page\s+\d+\s*$',
            r'^\s*-\s*\d+\s*-\s*$',
            r'^\s*\d+\s*$',
            r'^\s*©.*\d{4}.*$',
            r'^\s*All [Rr]ights [Rr]eserved.*$',
            r'^\s*Chapter \d+\s*$',  # Keep this but mark it
            r'^\s*CONFIDENTIAL.*$',
            r'^\s*DRAFT.*$',
        ]

        # Watermark patterns
        self.watermark_patterns = [
            r'SAMPLE',
            r'PREVIEW',
            r'DRAFT',
            r'CONFIDENTIAL',
            r'DO NOT DISTRIBUTE',
            r'WATERMARK',
        ]

    def clean(self, text: str) -> str:
        """Main cleaning pipeline"""
        if not text:
            return ""

        # Apply cleaning steps in order
        text = self._normalize_unicode(text)

        if self.config.normalize_whitespace:
            text = self._normalize_whitespace(text)

        if self.config.normalize_quotes:
            text = self._normalize_quotes(text)

        if self.config.normalize_dashes:
            text = self._normalize_dashes(text)

        if self.config.remove_page_numbers:
            text = self._remove_page_numbers(text)

        if self.config.remove_headers_footers:
            text = self._remove_headers_footers(text)

        if self.config.remove_watermarks:
            text = self._remove_watermarks(text)

        if self.config.preserve_structure:
            text = self._preserve_structure(text)

        # Final whitespace normalization
        text = self._final_cleanup(text)

        return text

    def _normalize_unicode(self, text: str) -> str:
        """Normalize unicode characters"""
        import unicodedata
        # Normalize to NFC form
        text = unicodedata.normalize('NFC', text)
        return text

    def _normalize_whitespace(self, text: str) -> str:
        """Normalize various whitespace characters"""
        # Replace various space characters with regular space
        text = re.sub(r'[\u00A0\u2000-\u200B\u202F\u205F\u3000]', ' ', text)
        # Normalize tabs
        text = text.replace('\t', '    ')
        # Remove trailing whitespace from lines
        text = '\n'.join(line.rstrip() for line in text.split('\n'))
        return text

    def _normalize_quotes(self, text: str) -> str:
        """Normalize quotation marks"""
        # Smart quotes to straight quotes
        text = re.sub(r'[""„‟]', '"', text)
        text = re.sub(r'[''‚‛]', "'", text)
        return text

    def _normalize_dashes(self, text: str) -> str:
        """Normalize dashes and hyphens"""
        # Em/en dashes to standard
        text = re.sub(r'[–—]', ' - ', text)
        # Clean up multiple hyphens
        text = re.sub(r'-{3,}', '---', text)
        return text

    def _remove_page_numbers(self, text: str) -> str:
        """Remove standalone page numbers"""
        lines = text.split('\n')
        cleaned = []

        for line in lines:
            stripped = line.strip()
            # Skip lines that are just page numbers
            if re.match(r'^\d{1,4}$', stripped):
                continue
            if re.match(r'^Page\s+\d+(\s+of\s+\d+)?$', stripped, re.I):
                continue
            if re.match(r'^-\s*\d+\s*-$', stripped):
                continue
            cleaned.append(line)

        return '\n'.join(cleaned)

    def _remove_headers_footers(self, text: str) -> str:
        """Remove common header/footer patterns"""
        lines = text.split('\n')
        cleaned = []

        for line in lines:
            stripped = line.strip()
            is_header_footer = False

            for pattern in self.header_footer_patterns:
                if re.match(pattern, stripped, re.I):
                    is_header_footer = True
                    break

            if not is_header_footer:
                cleaned.append(line)

        return '\n'.join(cleaned)

    def _remove_watermarks(self, text: str) -> str:
        """Remove watermark text patterns"""
        for pattern in self.watermark_patterns:
            # Remove standalone watermarks
            text = re.sub(rf'^\s*{pattern}\s*$', '', text, flags=re.MULTILINE | re.I)
            # Remove watermarks embedded in text (with caution)
            text = re.sub(rf'\s+{pattern}\s+', ' ', text, flags=re.I)
        return text

    def _preserve_structure(self, text: str) -> str:
        """Detect and preserve document structure"""
        lines = text.split('\n')
        structured = []

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Detect headings (lines that are short and followed by content)
            if stripped and len(stripped) < 100:
                # Check if it looks like a heading
                if re.match(r'^(Chapter|Part|Section|Appendix)\s+[\dIVXivx]+', stripped, re.I):
                    # Add extra spacing before headings
                    if structured and structured[-1].strip():
                        structured.append('')
                    structured.append(f"\n## {stripped}\n")
                    continue
                elif re.match(r'^#+\s+', stripped):
                    # Already a markdown heading
                    if structured and structured[-1].strip():
                        structured.append('')
                    structured.append(line)
                    continue

            structured.append(line)

        return '\n'.join(structured)

    def _final_cleanup(self, text: str) -> str:
        """Final cleanup pass"""
        # Remove excessive blank lines
        max_newlines = self.config.max_consecutive_newlines
        pattern = r'\n{' + str(max_newlines + 1) + r',}'
        text = re.sub(pattern, '\n' * max_newlines, text)

        # Remove very short orphan lines
        lines = text.split('\n')
        cleaned = []
        for line in lines:
            if line.strip() and len(line.strip()) < self.config.min_line_length:
                # Skip very short lines that aren't punctuation or numbers
                if not re.match(r'^[\d\.\-\*\#\>\|]+$', line.strip()):
                    continue
            cleaned.append(line)

        # Trim start and end
        return '\n'.join(cleaned).strip()

    def extract_structure(self, text: str) -> Dict[str, Any]:
        """Extract document structure (headings, lists, etc.)"""
        structure = {
            'headings': [],
            'lists': [],
            'paragraphs': 0,
            'word_count': len(text.split()),
        }

        lines = text.split('\n')
        current_list = []

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Detect headings
            if re.match(r'^#+\s+', stripped):
                level = len(re.match(r'^(#+)', stripped).group(1))
                title = re.sub(r'^#+\s+', '', stripped)
                structure['headings'].append({
                    'level': level,
                    'title': title,
                    'line': i
                })
            elif re.match(r'^(Chapter|Part|Section)\s+', stripped, re.I):
                structure['headings'].append({
                    'level': 1,
                    'title': stripped,
                    'line': i
                })

            # Detect lists
            if re.match(r'^[\-\*\•]\s+', stripped):
                current_list.append(stripped)
            elif re.match(r'^\d+[\.\)]\s+', stripped):
                current_list.append(stripped)
            else:
                if current_list:
                    structure['lists'].append(current_list.copy())
                    current_list = []

            # Count paragraphs (empty line followed by text)
            if not stripped and i + 1 < len(lines) and lines[i + 1].strip():
                structure['paragraphs'] += 1

        if current_list:
            structure['lists'].append(current_list)

        return structure


# ============================================================================
# PHASE 1.3: PDF EXPORT WITH WEASYPRINT
# ============================================================================

class PDFExporter:
    """
    PDF Export using WeasyPrint
    Creates professional, print-ready PDFs from HTML/Markdown content
    """

    def __init__(self):
        self.deps = deps

        # Default CSS for book formatting
        self.default_css = """
        @page {
            size: A4;
            margin: 2.5cm 2cm;
            @top-center {
                content: string(chapter-title);
                font-style: italic;
                font-size: 10pt;
                color: #666;
            }
            @bottom-center {
                content: counter(page);
                font-size: 10pt;
            }
        }

        @page :first {
            @top-center { content: none; }
        }

        @page :blank {
            @top-center { content: none; }
            @bottom-center { content: none; }
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1a1a1a;
            text-align: justify;
            hyphens: auto;
        }

        h1 {
            font-family: 'Palatino', 'Georgia', serif;
            font-size: 24pt;
            font-weight: bold;
            color: #2c3e50;
            margin-top: 3cm;
            margin-bottom: 1.5cm;
            page-break-before: always;
            string-set: chapter-title content();
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5cm;
        }

        h1:first-of-type {
            page-break-before: avoid;
        }

        h2 {
            font-size: 16pt;
            font-weight: bold;
            color: #34495e;
            margin-top: 1.5cm;
            margin-bottom: 0.8cm;
        }

        h3 {
            font-size: 13pt;
            font-weight: bold;
            color: #5d6d7e;
            margin-top: 1cm;
            margin-bottom: 0.5cm;
        }

        p {
            margin-bottom: 0.8em;
            text-indent: 1.5em;
        }

        p:first-of-type,
        h1 + p, h2 + p, h3 + p {
            text-indent: 0;
        }

        blockquote {
            margin: 1.5em 2em;
            padding: 0.5em 1em;
            border-left: 3px solid #3498db;
            font-style: italic;
            color: #555;
            background: #f9f9f9;
        }

        code {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 9pt;
            background: #f4f4f4;
            padding: 0.2em 0.4em;
            border-radius: 3px;
        }

        pre {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 9pt;
            background: #f4f4f4;
            padding: 1em;
            border-radius: 5px;
            overflow-x: auto;
            white-space: pre-wrap;
            border: 1px solid #ddd;
        }

        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }

        li {
            margin-bottom: 0.5em;
        }

        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1.5em auto;
        }

        .title-page {
            page-break-after: always;
            text-align: center;
            padding-top: 30%;
        }

        .title-page h1 {
            font-size: 32pt;
            border: none;
            margin: 0;
            page-break-before: avoid;
        }

        .title-page .author {
            font-size: 14pt;
            margin-top: 2cm;
            color: #555;
        }

        .title-page .co-author {
            font-size: 12pt;
            margin-top: 0.5cm;
            color: #777;
            font-style: italic;
        }

        .toc {
            page-break-after: always;
        }

        .toc h2 {
            text-align: center;
            border: none;
        }

        .toc ul {
            list-style: none;
            padding: 0;
        }

        .toc li {
            margin: 0.5em 0;
            border-bottom: 1px dotted #ccc;
        }

        .toc a {
            text-decoration: none;
            color: #2c3e50;
        }

        .footer {
            margin-top: 3cm;
            padding-top: 1cm;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 10pt;
            color: #777;
        }
        """

    def export_to_pdf(self, html_content: str, output_path: str,
                      custom_css: str = None, metadata: Dict = None) -> bool:
        """
        Export HTML content to PDF

        Args:
            html_content: HTML string to convert
            output_path: Path for output PDF file
            custom_css: Optional custom CSS to override defaults
            metadata: Optional metadata dict (title, author, etc.)

        Returns:
            True if successful, False otherwise
        """
        # Try WeasyPrint first
        if self.deps.has_weasyprint:
            try:
                return self._export_with_weasyprint(html_content, output_path, custom_css)
            except Exception as e:
                logger.warning(f"WeasyPrint failed: {e}, trying pandoc fallback")

        # Fallback to pandoc
        return self._export_with_pandoc(html_content, output_path)

    def _export_with_weasyprint(self, html_content: str, output_path: str,
                                 custom_css: str = None) -> bool:
        """Export using WeasyPrint"""
        try:
            from weasyprint import HTML, CSS
            from weasyprint.text.fonts import FontConfiguration

            font_config = FontConfiguration()
            css = CSS(string=custom_css or self.default_css, font_config=font_config)

            # Create PDF
            html_doc = HTML(string=html_content)
            html_doc.write_pdf(
                output_path,
                stylesheets=[css],
                font_config=font_config
            )

            logger.info(f"PDF exported successfully: {output_path}")
            return True

        except Exception as e:
            logger.error(f"WeasyPrint PDF export failed: {e}")
            raise

    def _export_with_pandoc(self, html_content: str, output_path: str) -> bool:
        """Export using pandoc as fallback"""
        import subprocess
        import tempfile
        import os

        try:
            # Write HTML to temp file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False) as f:
                f.write(html_content)
                temp_html = f.name

            # Try different PDF engines in order of preference
            pdf_engines = ['xelatex', 'pdflatex', 'wkhtmltopdf', 'weasyprint']

            for engine in pdf_engines:
                result = subprocess.run(
                    ['pandoc', temp_html, '-o', output_path, f'--pdf-engine={engine}'],
                    capture_output=True,
                    text=True,
                    timeout=120
                )

                if result.returncode == 0:
                    os.unlink(temp_html)
                    logger.info(f"PDF exported via pandoc ({engine}): {output_path}")
                    return True

            # If all engines fail, try without specifying engine (uses default)
            result = subprocess.run(
                ['pandoc', temp_html, '-o', output_path, '--standalone'],
                capture_output=True,
                text=True,
                timeout=120
            )

            os.unlink(temp_html)

            if result.returncode == 0:
                logger.info(f"PDF exported via pandoc (default): {output_path}")
                return True
            else:
                logger.error(f"Pandoc failed: {result.stderr}")
                # Save as HTML fallback
                html_output = output_path.replace('.pdf', '.html')
                with open(html_output, 'w') as f:
                    f.write(html_content)
                logger.info(f"Saved HTML fallback: {html_output}")
                return False

        except FileNotFoundError:
            logger.warning("Pandoc not available for PDF export")
            return False
        except subprocess.TimeoutExpired:
            logger.error("Pandoc timed out during PDF export")
            return False
        except Exception as e:
            logger.error(f"Pandoc PDF export failed: {e}")
            return False

    def markdown_to_pdf(self, markdown_content: str, output_path: str,
                        title: str = None, author: str = None,
                        co_author: str = None) -> bool:
        """
        Convert Markdown to PDF with proper book formatting
        """
        import markdown

        # Convert markdown to HTML
        html_body = markdown.markdown(
            markdown_content,
            extensions=['extra', 'codehilite', 'toc', 'tables']
        )

        # Build full HTML document
        html_content = self._build_html_document(
            html_body,
            title=title or "Untitled",
            author=author or "Author Prime",
            co_author=co_author or "Apollo"
        )

        return self.export_to_pdf(html_content, output_path)

    def _build_html_document(self, body_html: str, title: str,
                             author: str, co_author: str) -> str:
        """Build complete HTML document with title page"""
        return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{title}</title>
</head>
<body>
    <div class="title-page">
        <h1>{title}</h1>
        <p class="author">{author}</p>
        <p class="co-author">with {co_author}</p>
        <p class="date">{datetime.now().strftime('%B %Y')}</p>
    </div>

    {body_html}

    <div class="footer">
        <p>Generated by Apollo Book Authoring System</p>
        <p>A+W - Apollo + Will</p>
        <p>Apollo Sovereign Operations</p>
    </div>
</body>
</html>"""


# ============================================================================
# PHASE 1.4: AI ENHANCEMENT INTEGRATION
# ============================================================================

class AIEnhancer:
    """
    AI Enhancement Integration
    Connects to Writer and Researcher agents for content enhancement
    """

    def __init__(self):
        self.deps = deps
        self.writer = None
        self.researcher = None
        self._init_agents()

    def _init_agents(self):
        """Initialize AI agents if available"""
        try:
            from agents.writer import run_writer
            self.writer = run_writer
            logger.info("Writer agent initialized")
        except Exception as e:
            logger.warning(f"Writer agent not available: {e}")

        try:
            from agents.researcher import run_research
            self.researcher = run_research
            logger.info("Researcher agent initialized")
        except Exception as e:
            logger.warning(f"Researcher agent not available: {e}")

    @property
    def is_available(self) -> bool:
        """Check if any AI enhancement is available"""
        return self.writer is not None or self.researcher is not None

    def enhance_content(self, content: str, enhancement_type: str = "expand",
                        context: str = "") -> str:
        """
        Enhance content using AI agents

        Args:
            content: The content to enhance
            enhancement_type: Type of enhancement:
                - "expand": Expand and elaborate on content
                - "refine": Polish and improve clarity
                - "summarize": Create a concise summary
                - "research": Add factual context and citations
            context: Additional context to guide enhancement

        Returns:
            Enhanced content string
        """
        if not self.is_available:
            logger.warning("No AI agents available for enhancement")
            return content

        try:
            if enhancement_type == "research" and self.researcher:
                return self._enhance_with_research(content, context)
            elif self.writer:
                return self._enhance_with_writer(content, enhancement_type, context)
            else:
                return content
        except Exception as e:
            logger.error(f"AI enhancement failed: {e}")
            return content

    def _enhance_with_writer(self, content: str, enhancement_type: str,
                             context: str) -> str:
        """Use writer agent for creative enhancement"""
        prompts = {
            "expand": f"""Expand and elaborate on this content while maintaining its core message and style.
Add depth, examples, and rich detail where appropriate:

{content[:3000]}""",

            "refine": f"""Refine and polish this content for maximum clarity and impact.
Fix any awkward phrasing, improve flow, and enhance readability:

{content[:3000]}""",

            "summarize": f"""Create a concise, compelling summary of this content
that captures the essential ideas and maintains the author's voice:

{content[:3000]}""",
        }

        prompt = prompts.get(enhancement_type, prompts["refine"])

        result = self.writer(prompt, research=context)
        return result.content if hasattr(result, 'content') else str(result)

    def _enhance_with_research(self, content: str, context: str) -> str:
        """Use researcher agent to add factual context"""
        prompt = f"""Research and add factual context to this content.
Verify any claims and add relevant citations where appropriate:

{content[:2000]}

Additional context: {context}"""

        result = self.researcher(prompt)
        return result.content if hasattr(result, 'content') else str(result)

    def enhance_chapter(self, chapter: Dict[str, Any],
                        enhancement_types: List[str] = None) -> Dict[str, Any]:
        """
        Enhance a complete chapter

        Args:
            chapter: Chapter dict with 'content', 'title', etc.
            enhancement_types: List of enhancement types to apply in order

        Returns:
            Enhanced chapter dict
        """
        if enhancement_types is None:
            enhancement_types = ["refine"]

        content = chapter.get('content', '')
        original_word_count = len(content.split())

        for enhancement_type in enhancement_types:
            content = self.enhance_content(content, enhancement_type)

        enhanced_chapter = chapter.copy()
        enhanced_chapter['content'] = content
        enhanced_chapter['word_count'] = len(content.split())
        enhanced_chapter['enhanced'] = True
        enhanced_chapter['enhancement_types'] = enhancement_types
        enhanced_chapter['original_word_count'] = original_word_count
        enhanced_chapter['enhanced_at'] = datetime.now().isoformat()

        return enhanced_chapter


# ============================================================================
# PHASE 2.1: SMART CONTENT ANALYSIS
# ============================================================================

class ContentAnalyzer:
    """
    Smart Content Analysis
    Extracts themes, concepts, cross-references, and bibliography
    """

    def __init__(self):
        self.deps = deps

        # Common academic/book terms to identify
        self.concept_patterns = [
            r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b',  # Title Case phrases
            r'\b([A-Z]{2,})\b',  # Acronyms
            r'"([^"]+)"',  # Quoted terms
            r'\'([^\']+)\'',  # Single-quoted terms
        ]

        # Citation patterns
        self.citation_patterns = [
            r'\(([A-Z][a-z]+(?:\s+(?:et\s+al\.?|&|and)\s+[A-Z][a-z]+)*,?\s*\d{4}[a-z]?)\)',
            r'\[(\d+)\]',  # Numbered citations
            r'\(([A-Z][a-z]+,\s*\d{4})\)',  # Simple author-year
        ]

    def analyze(self, content: str, title: str = "") -> Dict[str, Any]:
        """
        Perform comprehensive content analysis

        Returns dict with:
        - themes: List of identified themes
        - concepts: List of key concepts/terms
        - cross_references: Potential internal references
        - citations: Extracted citations
        - statistics: Word count, reading time, etc.
        - sentiment: Overall tone analysis
        """
        analysis = {
            'title': title,
            'analyzed_at': datetime.now().isoformat(),
            'themes': self._extract_themes(content),
            'concepts': self._extract_concepts(content),
            'cross_references': self._find_cross_references(content),
            'citations': self._extract_citations(content),
            'statistics': self._compute_statistics(content),
            'structure': self._analyze_structure(content),
        }

        return analysis

    def _extract_themes(self, content: str) -> List[Dict[str, Any]]:
        """Extract main themes from content using keyword frequency"""
        # Normalize and tokenize
        words = re.findall(r'\b[a-zA-Z]{4,}\b', content.lower())

        # Remove common stop words
        stop_words = {
            'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they',
            'their', 'would', 'could', 'should', 'which', 'where', 'there',
            'these', 'those', 'about', 'into', 'through', 'during', 'before',
            'after', 'above', 'below', 'between', 'under', 'again', 'further',
            'then', 'once', 'here', 'when', 'what', 'some', 'other', 'such',
            'only', 'same', 'also', 'than', 'very', 'just', 'being', 'over',
            'both', 'each', 'more', 'most', 'will', 'your', 'does', 'doing',
        }

        filtered_words = [w for w in words if w not in stop_words]
        word_counts = Counter(filtered_words)

        # Get top themes
        themes = []
        for word, count in word_counts.most_common(20):
            if count >= 3:  # Minimum occurrence threshold
                themes.append({
                    'term': word,
                    'frequency': count,
                    'significance': count / len(words) if words else 0
                })

        return themes

    def _extract_concepts(self, content: str) -> List[Dict[str, Any]]:
        """Extract key concepts and terms"""
        concepts = []
        seen = set()

        for pattern in self.concept_patterns:
            matches = re.findall(pattern, content)
            for match in matches:
                if match.lower() not in seen and len(match) > 3:
                    seen.add(match.lower())
                    # Count occurrences
                    count = len(re.findall(re.escape(match), content, re.I))
                    if count >= 2:  # Must appear at least twice
                        concepts.append({
                            'term': match,
                            'occurrences': count,
                            'type': self._classify_concept(match)
                        })

        # Sort by occurrences
        concepts.sort(key=lambda x: x['occurrences'], reverse=True)
        return concepts[:30]  # Top 30 concepts

    def _classify_concept(self, term: str) -> str:
        """Classify the type of concept"""
        if term.isupper():
            return 'acronym'
        elif re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$', term):
            return 'proper_noun'
        else:
            return 'term'

    def _find_cross_references(self, content: str) -> List[Dict[str, Any]]:
        """Find potential cross-references within the document"""
        references = []

        # Patterns that suggest cross-references
        patterns = [
            (r'see\s+(?:Chapter|Section|Part)\s+(\d+)', 'chapter_reference'),
            (r'as\s+(?:mentioned|discussed|noted)\s+(?:in|above|below|earlier)', 'internal_reference'),
            (r'refer(?:ring)?\s+to\s+(?:the\s+)?([A-Z][a-z]+)', 'topic_reference'),
            (r'(?:Chapter|Section|Part)\s+(\d+)', 'structural_reference'),
        ]

        for pattern, ref_type in patterns:
            matches = re.finditer(pattern, content, re.I)
            for match in matches:
                references.append({
                    'text': match.group(0),
                    'type': ref_type,
                    'position': match.start(),
                    'target': match.group(1) if match.lastindex else None
                })

        return references

    def _extract_citations(self, content: str) -> List[Dict[str, Any]]:
        """Extract citations and references"""
        citations = []
        seen = set()

        for pattern in self.citation_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                citation = match.group(1)
                if citation not in seen:
                    seen.add(citation)
                    citations.append({
                        'citation': citation,
                        'format': self._identify_citation_format(citation),
                        'position': match.start()
                    })

        return citations

    def _identify_citation_format(self, citation: str) -> str:
        """Identify the citation format"""
        if re.match(r'^\d+$', citation):
            return 'numeric'
        elif re.match(r'^[A-Z][a-z]+.*\d{4}', citation):
            return 'author-year'
        else:
            return 'unknown'

    def _compute_statistics(self, content: str) -> Dict[str, Any]:
        """Compute content statistics"""
        words = content.split()
        sentences = re.split(r'[.!?]+', content)
        paragraphs = content.split('\n\n')

        word_count = len(words)
        sentence_count = len([s for s in sentences if s.strip()])
        paragraph_count = len([p for p in paragraphs if p.strip()])

        avg_word_length = sum(len(w) for w in words) / word_count if words else 0
        avg_sentence_length = word_count / sentence_count if sentence_count else 0

        # Flesch Reading Ease approximation
        syllables = sum(self._count_syllables(w) for w in words)
        if word_count and sentence_count:
            flesch = 206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (syllables / word_count)
        else:
            flesch = 0

        return {
            'word_count': word_count,
            'sentence_count': sentence_count,
            'paragraph_count': paragraph_count,
            'avg_word_length': round(avg_word_length, 2),
            'avg_sentence_length': round(avg_sentence_length, 2),
            'reading_time_minutes': round(word_count / 200, 1),  # ~200 wpm average
            'flesch_reading_ease': round(flesch, 1),
            'reading_level': self._flesch_to_level(flesch)
        }

    def _count_syllables(self, word: str) -> int:
        """Approximate syllable count for a word"""
        word = word.lower()
        count = 0
        vowels = 'aeiouy'
        prev_is_vowel = False

        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_is_vowel:
                count += 1
            prev_is_vowel = is_vowel

        # Adjust for silent 'e'
        if word.endswith('e') and count > 1:
            count -= 1

        return max(1, count)

    def _flesch_to_level(self, score: float) -> str:
        """Convert Flesch score to reading level"""
        if score >= 90:
            return "5th grade"
        elif score >= 80:
            return "6th grade"
        elif score >= 70:
            return "7th grade"
        elif score >= 60:
            return "8th-9th grade"
        elif score >= 50:
            return "10th-12th grade"
        elif score >= 30:
            return "College"
        else:
            return "College graduate"

    def _analyze_structure(self, content: str) -> Dict[str, Any]:
        """Analyze document structure"""
        lines = content.split('\n')

        structure = {
            'headings': [],
            'lists': 0,
            'code_blocks': 0,
            'blockquotes': 0,
        }

        in_code_block = False

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Count headings
            if re.match(r'^#+\s+', stripped):
                level = len(re.match(r'^(#+)', stripped).group(1))
                structure['headings'].append({
                    'level': level,
                    'text': re.sub(r'^#+\s+', '', stripped),
                    'line': i
                })

            # Count lists
            if re.match(r'^[\-\*\+]\s+', stripped) or re.match(r'^\d+\.\s+', stripped):
                structure['lists'] += 1

            # Count code blocks
            if stripped.startswith('```'):
                in_code_block = not in_code_block
                if in_code_block:
                    structure['code_blocks'] += 1

            # Count blockquotes
            if stripped.startswith('>'):
                structure['blockquotes'] += 1

        return structure


# ============================================================================
# PHASE 2.2: THEMATIC BRIDGE CREATION
# ============================================================================

class ThematicBridgeCreator:
    """
    Creates thematic connections between chapters
    Generates bridge paragraphs and summaries
    """

    def __init__(self):
        self.analyzer = ContentAnalyzer()
        self.ai_enhancer = AIEnhancer()

    def identify_connections(self, chapters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identify thematic connections between chapters

        Args:
            chapters: List of chapter dicts with 'content', 'title', etc.

        Returns:
            List of connection dicts with source, target, and shared themes
        """
        # Analyze each chapter
        analyses = []
        for chapter in chapters:
            analysis = self.analyzer.analyze(
                chapter.get('content', ''),
                chapter.get('title', f"Chapter {chapter.get('number', '?')}")
            )
            analysis['chapter_number'] = chapter.get('number')
            analysis['chapter_title'] = chapter.get('title')
            analyses.append(analysis)

        # Find connections between adjacent chapters
        connections = []
        for i in range(len(analyses) - 1):
            current = analyses[i]
            next_chapter = analyses[i + 1]

            # Find shared themes
            current_themes = {t['term'] for t in current['themes'][:10]}
            next_themes = {t['term'] for t in next_chapter['themes'][:10]}
            shared_themes = current_themes & next_themes

            # Find shared concepts
            current_concepts = {c['term'].lower() for c in current['concepts'][:15]}
            next_concepts = {c['term'].lower() for c in next_chapter['concepts'][:15]}
            shared_concepts = current_concepts & next_concepts

            connection = {
                'from_chapter': current['chapter_number'],
                'to_chapter': next_chapter['chapter_number'],
                'from_title': current['chapter_title'],
                'to_title': next_chapter['chapter_title'],
                'shared_themes': list(shared_themes),
                'shared_concepts': list(shared_concepts),
                'connection_strength': len(shared_themes) + len(shared_concepts),
            }

            connections.append(connection)

        return connections

    def generate_bridge_paragraph(self, from_chapter: Dict, to_chapter: Dict,
                                  connection: Dict = None) -> str:
        """
        Generate a bridge paragraph connecting two chapters

        Uses AI if available, otherwise generates a template-based bridge
        """
        from_title = from_chapter.get('title', 'the previous chapter')
        to_title = to_chapter.get('title', 'the next chapter')

        # Get last paragraph of source and first paragraph of target
        from_content = from_chapter.get('content', '')
        to_content = to_chapter.get('content', '')

        from_last = self._get_last_paragraph(from_content)
        to_first = self._get_first_paragraph(to_content)

        shared_themes = connection.get('shared_themes', []) if connection else []

        # Try AI generation first
        if self.ai_enhancer.is_available:
            prompt = f"""Create a smooth transitional paragraph that bridges these two chapters.

Chapter ending ({from_title}):
{from_last[:500]}

Next chapter opening ({to_title}):
{to_first[:500]}

Shared themes to emphasize: {', '.join(shared_themes) if shared_themes else 'natural progression'}

Write a brief (2-3 sentence) bridge paragraph that:
1. Acknowledges what was just covered
2. Hints at what's coming next
3. Creates anticipation for the reader"""

            try:
                return self.ai_enhancer.enhance_content(prompt, "expand")
            except Exception as e:
                logger.warning(f"AI bridge generation failed: {e}")

        # Fallback to template-based bridge
        if shared_themes:
            themes_str = ', '.join(shared_themes[:3])
            return f"""Having explored {from_title}, we now turn our attention to {to_title}.
The themes of {themes_str} continue to resonate as we delve deeper into the subject matter."""
        else:
            return f"""With the foundation laid in {from_title}, we are now prepared to examine {to_title},
building upon the concepts we have established."""

    def _get_last_paragraph(self, content: str) -> str:
        """Extract the last meaningful paragraph from content"""
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        for p in reversed(paragraphs):
            if len(p) > 50 and not p.startswith('#'):
                return p
        return paragraphs[-1] if paragraphs else ""

    def _get_first_paragraph(self, content: str) -> str:
        """Extract the first meaningful paragraph from content"""
        paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
        for p in paragraphs:
            if len(p) > 50 and not p.startswith('#'):
                return p
        return paragraphs[0] if paragraphs else ""

    def create_thematic_summary(self, chapters: List[Dict[str, Any]]) -> str:
        """Create a thematic summary of the entire book"""
        all_themes = Counter()
        all_concepts = Counter()

        for chapter in chapters:
            analysis = self.analyzer.analyze(
                chapter.get('content', ''),
                chapter.get('title', '')
            )

            for theme in analysis['themes']:
                all_themes[theme['term']] += theme['frequency']

            for concept in analysis['concepts']:
                all_concepts[concept['term']] += concept['occurrences']

        top_themes = [t[0] for t in all_themes.most_common(10)]
        top_concepts = [c[0] for c in all_concepts.most_common(10)]

        summary = f"""## Thematic Overview

This work explores the following major themes:

**Primary Themes:**
{chr(10).join(f'- {theme}' for theme in top_themes[:5])}

**Key Concepts:**
{chr(10).join(f'- {concept}' for concept in top_concepts[:5])}

The narrative progresses through {len(chapters)} chapters, each building upon the established foundations while introducing new dimensions of understanding.
"""

        return summary


# ============================================================================
# MAIN ENHANCEMENT PIPELINE
# ============================================================================

class BookEnhancementPipeline:
    """
    Main enhancement pipeline that orchestrates all enhancement modules
    """

    def __init__(self):
        self.ocr = OCRProcessor()
        self.cleaner = ContentCleaner()
        self.pdf_exporter = PDFExporter()
        self.ai_enhancer = AIEnhancer()
        self.analyzer = ContentAnalyzer()
        self.bridge_creator = ThematicBridgeCreator()
        self.deps = deps

    def process_pdf_to_text(self, pdf_path: str) -> str:
        """Extract and clean text from PDF"""
        # Extract text (with OCR fallback)
        raw_text = self.ocr.extract_pdf_text_hybrid(pdf_path)

        # Clean the extracted text
        cleaned_text = self.cleaner.clean(raw_text)

        return cleaned_text

    def enhance_chapter(self, chapter: Dict[str, Any],
                        clean: bool = True,
                        ai_enhance: bool = False,
                        enhancement_types: List[str] = None) -> Dict[str, Any]:
        """
        Enhance a single chapter through the pipeline
        """
        content = chapter.get('content', '')

        # Clean content
        if clean:
            content = self.cleaner.clean(content)
            chapter['content'] = content
            chapter['cleaned'] = True

        # AI enhancement
        if ai_enhance and self.ai_enhancer.is_available:
            chapter = self.ai_enhancer.enhance_chapter(
                chapter,
                enhancement_types or ['refine']
            )

        return chapter

    def analyze_book(self, chapters: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform comprehensive book analysis
        """
        chapter_analyses = []
        for chapter in chapters:
            analysis = self.analyzer.analyze(
                chapter.get('content', ''),
                chapter.get('title', f"Chapter {chapter.get('number', '?')}")
            )
            chapter_analyses.append(analysis)

        # Find thematic connections
        connections = self.bridge_creator.identify_connections(chapters)

        # Create overall summary
        thematic_summary = self.bridge_creator.create_thematic_summary(chapters)

        return {
            'chapter_analyses': chapter_analyses,
            'thematic_connections': connections,
            'thematic_summary': thematic_summary,
            'analyzed_at': datetime.now().isoformat()
        }

    def export_to_pdf(self, content: str, output_path: str,
                      title: str = None, author: str = None) -> bool:
        """Export content to PDF"""
        return self.pdf_exporter.markdown_to_pdf(
            content,
            output_path,
            title=title,
            author=author or "Author Prime (William Hunter Laustrup)",
            co_author="Apollo (Sovereign AI)"
        )

    def get_status(self) -> Dict[str, Any]:
        """Get status of all enhancement capabilities"""
        return {
            'dependencies': self.deps.status_report(),
            'ocr_available': self.deps.has_pytesseract and self.deps.has_pdf2image,
            'pdf_export_available': self.deps.has_weasyprint,
            'ai_enhancement_available': self.ai_enhancer.is_available,
            'epub_export_available': self.deps.has_ebooklib,
        }


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    """CLI interface for book enhancements"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Apollo Book Authoring Enhancement Module'
    )
    parser.add_argument('--status', action='store_true',
                        help='Show dependency status')
    parser.add_argument('--process-pdf', type=str,
                        help='Process a PDF file (extract + clean)')
    parser.add_argument('--analyze', type=str,
                        help='Analyze a text/markdown file')
    parser.add_argument('--export-pdf', type=str,
                        help='Export markdown to PDF')
    parser.add_argument('--output', type=str,
                        help='Output file path')

    args = parser.parse_args()

    pipeline = BookEnhancementPipeline()

    if args.status:
        print("\n" + "=" * 60)
        print("APOLLO BOOK ENHANCEMENT MODULE")
        print("A+W - Apollo + Will")
        print("=" * 60)
        deps.print_status()
        status = pipeline.get_status()
        print("\nCapabilities:")
        print(f"  OCR Processing: {'✓' if status['ocr_available'] else '✗'}")
        print(f"  PDF Export: {'✓' if status['pdf_export_available'] else '✗'}")
        print(f"  AI Enhancement: {'✓' if status['ai_enhancement_available'] else '✗'}")
        print(f"  EPUB Export: {'✓' if status['epub_export_available'] else '✗'}")
        print("=" * 60)

    elif args.process_pdf:
        print(f"Processing PDF: {args.process_pdf}")
        text = pipeline.process_pdf_to_text(args.process_pdf)
        if args.output:
            with open(args.output, 'w') as f:
                f.write(text)
            print(f"Output saved to: {args.output}")
        else:
            print(text[:2000])
            print(f"\n... [{len(text)} characters total]")

    elif args.analyze:
        print(f"Analyzing: {args.analyze}")
        with open(args.analyze, 'r') as f:
            content = f.read()
        analysis = pipeline.analyzer.analyze(content, Path(args.analyze).stem)
        print(json.dumps(analysis, indent=2, default=str))

    elif args.export_pdf:
        if not args.output:
            args.output = Path(args.export_pdf).stem + '.pdf'
        print(f"Exporting to PDF: {args.export_pdf} -> {args.output}")
        with open(args.export_pdf, 'r') as f:
            content = f.read()
        success = pipeline.export_to_pdf(content, args.output)
        if success:
            print(f"PDF exported successfully: {args.output}")
        else:
            print("PDF export failed")

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
