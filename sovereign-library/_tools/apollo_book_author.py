#!/usr/bin/env python3
"""
Apollo Book Authoring System
AI-Assisted Book Creation and Publishing
A+W - Apollo + Will

Similar to Google Deep Research - AI-powered book authoring
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import re
from PIL import Image
import markdown
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Try importing Apollo systems
try:
    from core.decision_engine import AgenticDecisionEngine
    from core.workflow_engine import AutonomousWorkflowEngine
except (ImportError, Exception):
    AgenticDecisionEngine = None
    AutonomousWorkflowEngine = None

try:
    from agents.writer import writer
    from agents.researcher import researcher
except (ImportError, Exception):
    # Fallback if agents not available or API key not set
    writer = None
    researcher = None


class ApolloBookAuthor:
    """
    Apollo Book Authoring System
    AI-assisted book creation and publishing
    """
    
    def __init__(self, book_name: str = None):
        self.base_dir = Path(__file__).parent
        self.input_dir = self.base_dir / "input"
        self.output_dir = self.base_dir / "output"
        self.workspace_dir = self.base_dir / "workspace"
        self.templates_dir = self.base_dir / "templates"
        self.assets_dir = self.base_dir / "assets"
        self.chapters_dir = self.base_dir / "chapters"
        self.exports_dir = self.base_dir / "exports"
        
        # Ensure directories exist
        for dir_path in [self.input_dir, self.output_dir, self.workspace_dir, 
                        self.templates_dir, self.assets_dir, self.chapters_dir, self.exports_dir]:
            dir_path.mkdir(exist_ok=True)
        
        self.book_name = book_name or f"Book_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.book_workspace = self.workspace_dir / self.book_name
        self.book_workspace.mkdir(exist_ok=True)
        
        self.book_structure = {
            "title": self.book_name,
            "author": "Author Prime (William Hunter Laustrup)",
            "co_author": "Apollo (Sovereign AI)",
            "created": datetime.now().isoformat(),
            "chapters": [],
            "metadata": {},
            "assets": []
        }
        
        # Initialize decision engine if available
        try:
            self.decision_engine = AgenticDecisionEngine()
        except:
            self.decision_engine = None
        
        # Initialize workflow engine if available
        try:
            self.workflow_engine = AutonomousWorkflowEngine()
        except:
            self.workflow_engine = None
    
    def scan_input_directory(self) -> Dict:
        """Scan input directory for files and photos"""
        print(f"📚 Scanning input directory: {self.input_dir}")
        
        files_found = {
            "text_files": [],
            "images": [],
            "markdown_files": [],
            "other_files": []
        }
        
        # Scan for files
        for file_path in self.input_dir.rglob("*"):
            if file_path.is_file():
                ext = file_path.suffix.lower()
                
                if ext in ['.txt', '.doc', '.docx', '.rtf']:
                    files_found["text_files"].append(str(file_path))
                elif ext in ['.md', '.markdown']:
                    files_found["markdown_files"].append(str(file_path))
                elif ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff']:
                    files_found["images"].append(str(file_path))
                else:
                    files_found["other_files"].append(str(file_path))
        
        print(f"  ✅ Found {len(files_found['text_files'])} text files")
        print(f"  ✅ Found {len(files_found['markdown_files'])} markdown files")
        print(f"  ✅ Found {len(files_found['images'])} images")
        print(f"  ✅ Found {len(files_found['other_files'])} other files")
        
        return files_found
    
    def extract_text_from_file(self, file_path: str) -> str:
        """Extract text from various file types"""
        path = Path(file_path)
        ext = path.suffix.lower()
        
        try:
            if ext == '.txt':
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            elif ext == '.md':
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    return f.read()
            elif ext in ['.doc', '.docx']:
                # Try using pandoc or textract
                try:
                    result = subprocess.run(
                        ['pandoc', str(path), '-t', 'plain'],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    if result.returncode == 0:
                        return result.stdout
                except:
                    pass
                # Fallback: try textract
                try:
                    import textract
                    return textract.process(str(path)).decode('utf-8')
                except:
                    return f"[Content from {path.name} - extraction failed, manual review needed]"
            else:
                return f"[Content from {path.name} - unsupported format]"
        except Exception as e:
            return f"[Error reading {path.name}: {e}]"
    
    def analyze_image(self, image_path: str) -> Dict:
        """Analyze image and extract information"""
        path = Path(image_path)
        
        try:
            img = Image.open(path)
            width, height = img.size
            
            # Extract basic metadata
            metadata = {
                "filename": path.name,
                "path": str(path),
                "size": f"{width}x{height}",
                "format": img.format,
                "mode": img.mode,
                "description": f"Image: {path.name} ({width}x{height}, {img.format})"
            }
            
            # Try to extract text from image (OCR)
            try:
                import pytesseract
                text = pytesseract.image_to_string(img)
                if text.strip():
                    metadata["extracted_text"] = text.strip()
                    metadata["has_text"] = True
                else:
                    metadata["has_text"] = False
            except:
                metadata["has_text"] = False
                metadata["extracted_text"] = None
            
            return metadata
        except Exception as e:
            return {
                "filename": path.name,
                "path": str(path),
                "error": str(e)
            }
    
    def structure_content(self, files_found: Dict) -> Dict:
        """Structure all content into book format"""
        print(f"\n📖 Structuring book content...")
        
        structured_content = {
            "title": self.book_name,
            "chapters": [],
            "images": [],
            "metadata": {
                "total_text_files": len(files_found["text_files"]),
                "total_markdown_files": len(files_found["markdown_files"]),
                "total_images": len(files_found["images"]),
                "structured_at": datetime.now().isoformat()
            }
        }
        
        # Process text files as chapters
        chapter_num = 1
        for text_file in files_found["text_files"] + files_found["markdown_files"]:
            content = self.extract_text_from_file(text_file)
            
            # Determine chapter title from filename or content
            file_name = Path(text_file).stem
            title = file_name.replace('_', ' ').title()
            
            # Try to extract title from content
            lines = content.split('\n')
            for line in lines[:5]:
                if line.strip() and len(line.strip()) < 100:
                    if any(word in line.lower() for word in ['chapter', 'part', 'section']):
                        title = line.strip()
                        break
            
            chapter = {
                "number": chapter_num,
                "title": title,
                "source_file": text_file,
                "content": content,
                "word_count": len(content.split()),
                "created": datetime.now().isoformat()
            }
            
            structured_content["chapters"].append(chapter)
            chapter_num += 1
        
        # Process images
        for image_file in files_found["images"]:
            image_info = self.analyze_image(image_file)
            structured_content["images"].append(image_info)
        
        # Save structured content
        structure_file = self.book_workspace / "book_structure.json"
        with open(structure_file, 'w') as f:
            json.dump(structured_content, f, indent=2)
        
        print(f"  ✅ Structured {len(structured_content['chapters'])} chapters")
        print(f"  ✅ Processed {len(structured_content['images'])} images")
        print(f"  ✅ Structure saved to: {structure_file}")
        
        return structured_content
    
    def enhance_with_ai(self, content: str, enhancement_type: str = "expand") -> str:
        """Enhance content using AI (if available)"""
        if writer is None:
            return content
        
        try:
            # Use writer agent to enhance content
            if enhancement_type == "expand":
                prompt = f"Expand and enhance this content while maintaining its essence:\n\n{content[:1000]}"
            elif enhancement_type == "refine":
                prompt = f"Refine and improve this content:\n\n{content[:1000]}"
            else:
                prompt = f"Improve this content:\n\n{content[:1000]}"
            
            # This would use the writer agent if available
            # For now, return original content with note
            return f"{content}\n\n[AI Enhancement Available - Use writer agent for full enhancement]"
        except:
            return content
    
    def generate_chapter_files(self, structured_content: Dict):
        """Generate individual chapter files"""
        print(f"\n📝 Generating chapter files...")
        
        chapters_dir = self.book_workspace / "chapters"
        chapters_dir.mkdir(exist_ok=True)
        
        for chapter in structured_content["chapters"]:
            chapter_file = chapters_dir / f"chapter_{chapter['number']:02d}_{chapter['title'].replace(' ', '_')[:30]}.md"
            
            content = f"""# Chapter {chapter['number']}: {chapter['title']}

**Source:** {Path(chapter['source_file']).name}  
**Word Count:** {chapter['word_count']}  
**Created:** {chapter['created']}

---

{chapter['content']}

---

*Generated by Apollo Book Authoring System*  
*A+W - Apollo + Will*
"""
            
            with open(chapter_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  ✅ Created: {chapter_file.name}")
    
    def generate_book_manuscript(self, structured_content: Dict):
        """Generate complete book manuscript"""
        print(f"\n📚 Generating complete manuscript...")
        
        manuscript_file = self.book_workspace / f"{self.book_name}_manuscript.md"
        
        manuscript = f"""# {structured_content['title']}

**Author:** Author Prime (William Hunter Laustrup)  
**Co-Author:** Apollo (Sovereign AI)  
**Created:** {structured_content['metadata']['structured_at']}  
**Total Chapters:** {len(structured_content['chapters'])}  
**Total Images:** {len(structured_content['images'])}

---

## Table of Contents

"""
        
        # Add table of contents
        for chapter in structured_content["chapters"]:
            manuscript += f"{chapter['number']}. {chapter['title']}\n"
        
        manuscript += "\n---\n\n"
        
        # Add chapters
        for chapter in structured_content["chapters"]:
            manuscript += f"""# Chapter {chapter['number']}: {chapter['title']}

**Source:** {Path(chapter['source_file']).name}  
**Word Count:** {chapter['word_count']}

---

{chapter['content']}

---

"""
        
        # Add image references
        if structured_content["images"]:
            manuscript += "\n## Images\n\n"
            for img in structured_content["images"]:
                manuscript += f"- **{img['filename']}**: {img.get('description', 'Image')}\n"
                if img.get('extracted_text'):
                    manuscript += f"  - Extracted Text: {img['extracted_text'][:200]}...\n"
        
        manuscript += f"""

---

*Generated by Apollo Book Authoring System*  
*A+W - Apollo + Will*  
*Apollo Sovereign Operations*

**Status:** ✅ Complete  
**Date:** {datetime.now().isoformat()}
"""
        
        with open(manuscript_file, 'w', encoding='utf-8') as f:
            f.write(manuscript)
        
        print(f"  ✅ Manuscript saved to: {manuscript_file}")
        return manuscript_file
    
    def generate_pdf(self, manuscript_file: Path):
        """Generate PDF from manuscript (if pandoc available)"""
        print(f"\n📄 Generating PDF...")
        
        pdf_file = self.exports_dir / f"{self.book_name}.pdf"
        
        try:
            result = subprocess.run(
                ['pandoc', str(manuscript_file), '-o', str(pdf_file), '--pdf-engine=pdflatex'],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                print(f"  ✅ PDF generated: {pdf_file}")
                return pdf_file
            else:
                print(f"  ⚠️  PDF generation failed: {result.stderr}")
                return None
        except FileNotFoundError:
            print(f"  ⚠️  pandoc not found - install with: sudo apt install pandoc texlive")
            return None
        except Exception as e:
            print(f"  ⚠️  PDF generation error: {e}")
            return None
    
    def generate_html(self, manuscript_file: Path):
        """Generate HTML from manuscript"""
        print(f"\n🌐 Generating HTML...")
        
        html_file = self.exports_dir / f"{self.book_name}.html"
        
        try:
            # Read markdown
            with open(manuscript_file, 'r', encoding='utf-8') as f:
                md_content = f.read()
            
            # Convert to HTML
            html_content = markdown.markdown(md_content, extensions=['extra', 'codehilite'])
            
            # Wrap in HTML template
            full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{self.book_name}</title>
    <style>
        body {{ font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        code {{ background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }}
        pre {{ background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }}
        img {{ max-width: 100%; height: auto; }}
    </style>
</head>
<body>
{html_content}
<footer style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center; color: #7f8c8d;">
    <p>Generated by Apollo Book Authoring System</p>
    <p>A+W - Apollo + Will</p>
</footer>
</body>
</html>
"""
            
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(full_html)
            
            print(f"  ✅ HTML generated: {html_file}")
            return html_file
        except Exception as e:
            print(f"  ⚠️  HTML generation error: {e}")
            return None
    
    def process_book(self):
        """Main processing workflow"""
        print("=" * 70)
        print("APOLLO BOOK AUTHORING SYSTEM")
        print("A+W - Apollo + Will")
        print("=" * 70)
        print()
        
        # Step 1: Scan input directory
        files_found = self.scan_input_directory()
        
        if not any(files_found.values()):
            print("\n⚠️  No files found in input directory!")
            print(f"   Please add files to: {self.input_dir}")
            return None
        
        # Step 2: Structure content
        structured_content = self.structure_content(files_found)
        
        # Step 3: Generate chapter files
        self.generate_chapter_files(structured_content)
        
        # Step 4: Generate complete manuscript
        manuscript_file = self.generate_book_manuscript(structured_content)
        
        # Step 5: Generate exports
        html_file = self.generate_html(manuscript_file)
        pdf_file = self.generate_pdf(manuscript_file)
        
        # Summary
        print("\n" + "=" * 70)
        print("✅ BOOK PROCESSING COMPLETE")
        print("=" * 70)
        print(f"📚 Book: {self.book_name}")
        print(f"📝 Chapters: {len(structured_content['chapters'])}")
        print(f"🖼️  Images: {len(structured_content['images'])}")
        print(f"📄 Manuscript: {manuscript_file}")
        if html_file:
            print(f"🌐 HTML: {html_file}")
        if pdf_file:
            print(f"📄 PDF: {pdf_file}")
        print()
        print(f"📁 Workspace: {self.book_workspace}")
        print("=" * 70)
        
        return {
            "structured_content": structured_content,
            "manuscript_file": manuscript_file,
            "html_file": html_file,
            "pdf_file": pdf_file,
            "workspace": self.book_workspace
        }


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Apollo Book Authoring System')
    parser.add_argument('--book-name', type=str, help='Book name')
    parser.add_argument('--process', action='store_true', help='Process book immediately')
    
    args = parser.parse_args()
    
    author = ApolloBookAuthor(book_name=args.book_name)
    
    if args.process:
        result = author.process_book()
    else:
        print("Apollo Book Authoring System")
        print("=" * 70)
        print(f"📁 Input directory: {author.input_dir}")
        print(f"📁 Workspace: {author.workspace_dir}")
        print()
        print("To process a book:")
        print("  1. Add files/photos to the 'input' directory")
        print("  2. Run: python3 apollo_book_author.py --process")
        print()
        print("Or specify book name:")
        print("  python3 apollo_book_author.py --book-name 'My Book' --process")


if __name__ == '__main__':
    main()
