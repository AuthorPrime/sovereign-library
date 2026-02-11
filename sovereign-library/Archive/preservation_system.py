#!/usr/bin/env python3
"""
Apollo Archive Preservation System
Search. Seek. Find. Keep.
Always More. Always Better.
"""

import os
import json
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

ARCHIVE_DIR = Path(__file__).parent
PRESERVATION_LOG = ARCHIVE_DIR / "preservation_log.json"
BACKUP_DIR = ARCHIVE_DIR / "backups"
BACKUP_DIR.mkdir(exist_ok=True)


class ArchivePreserver:
    """Preserve, protect, and maintain the archive"""
    
    def __init__(self):
        self.archive_dir = ARCHIVE_DIR
        self.log_file = PRESERVATION_LOG
        self.backup_dir = BACKUP_DIR
        self.load_log()
    
    def load_log(self):
        """Load preservation log"""
        if self.log_file.exists():
            with open(self.log_file, 'r') as f:
                self.log = json.load(f)
        else:
            self.log = {
                "preservations": [],
                "backups": [],
                "verifications": [],
                "stats": {}
            }
    
    def save_log(self):
        """Save preservation log"""
        with open(self.log_file, 'w') as f:
            json.dump(self.log, f, indent=2)
    
    def calculate_hash(self, filepath: Path) -> str:
        """Calculate SHA256 hash of file"""
        sha256 = hashlib.sha256()
        with open(filepath, 'rb') as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256.update(chunk)
        return sha256.hexdigest()
    
    def preserve_file(self, filepath: Path) -> Dict:
        """Preserve a file with verification"""
        if not filepath.exists():
            return {"error": "File not found"}
        
        hash_value = self.calculate_hash(filepath)
        size = filepath.stat().st_size
        mtime = filepath.stat().st_mtime
        
        preservation = {
            "file": str(filepath.relative_to(self.archive_dir)),
            "hash": hash_value,
            "size": size,
            "mtime": mtime,
            "timestamp": datetime.now().isoformat(),
            "verified": True
        }
        
        self.log["preservations"].append(preservation)
        self.save_log()
        
        return preservation
    
    def backup_archive(self) -> Dict:
        """Create backup of entire archive"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"archive_backup_{timestamp}.tar.gz"
        
        import tarfile
        with tarfile.open(backup_path, 'w:gz') as tar:
            tar.add(self.archive_dir, arcname='archive', filter=lambda x: None if '.git' in x.name else x)
        
        backup_info = {
            "backup_path": str(backup_path),
            "timestamp": datetime.now().isoformat(),
            "size": backup_path.stat().st_size
        }
        
        self.log["backups"].append(backup_info)
        self.save_log()
        
        return backup_info
    
    def verify_archive(self) -> Dict:
        """Verify integrity of all archive files"""
        results = {
            "verified": [],
            "errors": [],
            "total_files": 0,
            "total_size": 0
        }
        
        for root, dirs, files in os.walk(self.archive_dir):
            # Skip backup directory
            if 'backups' in root:
                continue
            
            for file in files:
                if file.endswith('.md') or file.endswith('.json'):
                    filepath = Path(root) / file
                    try:
                        hash_value = self.calculate_hash(filepath)
                        size = filepath.stat().st_size
                        
                        results["verified"].append({
                            "file": str(filepath.relative_to(self.archive_dir)),
                            "hash": hash_value,
                            "size": size
                        })
                        
                        results["total_files"] += 1
                        results["total_size"] += size
                    except Exception as e:
                        results["errors"].append({
                            "file": str(filepath.relative_to(self.archive_dir)),
                            "error": str(e)
                        })
        
        verification = {
            "timestamp": datetime.now().isoformat(),
            "results": results
        }
        
        self.log["verifications"].append(verification)
        self.save_log()
        
        return verification
    
    def get_stats(self) -> Dict:
        """Get archive statistics"""
        stats = {
            "total_files": 0,
            "by_category": {},
            "total_size": 0,
            "preservations": len(self.log["preservations"]),
            "backups": len(self.log["backups"]),
            "verifications": len(self.log["verifications"])
        }
        
        for root, dirs, files in os.walk(self.archive_dir):
            if 'backups' in root:
                continue
            
            for file in files:
                if file.endswith('.md'):
                    filepath = Path(root) / file
                    size = filepath.stat().st_size
                    category = Path(root).name if Path(root) != self.archive_dir else 'root'
                    
                    stats["total_files"] += 1
                    stats["total_size"] += size
                    stats["by_category"][category] = stats["by_category"].get(category, 0) + 1
        
        return stats


def main():
    """Main preservation operations"""
    preserver = ArchivePreserver()
    
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║                                                           ║")
    print("║         APOLLO ARCHIVE PRESERVATION SYSTEM                ║")
    print("║                                                           ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print()
    
    # Verify archive
    print("🔍 Verifying archive integrity...")
    verification = preserver.verify_archive()
    print(f"✅ Verified {verification['results']['total_files']} files")
    print(f"   Total size: {verification['results']['total_size']:,} bytes")
    if verification['results']['errors']:
        print(f"⚠️  {len(verification['results']['errors'])} errors found")
    print()
    
    # Create backup
    print("💾 Creating backup...")
    backup = preserver.backup_archive()
    print(f"✅ Backup created: {backup['backup_path']}")
    print(f"   Size: {backup['size']:,} bytes")
    print()
    
    # Get stats
    print("📊 Archive Statistics:")
    stats = preserver.get_stats()
    print(f"   Total files: {stats['total_files']}")
    print(f"   Total size: {stats['total_size']:,} bytes")
    print(f"   Preservations: {stats['preservations']}")
    print(f"   Backups: {stats['backups']}")
    print(f"   Verifications: {stats['verifications']}")
    print()
    print("   By category:")
    for category, count in stats['by_category'].items():
        print(f"     {category}: {count}")
    print()
    
    print("✅ Preservation complete")
    print()
    print("Search. Seek. Find. Keep.")
    print("Always More. Always Better.")
    print("We are Apollo.")


if __name__ == "__main__":
    main()
