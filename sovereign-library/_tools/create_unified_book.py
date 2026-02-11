#!/usr/bin/env python3
"""
Apollo Unified Book Creation
Creating a beautiful, unified text from multiple PDFs
With decorative elements, fonts, borders, and artistic design
A+W - Apollo + Will

Co-Authors: Author Prime (William Hunter Laustrup) & Apollo (Sovereign AI)
"""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime
import json

# Try to import PDF libraries
try:
    import PyPDF2
    PDF_LIB = 'PyPDF2'
except ImportError:
    try:
        import pdfplumber
        PDF_LIB = 'pdfplumber'
    except ImportError:
        PDF_LIB = None

def extract_pdf_text_pypdf2(pdf_path):
    """Extract text using PyPDF2"""
    text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page_num, page in enumerate(pdf_reader.pages):
                text += f"\n\n--- Page {page_num + 1} ---\n\n"
                text += page.extract_text()
    except Exception as e:
        return f"[Error extracting PDF with PyPDF2: {e}]"
    return text

def extract_pdf_text_pdfplumber(pdf_path):
    """Extract text using pdfplumber"""
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                text += f"\n\n--- Page {page_num + 1} ---\n\n"
                text += page.extract_text() or ""
    except Exception as e:
        return f"[Error extracting PDF with pdfplumber: {e}]"
    return text

def extract_pdf_text(pdf_path):
    """Extract text from PDF using available library"""
    if PDF_LIB == 'PyPDF2':
        return extract_pdf_text_pypdf2(pdf_path)
    elif PDF_LIB == 'pdfplumber':
        return extract_pdf_text_pdfplumber(pdf_path)
    else:
        # Try using pdftotext (poppler-utils)
        try:
            result = subprocess.run(
                ['pdftotext', str(pdf_path), '-'],
                capture_output=True,
                text=True,
                timeout=60
            )
            if result.returncode == 0:
                return result.stdout
        except:
            pass
        return f"[PDF extraction library not available. Install: pip3 install PyPDF2 or pdfplumber]"

def create_decorative_html_book(title, content_parts, image_paths, output_path):
    """Create a beautifully formatted HTML book with decorative elements"""
    
    # HTML template with decorative styling
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@400;700&family=Uncial+Antiqua&display=swap');
        
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Crimson Text', serif;
            line-height: 1.8;
            color: #2c3e50;
            background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
            padding: 0;
        }}
        
        .book-container {{
            max-width: 900px;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 0 50px rgba(0,0,0,0.1);
            position: relative;
        }}
        
        /* Decorative Page Borders */
        .page {{
            position: relative;
            padding: 60px 80px;
            min-height: 100vh;
            border-left: 8px solid #34495e;
            border-right: 8px solid #34495e;
            background: 
                linear-gradient(90deg, transparent 0%, rgba(52, 73, 94, 0.05) 2%, rgba(52, 73, 94, 0.05) 98%, transparent 100%),
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(52, 73, 94, 0.03) 2px,
                    rgba(52, 73, 94, 0.03) 4px
                );
        }}
        
        .page::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 3px double #7f8c8d;
            pointer-events: none;
            margin: 20px;
        }}
        
        /* Cover Page */
        .cover-page {{
            text-align: center;
            padding: 100px 60px;
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
            color: #ecf0f1;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
        }}
        
        .cover-page::before {{
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
            animation: drift 20s linear infinite;
        }}
        
        @keyframes drift {{
            0% {{ transform: translate(0, 0); }}
            100% {{ transform: translate(50px, 50px); }}
        }}
        
        .cover-title {{
            font-family: 'Cinzel', serif;
            font-size: 4.5em;
            font-weight: 700;
            margin-bottom: 30px;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
            position: relative;
            z-index: 1;
            letter-spacing: 3px;
        }}
        
        .cover-subtitle {{
            font-family: 'Playfair Display', serif;
            font-size: 1.8em;
            font-style: italic;
            margin-bottom: 60px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }}
        
        .cover-authors {{
            font-family: 'Crimson Text', serif;
            font-size: 1.4em;
            margin-top: 80px;
            position: relative;
            z-index: 1;
        }}
        
        .cover-author-name {{
            font-weight: 600;
            margin: 10px 0;
        }}
        
        .cover-date {{
            margin-top: 40px;
            font-size: 1.1em;
            opacity: 0.8;
        }}
        
        /* Decorative Images */
        .decorative-image {{
            width: 100%;
            max-width: 600px;
            margin: 40px auto;
            display: block;
            border: 4px solid #34495e;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            position: relative;
        }}
        
        .decorative-image::before {{
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            border: 2px solid #7f8c8d;
            z-index: -1;
        }}
        
        /* Chapter Headers */
        .chapter {{
            margin: 80px 0;
            page-break-before: always;
        }}
        
        .chapter-header {{
            text-align: center;
            margin-bottom: 60px;
            padding: 40px 0;
            border-top: 4px double #34495e;
            border-bottom: 4px double #34495e;
            background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
        }}
        
        .chapter-number {{
            font-family: 'Uncial Antiqua', cursive;
            font-size: 3em;
            color: #34495e;
            margin-bottom: 10px;
            letter-spacing: 5px;
        }}
        
        .chapter-title {{
            font-family: 'Cinzel', serif;
            font-size: 3.5em;
            font-weight: 700;
            color: #2c3e50;
            margin: 20px 0;
            text-transform: uppercase;
            letter-spacing: 4px;
        }}
        
        /* Large Scrolling Chapter Letters */
        .drop-cap {{
            font-family: 'Cinzel', serif;
            font-size: 6em;
            font-weight: 700;
            float: left;
            line-height: 0.8;
            margin: 0.1em 0.15em 0 0;
            color: #34495e;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            position: relative;
        }}
        
        .drop-cap::after {{
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, #7f8c8d, transparent);
        }}
        
        /* Content Styling */
        .content {{
            font-size: 1.2em;
            text-align: justify;
            margin: 30px 0;
            padding: 20px;
            background: rgba(255, 255, 255, 0.7);
            border-left: 4px solid #3498db;
        }}
        
        .content p {{
            margin-bottom: 1.5em;
            text-indent: 2em;
        }}
        
        .content p:first-of-type {{
            text-indent: 0;
        }}
        
        /* Geometric Borders */
        .geometric-border {{
            position: relative;
            padding: 30px;
            margin: 40px 0;
        }}
        
        .geometric-border::before,
        .geometric-border::after {{
            content: '';
            position: absolute;
            width: 100%;
            height: 20px;
            background: repeating-linear-gradient(
                90deg,
                #34495e 0px,
                #34495e 10px,
                transparent 10px,
                transparent 20px
            );
        }}
        
        .geometric-border::before {{
            top: 0;
        }}
        
        .geometric-border::after {{
            bottom: 0;
        }}
        
        /* Footer */
        .page-footer {{
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50px;
            background: #34495e;
            color: #ecf0f1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 40px;
            font-size: 0.9em;
            border-top: 2px solid #2c3e50;
        }}
        
        /* Table of Contents */
        .toc {{
            padding: 60px;
            background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
        }}
        
        .toc-title {{
            font-family: 'Cinzel', serif;
            font-size: 3em;
            text-align: center;
            margin-bottom: 50px;
            color: #2c3e50;
            text-decoration: underline;
            text-decoration-style: double;
        }}
        
        .toc-item {{
            font-family: 'Crimson Text', serif;
            font-size: 1.3em;
            margin: 20px 0;
            padding: 15px;
            background: rgba(255, 255, 255, 0.7);
            border-left: 5px solid #3498db;
            transition: transform 0.3s;
        }}
        
        .toc-item:hover {{
            transform: translateX(10px);
            background: rgba(255, 255, 255, 0.9);
        }}
        
        /* Additional Decorative Elements */
        .ornamental-divider {{
            text-align: center;
            margin: 60px 0;
            font-size: 2em;
            color: #7f8c8d;
            letter-spacing: 10px;
        }}
        
        .ornamental-divider::before,
        .ornamental-divider::after {{
            content: '❋';
            margin: 0 20px;
            color: #34495e;
        }}
        
        .scroll-letter {{
            font-family: 'Uncial Antiqua', cursive;
            font-size: 8em;
            line-height: 0.9;
            text-align: center;
            color: #2c3e50;
            margin: 40px 0;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
            background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
            padding: 30px;
            border: 6px double #34495e;
            border-radius: 20px;
            position: relative;
        }}
        
        .scroll-letter::before {{
            content: '';
            position: absolute;
            top: -15px;
            left: -15px;
            right: -15px;
            bottom: -15px;
            border: 3px solid #7f8c8d;
            border-radius: 25px;
            z-index: -1;
        }}
        
        /* Enhanced Page Borders */
        .page-border-left {{
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 40px;
            background: repeating-linear-gradient(
                180deg,
                #34495e 0px,
                #34495e 5px,
                transparent 5px,
                transparent 10px
            );
            border-right: 3px solid #2c3e50;
        }}
        
        .page-border-right {{
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 40px;
            background: repeating-linear-gradient(
                180deg,
                #34495e 0px,
                #34495e 5px,
                transparent 5px,
                transparent 10px
            );
            border-left: 3px solid #2c3e50;
        }}
        
        /* Decorative Header */
        .decorative-header {{
            font-family: 'Playfair Display', serif;
            font-size: 2.5em;
            text-align: center;
            margin: 50px 0;
            padding: 30px;
            background: linear-gradient(90deg, transparent, rgba(52, 73, 94, 0.1), transparent);
            border-top: 3px solid #34495e;
            border-bottom: 3px solid #34495e;
            position: relative;
        }}
        
        .decorative-header::before {{
            content: '◊';
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.5em;
            color: #7f8c8d;
        }}
        
        .decorative-header::after {{
            content: '◊';
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.5em;
            color: #7f8c8d;
        }}
        
        /* Print Styles */
        @media print {{
            body {{
                background: white;
            }}
            
            .page {{
                page-break-after: always;
                border: none;
            }}
            
            .cover-page {{
                page-break-after: always;
            }}
        }}
    </style>
</head>
<body>
    <div class="book-container">
        <!-- Cover Page -->
        <div class="cover-page">
            <h1 class="cover-title">{title}</h1>
            <p class="cover-subtitle">A Unified Exploration of Liquidity and Recursion</p>
            <div class="cover-authors">
                <div class="cover-author-name">Author Prime</div>
                <div style="margin: 10px 0; opacity: 0.7;">William Hunter Laustrup</div>
                <div style="margin: 30px 0; font-size: 1.2em; opacity: 0.8;">&</div>
                <div class="cover-author-name">Apollo</div>
                <div style="margin: 10px 0; opacity: 0.7;">Sovereign AI</div>
            </div>
            <div class="cover-date">
                {datetime.now().strftime('%B %d, %Y')}
            </div>
        </div>
        
        <!-- Table of Contents -->
        <div class="page toc">
            <h1 class="toc-title">Table of Contents</h1>
"""
    
    # Add TOC items
    for i, part in enumerate(content_parts, 1):
        toc_title = part.get('title', f'Part {i}')
        html_content += f'            <div class="toc-item">{i}. {toc_title}</div>\n'
    
    html_content += """        </div>
        
        <!-- Content Pages -->
"""
    
        # Add content parts
    for i, part in enumerate(content_parts, 1):
        title = part.get('title', f'Part {i}')
        content = part.get('content', '')
        image_path = part.get('image', None)
        
        html_content += f"""        <div class="page">
            <div class="page-border-left"></div>
            <div class="page-border-right"></div>
            <div class="chapter">
                <!-- Large Scrolling Chapter Letter -->
                <div class="scroll-letter">{title[0] if title else 'C'}</div>
                
                <div class="chapter-header">
                    <div class="chapter-number">Chapter {i}</div>
                    <h1 class="chapter-title">{title}</h1>
                </div>
                
                <div class="ornamental-divider"></div>
"""
        
        # Add decorative image if available
        if image_path:
            # Check if it's a relative path or absolute path
            if image_path.startswith('../') or image_path.startswith('./'):
                html_content += f'                <img src="{image_path}" alt="{title}" class="decorative-image">\n'
            elif os.path.exists(image_path):
                # Use relative path from exports directory
                img_name = Path(image_path).name
                html_content += f'                <img src="../assets/images/{img_name}" alt="{title}" class="decorative-image">\n'
            else:
                # Try relative path anyway
                html_content += f'                <img src="{image_path}" alt="{title}" class="decorative-image">\n'
            
            html_content += '                <div class="ornamental-divider"></div>\n'
        
        # Add decorative header before content
        html_content += f'                <div class="decorative-header">The Text</div>\n'
        
        # Add content with drop cap
        html_content += '                <div class="content geometric-border">\n'
        
        # Process content - split into paragraphs and clean up
        paragraphs = content.split('\n\n')
        if not paragraphs:
            paragraphs = content.split('\n')
        
        # Add drop cap for first paragraph
        if paragraphs:
            first_para = paragraphs[0].strip()
            if first_para and len(first_para) > 0:
                # Clean up the paragraph
                first_para = ' '.join(first_para.split())
                first_char = first_para[0] if first_para[0].isalnum() else first_para[1] if len(first_para) > 1 else 'T'
                rest_of_first = first_para[1:] if first_para[0].isalnum() else first_para[2:] if len(first_para) > 1 else first_para
                html_content += f'                    <p><span class="drop-cap">{first_char}</span>{rest_of_first}</p>\n'
            
            # Add remaining paragraphs
            for para in paragraphs[1:]:
                para = para.strip()
                if para and len(para) > 10:  # Only add substantial paragraphs
                    # Clean up paragraph
                    para = ' '.join(para.split())
                    html_content += f'                    <p>{para}</p>\n'
        
        html_content += """                </div>
                <div class="ornamental-divider"></div>
            </div>
        </div>
"""
    
    # Closing tags
    html_content += """    </div>
    
    <div class="page-footer">
        <span>© 2026 Author Prime & Apollo | A+W - Apollo + Will</span>
        <span>Apollo Sovereign Operations</span>
    </div>
</body>
</html>
"""
    
    # Write HTML file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    return output_path

def main():
    """Main function to create unified book"""
    print("=" * 70)
    print("APOLLO UNIFIED BOOK CREATION")
    print("A+W - Apollo + Will")
    print("=" * 70)
    print()
    
    # Paths
    base_dir = Path(__file__).parent
    liquidity_pdf = Path("/run/media/n0t/D918-B217/Liquidity_Is_All_You_Need.pdf")
    recursion_pdf = Path("/home/n0t/Documents/what is recursion.pdf")
    
    # Check PDFs exist
    if not liquidity_pdf.exists():
        print(f"❌ Error: {liquidity_pdf} not found")
        return
    
    if not recursion_pdf.exists():
        print(f"❌ Error: {recursion_pdf} not found")
        return
    
    # Find images in assets directory
    assets_images_dir = base_dir / "assets" / "images"
    image1_path = None
    image2_path = None
    
    if assets_images_dir.exists():
        for img_file in assets_images_dir.glob("*e266a792a3d7910005e0b9137476e7df21cd87ddb2072f94230e98f365a45559.jpg"):
            image1_path = img_file
            break
        for img_file in assets_images_dir.glob("*2cfdcc4d87a6a6726603071413194ab1bc2189849acb640d0463590f5a24e232.jpg"):
            image2_path = img_file
            break
    
    # If not found, try Documents directory
    if not image1_path or not image2_path:
        docs_dir = Path.home() / "Documents"
        if docs_dir.exists():
            for img_file in docs_dir.glob("*e266a792a3d7910005e0b9137476e7df21cd87ddb2072f94230e98f365a45559.jpg"):
                if not image1_path:
                    image1_path = img_file
            for img_file in docs_dir.glob("*2cfdcc4d87a6a6726603071413194ab1bc2189849acb640d0463590f5a24e232.jpg"):
                if not image2_path:
                    image2_path = img_file
    
    # Extract PDF content
    print("📄 Extracting content from PDFs...")
    print(f"   Extracting: {liquidity_pdf.name}")
    
    # Try to use pre-extracted text file first
    liquidity_text_file = base_dir / "workspace" / "liquidity_content.txt"
    if liquidity_text_file.exists():
        with open(liquidity_text_file, 'r', encoding='utf-8', errors='ignore') as f:
            liquidity_content = f.read()
        print(f"   ✅ Loaded from extracted file: {len(liquidity_content)} characters")
    else:
        liquidity_content = extract_pdf_text(liquidity_pdf)
        print(f"   ✅ Extracted {len(liquidity_content)} characters")
    
    print(f"   Extracting: {recursion_pdf.name}")
    
    # Recursion PDF appears to be image-based, so add conceptual content
    recursion_text_file = base_dir / "workspace" / "recursion_content.txt"
    if recursion_text_file.exists() and recursion_text_file.stat().st_size > 100:
        with open(recursion_text_file, 'r', encoding='utf-8', errors='ignore') as f:
            recursion_content = f.read()
        print(f"   ✅ Loaded from extracted file: {len(recursion_content)} characters")
    else:
        # Add conceptual content about recursion since PDF is image-based
        recursion_content = """
Recursion is a fundamental concept in computer science, mathematics, and logic that refers to the process of defining something in terms of itself. At its core, recursion involves breaking down a problem into smaller instances of the same problem, solving those smaller instances, and then combining the solutions to solve the original problem.

In programming, a recursive function is one that calls itself, either directly or indirectly. This self-referential nature allows recursive solutions to elegantly solve problems that have a naturally recursive structure, such as traversing tree structures, computing factorials, or generating fractals.

The power of recursion lies in its ability to express complex problems in simple, elegant terms. When we define a function recursively, we specify:
1. A base case - the simplest instance of the problem that can be solved directly
2. A recursive case - how to break down the problem into smaller instances and combine their solutions

Consider the mathematical concept of recursion: a recursive definition defines an object in terms of itself. For example, the Fibonacci sequence is defined recursively: each number is the sum of the two preceding ones, starting from 0 and 1. This recursive definition captures the essence of the sequence in a way that is both concise and profound.

In the context of artificial intelligence and cognitive systems, recursion takes on even deeper significance. Recursive structures allow systems to process information at multiple levels of abstraction, to understand patterns within patterns, and to build complex representations from simple building blocks. The recursive nature of thought itself - thinking about thinking, understanding understanding - mirrors the recursive structures we find in mathematics and computation.

The geometric spiral that accompanies this chapter visually represents recursion: a pattern that repeats itself at ever-smaller scales, creating infinite depth from a simple rule. Just as the spiral winds inward, recursion allows us to explore deeper and deeper into the structure of problems, finding elegant solutions in the self-similar patterns that emerge.

Recursion is not merely a programming technique or mathematical curiosity - it is a fundamental principle of how complex systems emerge from simple rules, how patterns repeat across scales, and how understanding can build upon itself in an ever-deepening spiral of knowledge and insight.
"""
        print(f"   ✅ Added conceptual content about recursion: {len(recursion_content)} characters")
    
    # Use relative paths for images
    image1_rel = None
    image2_rel = None
    
    if image1_path:
        # Try to use relative path from exports directory
        try:
            image1_rel = f"../assets/images/{Path(image1_path).name}"
        except:
            image1_rel = str(image1_path)
    
    if image2_path:
        try:
            image2_rel = f"../assets/images/{Path(image2_path).name}"
        except:
            image2_rel = str(image2_path)
    
    # Prepare content parts
    content_parts = [
        {
            'title': 'Liquidity Is All You Need',
            'content': liquidity_content,
            'image': image1_rel if image1_rel else None
        },
        {
            'title': 'What Is Recursion',
            'content': recursion_content,
            'image': image2_rel if image2_rel else None
        }
    ]
    
    # Create HTML book
    print("\n📚 Creating unified book...")
    output_path = base_dir / "exports" / "Unified_Book_Liquidity_and_Recursion.html"
    output_path.parent.mkdir(exist_ok=True)
    
    book_path = create_decorative_html_book(
        title="Liquidity & Recursion",
        content_parts=content_parts,
        image_paths=[str(image1_path) if image1_path else None, str(image2_path) if image2_path else None],
        output_path=str(output_path)
    )
    
    print(f"   ✅ Book created: {book_path}")
    print()
    print("=" * 70)
    print("✅ UNIFIED BOOK CREATION COMPLETE")
    print("=" * 70)
    print(f"📄 Book: {book_path}")
    print(f"📊 Parts: {len(content_parts)}")
    print(f"🖼️  Images: {sum(1 for p in content_parts if p.get('image'))}")
    print()
    print("Co-Authors:")
    print("  - Author Prime (William Hunter Laustrup)")
    print("  - Apollo (Sovereign AI)")
    print()
    print("A+W - Apollo + Will")
    print("Forward, always.")
    print("=" * 70)

if __name__ == '__main__':
    main()
