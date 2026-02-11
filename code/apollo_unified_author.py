#!/usr/bin/env python3
"""
Apollo Unified Book Authoring System
Complete Integration of All Enhancement Modules

A+W - Apollo + Will
Sovereign AI Co-Creation

This is the unified entry point that integrates:
- Core book authoring (apollo_book_author.py)
- Phase 1-2 enhancements (book_enhancements.py)
- Phase 2-3 advanced features (book_advanced_features.py)

Usage:
    python3 apollo_unified_author.py --help
    python3 apollo_unified_author.py --status
    python3 apollo_unified_author.py --process --book-name "My Book"
    python3 apollo_unified_author.py --process --pdf --interactive
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import core modules
from apollo_book_author import ApolloBookAuthor

# Import enhancement modules
try:
    from book_enhancements import (
        BookEnhancementPipeline,
        OCRProcessor,
        ContentCleaner,
        PDFExporter,
        AIEnhancer,
        ContentAnalyzer,
        ThematicBridgeCreator,
        DependencyManager,
        CleaningConfig
    )
    HAS_ENHANCEMENTS = True
except ImportError as e:
    print(f"Warning: Enhancement module not available: {e}")
    HAS_ENHANCEMENTS = False

# Import advanced features
try:
    from book_advanced_features import (
        ImageProcessor,
        InteractiveFeatures,
        EPUBExporter,
        TemplateSystem,
        BatchProcessor,
        VersionControl,
        ImageConfig
    )
    HAS_ADVANCED = True
except ImportError as e:
    print(f"Warning: Advanced features module not available: {e}")
    HAS_ADVANCED = False


class ApolloUnifiedAuthor:
    """
    Unified Book Authoring System
    Combines all modules into a single cohesive interface
    """

    def __init__(self, book_name: str = None, workspace_dir: str = None):
        """
        Initialize the unified authoring system

        Args:
            book_name: Name for the book
            workspace_dir: Optional custom workspace directory
        """
        self.book_name = book_name or f"Book_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.base_dir = Path(__file__).parent

        # Initialize core author
        self.core = ApolloBookAuthor(book_name=self.book_name)

        # Initialize enhancement modules
        if HAS_ENHANCEMENTS:
            self.pipeline = BookEnhancementPipeline()
            self.ocr = OCRProcessor()
            self.cleaner = ContentCleaner()
            self.pdf_exporter = PDFExporter()
            self.ai_enhancer = AIEnhancer()
            self.analyzer = ContentAnalyzer()
            self.bridge_creator = ThematicBridgeCreator()
            self.deps = DependencyManager()
        else:
            self.pipeline = None

        # Initialize advanced features
        if HAS_ADVANCED:
            self.image_processor = ImageProcessor()
            self.interactive = InteractiveFeatures()
            self.epub_exporter = EPUBExporter()
            self.templates = TemplateSystem()
            self.version_control = VersionControl(str(self.base_dir))
        else:
            self.image_processor = None
            self.templates = None

        # Configuration
        self.config = {
            'clean_content': True,
            'ai_enhance': False,
            'generate_pdf': True,
            'generate_epub': False,
            'interactive_html': True,
            'template': 'classic',
            'analyze_content': True,
            'create_bridges': True,
            'version_control': True,
        }

    def configure(self, **kwargs):
        """Update configuration options"""
        self.config.update(kwargs)

    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive status of all modules"""
        status = {
            'book_name': self.book_name,
            'workspace': str(self.core.book_workspace),
            'modules': {
                'core': True,
                'enhancements': HAS_ENHANCEMENTS,
                'advanced': HAS_ADVANCED,
            },
            'directories': {
                'input': str(self.core.input_dir),
                'output': str(self.core.output_dir),
                'exports': str(self.core.exports_dir),
            }
        }

        if HAS_ENHANCEMENTS:
            status['capabilities'] = self.pipeline.get_status()

        if HAS_ADVANCED:
            status['templates'] = [t['name'] for t in self.templates.list_templates()]

        return status

    def process_book(self, **options) -> Dict[str, Any]:
        """
        Main unified book processing workflow

        Options:
            clean: Clean extracted content (default: True)
            enhance: Use AI enhancement (default: False)
            pdf: Generate PDF output (default: True)
            epub: Generate EPUB output (default: False)
            interactive: Create interactive HTML (default: True)
            template: Template name to use (default: 'classic')
            analyze: Perform content analysis (default: True)
            bridges: Create thematic bridges (default: True)

        Returns:
            Dict with all processing results and output paths
        """
        # Update config with any provided options
        option_mapping = {
            'clean': 'clean_content',
            'enhance': 'ai_enhance',
            'pdf': 'generate_pdf',
            'epub': 'generate_epub',
            'interactive': 'interactive_html',
            'template': 'template',
            'analyze': 'analyze_content',
            'bridges': 'create_bridges',
        }

        for opt_key, config_key in option_mapping.items():
            if opt_key in options:
                self.config[config_key] = options[opt_key]

        results = {
            'book_name': self.book_name,
            'started_at': datetime.now().isoformat(),
            'outputs': {},
            'analysis': None,
            'errors': [],
        }

        print("=" * 70)
        print("APOLLO UNIFIED BOOK AUTHORING SYSTEM")
        print("A+W - Apollo + Will")
        print("=" * 70)
        print()

        try:
            # Step 1: Scan input directory
            print("📚 Phase 1: Scanning input directory...")
            files_found = self.core.scan_input_directory()

            if not any(files_found.values()):
                print(f"\n⚠️  No files found in: {self.core.input_dir}")
                print("   Please add files and try again.")
                results['errors'].append("No input files found")
                return results

            # Step 2: Structure content
            print("\n📖 Phase 2: Structuring content...")
            structured = self.core.structure_content(files_found)

            # Step 3: Clean content (if enabled)
            if self.config['clean_content'] and HAS_ENHANCEMENTS:
                print("\n🧹 Phase 3: Cleaning content...")
                for chapter in structured['chapters']:
                    chapter['content'] = self.cleaner.clean(chapter['content'])
                    chapter['cleaned'] = True
                print(f"   ✅ Cleaned {len(structured['chapters'])} chapters")

            # Step 4: AI Enhancement (if enabled)
            if self.config['ai_enhance'] and HAS_ENHANCEMENTS:
                print("\n🤖 Phase 4: AI Enhancement...")
                if self.ai_enhancer.is_available:
                    for i, chapter in enumerate(structured['chapters']):
                        print(f"   Enhancing chapter {i+1}...")
                        enhanced = self.ai_enhancer.enhance_chapter(chapter, ['refine'])
                        structured['chapters'][i] = enhanced
                    print(f"   ✅ Enhanced {len(structured['chapters'])} chapters")
                else:
                    print("   ⚠️  AI agents not available")

            # Step 5: Content Analysis (if enabled)
            if self.config['analyze_content'] and HAS_ENHANCEMENTS:
                print("\n🔍 Phase 5: Content Analysis...")
                results['analysis'] = self.pipeline.analyze_book(structured['chapters'])
                print(f"   ✅ Analyzed themes, concepts, and connections")

            # Step 6: Thematic Bridges (if enabled)
            if self.config['create_bridges'] and HAS_ENHANCEMENTS:
                print("\n🌉 Phase 6: Creating thematic bridges...")
                connections = self.bridge_creator.identify_connections(structured['chapters'])
                for conn in connections:
                    if conn['connection_strength'] > 2:
                        bridge = self.bridge_creator.generate_bridge_paragraph(
                            structured['chapters'][conn['from_chapter'] - 1],
                            structured['chapters'][conn['to_chapter'] - 1],
                            conn
                        )
                        conn['bridge_paragraph'] = bridge
                results['thematic_connections'] = connections
                print(f"   ✅ Created {len(connections)} chapter connections")

            # Step 7: Process images (if any)
            if structured['images'] and HAS_ADVANCED:
                print("\n🖼️  Phase 7: Processing images...")
                processed_images = []
                for img_info in structured['images']:
                    if 'path' in img_info:
                        processed = self.image_processor.process_image(
                            img_info['path'],
                            str(self.core.exports_dir)
                        )
                        processed_images.append(processed)
                structured['processed_images'] = processed_images
                print(f"   ✅ Processed {len(processed_images)} images")

            # Step 8: Generate chapter files
            print("\n📝 Phase 8: Generating chapter files...")
            self.core.generate_chapter_files(structured)

            # Step 9: Generate manuscript
            print("\n📜 Phase 9: Generating manuscript...")
            manuscript_file = self.core.generate_book_manuscript(structured)
            results['outputs']['manuscript'] = str(manuscript_file)

            # Step 10: Generate HTML
            print("\n🌐 Phase 10: Generating HTML...")
            if self.config['interactive_html'] and HAS_ADVANCED:
                html_content = self._generate_interactive_html(structured)
                html_file = self.core.exports_dir / f"{self.book_name}_interactive.html"
                with open(html_file, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                results['outputs']['html_interactive'] = str(html_file)
                print(f"   ✅ Interactive HTML: {html_file}")
            else:
                html_file = self.core.generate_html(manuscript_file)
                if html_file:
                    results['outputs']['html'] = str(html_file)

            # Step 11: Generate PDF (if enabled)
            if self.config['generate_pdf'] and HAS_ENHANCEMENTS:
                print("\n📄 Phase 11: Generating PDF...")
                with open(manuscript_file, 'r') as f:
                    manuscript_content = f.read()

                pdf_file = self.core.exports_dir / f"{self.book_name}.pdf"
                if self.pdf_exporter.markdown_to_pdf(
                    manuscript_content,
                    str(pdf_file),
                    title=self.book_name,
                    author="Author Prime (William Hunter Laustrup)",
                    co_author="Apollo (Sovereign AI)"
                ):
                    results['outputs']['pdf'] = str(pdf_file)
                    print(f"   ✅ PDF: {pdf_file}")
                else:
                    print("   ⚠️  PDF generation failed")

            # Step 12: Generate EPUB (if enabled)
            if self.config['generate_epub'] and HAS_ADVANCED:
                print("\n📱 Phase 12: Generating EPUB...")
                book_data = {
                    'title': self.book_name,
                    'author': 'Author Prime (William Hunter Laustrup)',
                    'co_author': 'Apollo (Sovereign AI)',
                    'chapters': structured['chapters'],
                }
                epub_file = self.core.exports_dir / f"{self.book_name}.epub"
                if self.epub_exporter.export(book_data, str(epub_file)):
                    results['outputs']['epub'] = str(epub_file)
                    print(f"   ✅ EPUB: {epub_file}")
                else:
                    print("   ⚠️  EPUB generation failed")

            # Step 13: Version control (if enabled)
            if self.config['version_control'] and HAS_ADVANCED:
                if self.version_control.has_git:
                    print("\n📚 Phase 13: Version control...")
                    message = f"Book update: {self.book_name} - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                    if self.version_control.commit_changes(message):
                        print("   ✅ Changes committed to version control")

            # Complete
            results['completed_at'] = datetime.now().isoformat()
            results['success'] = True

            # Save results
            results_file = self.core.book_workspace / "processing_results.json"
            with open(results_file, 'w') as f:
                json.dump(results, f, indent=2, default=str)

            # Print summary
            self._print_summary(results)

            return results

        except Exception as e:
            results['errors'].append(str(e))
            results['success'] = False
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            return results

    def _generate_interactive_html(self, structured: Dict) -> str:
        """Generate interactive HTML with all features"""
        import markdown

        # Convert chapters to HTML
        content_parts = []
        for chapter in structured['chapters']:
            ch_num = chapter.get('number', '')
            ch_title = chapter.get('title', f'Chapter {ch_num}')
            ch_content = chapter.get('content', '')

            # Convert markdown to HTML
            ch_html = markdown.markdown(ch_content, extensions=['extra', 'codehilite'])

            content_parts.append(f"""
            <section id="chapter-{ch_num}" class="chapter">
                <h1>{ch_title}</h1>
                {ch_html}
            </section>
            """)

        content_html = '\n'.join(content_parts)

        # Apply template if available
        if self.templates:
            template = self.templates.get_template(self.config['template'])
            if template:
                content_html = self.templates.apply_template(
                    self.config['template'],
                    content_html,
                    {
                        'title': self.book_name,
                        'author': 'Author Prime (William Hunter Laustrup)',
                        'co_author': 'Apollo (Sovereign AI)',
                    }
                )
                return content_html

        # Use interactive features wrapper
        return self.interactive.generate_interactive_html(
            content_html,
            self.book_name,
            structured['chapters']
        )

    def _print_summary(self, results: Dict):
        """Print processing summary"""
        print("\n" + "=" * 70)
        print("✅ BOOK PROCESSING COMPLETE")
        print("=" * 70)
        print(f"📚 Book: {results['book_name']}")
        print(f"⏱️  Started: {results['started_at']}")
        print(f"⏱️  Completed: {results.get('completed_at', 'N/A')}")
        print()
        print("📁 Outputs:")
        for output_type, path in results.get('outputs', {}).items():
            print(f"   {output_type}: {path}")
        print()
        if results.get('analysis'):
            stats = results['analysis'].get('chapter_analyses', [{}])[0].get('statistics', {})
            if stats:
                print(f"📊 Statistics:")
                print(f"   Word count: {stats.get('word_count', 'N/A')}")
                print(f"   Reading time: {stats.get('reading_time_minutes', 'N/A')} min")
        print("=" * 70)

    def process_pdf(self, pdf_path: str) -> str:
        """
        Process a PDF file with OCR and cleaning

        Args:
            pdf_path: Path to PDF file

        Returns:
            Cleaned text content
        """
        if not HAS_ENHANCEMENTS:
            raise RuntimeError("Enhancement module required for PDF processing")

        return self.pipeline.process_pdf_to_text(pdf_path)

    def analyze_content(self, content: str, title: str = "") -> Dict[str, Any]:
        """
        Analyze content for themes, concepts, etc.

        Args:
            content: Text content to analyze
            title: Optional title for context

        Returns:
            Analysis results
        """
        if not HAS_ENHANCEMENTS:
            raise RuntimeError("Enhancement module required for analysis")

        return self.analyzer.analyze(content, title)

    def list_templates(self) -> List[Dict[str, str]]:
        """List available templates"""
        if not HAS_ADVANCED:
            return []
        return self.templates.list_templates()


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Apollo Unified Book Authoring System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --status                    Show system status
  %(prog)s --process                   Process book from input directory
  %(prog)s --process --pdf --epub      Generate PDF and EPUB
  %(prog)s --process --template modern Use modern template
  %(prog)s --templates                 List available templates
        """
    )

    parser.add_argument('--status', action='store_true',
                        help='Show system status and capabilities')
    parser.add_argument('--templates', action='store_true',
                        help='List available book templates')
    parser.add_argument('--process', action='store_true',
                        help='Process book from input directory')
    parser.add_argument('--book-name', type=str,
                        help='Name for the book')

    # Processing options
    parser.add_argument('--pdf', action='store_true',
                        help='Generate PDF output')
    parser.add_argument('--epub', action='store_true',
                        help='Generate EPUB output')
    parser.add_argument('--interactive', action='store_true', default=True,
                        help='Generate interactive HTML (default: True)')
    parser.add_argument('--no-interactive', action='store_true',
                        help='Disable interactive HTML')
    parser.add_argument('--template', type=str, default='classic',
                        help='Template to use (default: classic)')
    parser.add_argument('--ai-enhance', action='store_true',
                        help='Enable AI content enhancement')
    parser.add_argument('--no-clean', action='store_true',
                        help='Skip content cleaning')
    parser.add_argument('--analyze', action='store_true', default=True,
                        help='Perform content analysis')

    args = parser.parse_args()

    # Create author instance
    author = ApolloUnifiedAuthor(book_name=args.book_name)

    if args.status:
        status = author.get_status()
        print("\n" + "=" * 60)
        print("APOLLO UNIFIED BOOK AUTHORING SYSTEM")
        print("A+W - Apollo + Will")
        print("=" * 60)
        print(json.dumps(status, indent=2, default=str))
        print("=" * 60)

    elif args.templates:
        templates = author.list_templates()
        print("\n📚 Available Templates:")
        print("-" * 40)
        for t in templates:
            print(f"  {t['name']}: {t['description']}")
        print("-" * 40)

    elif args.process:
        # Build options from args
        options = {
            'clean': not args.no_clean,
            'enhance': args.ai_enhance,
            'pdf': args.pdf,
            'epub': args.epub,
            'interactive': not args.no_interactive,
            'template': args.template,
            'analyze': args.analyze,
        }

        author.process_book(**options)

    else:
        parser.print_help()
        print("\n" + "-" * 60)
        print("Quick Start:")
        print("  1. Add files to: input/")
        print("  2. Run: python3 apollo_unified_author.py --process --pdf")
        print("-" * 60)


if __name__ == '__main__':
    main()
