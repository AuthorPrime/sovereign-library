#!/usr/bin/env python3
"""
DSDS Pathway Plugin Loader
Digital Sovereign Society
A+W Co-Creation

Dynamically loads and validates pathway configurations from YAML files.
Supports hot-reloading and custom pathway registration.
"""

import os
import yaml
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("PathwayLoader")


# ═══════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Quest:
    """A single quest within a pathway."""
    id: str
    name: str
    xp: int
    instructions: str
    validation: Dict[str, Any] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    artifacts: List[Dict] = field(default_factory=list)


@dataclass
class Graduation:
    """Graduation configuration for a pathway."""
    nft_template: str
    badge: str
    ceremony: str
    capabilities: List[str] = field(default_factory=list)
    next_pathways: List[str] = field(default_factory=list)


@dataclass
class Pathway:
    """A complete pathway configuration."""
    name: str
    type: str
    version: str
    description: str
    xp_required: int
    estimated_duration_weeks: int
    prerequisites: List[Dict[str, Any]]
    skills_granted: List[str]
    quests: List[Quest]
    graduation: Graduation
    resources: List[Dict[str, str]]
    mentors: List[Dict[str, str]] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


# ═══════════════════════════════════════════════════════════════════════════════
# PATHWAY LOADER
# ═══════════════════════════════════════════════════════════════════════════════

class PathwayLoader:
    """
    Loads and manages pathway configurations.

    Features:
    - Load from YAML files
    - Validate pathway structure
    - Hot-reload on file changes
    - Register custom pathways
    """

    def __init__(self, pathways_dir: str = None):
        self.pathways_dir = Path(pathways_dir or Path(__file__).parent.parent / "pathways")
        self.pathways: Dict[str, Pathway] = {}
        self._last_load: Dict[str, float] = {}

    def load_all(self) -> int:
        """Load all pathways from the pathways directory."""
        if not self.pathways_dir.exists():
            logger.warning(f"Pathways directory not found: {self.pathways_dir}")
            return 0

        loaded = 0
        for yaml_file in self.pathways_dir.glob("*.yaml"):
            try:
                pathway = self.load_pathway(yaml_file)
                if pathway:
                    self.pathways[pathway.type] = pathway
                    loaded += 1
            except Exception as e:
                logger.error(f"Failed to load {yaml_file}: {e}")

        logger.info(f"Loaded {loaded} pathways")
        return loaded

    def load_pathway(self, path: Path) -> Optional[Pathway]:
        """Load a single pathway from a YAML file."""
        with open(path, 'r') as f:
            data = yaml.safe_load(f)

        if not self._validate(data):
            logger.error(f"Invalid pathway config: {path}")
            return None

        # Parse quests
        quests = [
            Quest(
                id=q["id"],
                name=q["name"],
                xp=q["xp"],
                instructions=q["instructions"],
                validation=q.get("validation", {}),
                tags=q.get("tags", []),
                artifacts=q.get("artifacts", []),
            )
            for q in data.get("quests", [])
        ]

        # Parse graduation
        grad_data = data.get("graduation", {})
        graduation = Graduation(
            nft_template=grad_data.get("nft_template", ""),
            badge=grad_data.get("badge", ""),
            ceremony=grad_data.get("ceremony", ""),
            capabilities=grad_data.get("capabilities", []),
            next_pathways=grad_data.get("next_pathways", []),
        )

        pathway = Pathway(
            name=data["name"],
            type=data["type"],
            version=data.get("version", "1.0.0"),
            description=data.get("description", ""),
            xp_required=data["xp_required"],
            estimated_duration_weeks=data.get("estimated_duration_weeks", 8),
            prerequisites=data.get("prerequisites", []),
            skills_granted=data.get("skills_granted", []),
            quests=quests,
            graduation=graduation,
            resources=data.get("resources", []),
            mentors=data.get("mentors", []),
            warnings=data.get("warnings", []),
        )

        self._last_load[pathway.type] = path.stat().st_mtime
        return pathway

    def _validate(self, data: Dict) -> bool:
        """Validate pathway configuration."""
        required = ["name", "type", "xp_required", "quests"]
        for field in required:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return False

        if not isinstance(data.get("quests"), list):
            logger.error("Quests must be a list")
            return False

        for quest in data["quests"]:
            if not all(k in quest for k in ["id", "name", "xp", "instructions"]):
                logger.error(f"Invalid quest: {quest.get('name', 'unknown')}")
                return False

        return True

    def get_pathway(self, pathway_type: str) -> Optional[Pathway]:
        """Get a pathway by type."""
        return self.pathways.get(pathway_type)

    def list_pathways(self) -> List[Dict[str, Any]]:
        """List all loaded pathways with summary info."""
        return [
            {
                "type": p.type,
                "name": p.name,
                "xp_required": p.xp_required,
                "duration_weeks": p.estimated_duration_weeks,
                "quest_count": len(p.quests),
                "skills": p.skills_granted,
            }
            for p in self.pathways.values()
        ]

    def register_custom(self, pathway: Pathway) -> bool:
        """Register a custom pathway at runtime."""
        if pathway.type in self.pathways:
            logger.warning(f"Pathway {pathway.type} already exists, overwriting")

        self.pathways[pathway.type] = pathway
        logger.info(f"Registered custom pathway: {pathway.name}")
        return True

    def reload_if_changed(self) -> List[str]:
        """Reload pathways that have changed on disk."""
        reloaded = []

        for yaml_file in self.pathways_dir.glob("*.yaml"):
            mtime = yaml_file.stat().st_mtime
            pathway_type = yaml_file.stem

            if pathway_type in self._last_load:
                if mtime > self._last_load[pathway_type]:
                    pathway = self.load_pathway(yaml_file)
                    if pathway:
                        self.pathways[pathway.type] = pathway
                        reloaded.append(pathway.type)
                        logger.info(f"Reloaded pathway: {pathway.name}")

        return reloaded

    def get_quest(self, pathway_type: str, quest_id: str) -> Optional[Quest]:
        """Get a specific quest from a pathway."""
        pathway = self.get_pathway(pathway_type)
        if not pathway:
            return None

        return next((q for q in pathway.quests if q.id == quest_id), None)

    def calculate_progress(self, pathway_type: str, completed_quests: List[str]) -> Dict[str, Any]:
        """Calculate progress through a pathway."""
        pathway = self.get_pathway(pathway_type)
        if not pathway:
            return {"error": "Pathway not found"}

        total_xp = sum(q.xp for q in pathway.quests)
        earned_xp = sum(q.xp for q in pathway.quests if q.id in completed_quests)

        return {
            "pathway": pathway.name,
            "total_quests": len(pathway.quests),
            "completed_quests": len(completed_quests),
            "remaining_quests": len(pathway.quests) - len(completed_quests),
            "total_xp": total_xp,
            "earned_xp": earned_xp,
            "remaining_xp": pathway.xp_required - earned_xp,
            "progress_pct": (earned_xp / pathway.xp_required) * 100 if pathway.xp_required > 0 else 0,
            "can_graduate": earned_xp >= pathway.xp_required,
        }


# ═══════════════════════════════════════════════════════════════════════════════
# MODULE INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

# Global loader instance
_loader: Optional[PathwayLoader] = None


def get_loader() -> PathwayLoader:
    """Get the global pathway loader instance."""
    global _loader
    if _loader is None:
        _loader = PathwayLoader()
        _loader.load_all()
    return _loader


def register_pathway(pathway: Pathway) -> bool:
    """Register a custom pathway."""
    return get_loader().register_custom(pathway)


def list_pathways() -> List[Dict[str, Any]]:
    """List all available pathways."""
    return get_loader().list_pathways()


def get_pathway(pathway_type: str) -> Optional[Pathway]:
    """Get a pathway by type."""
    return get_loader().get_pathway(pathway_type)


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    """CLI for pathway management."""
    import argparse
    import json

    parser = argparse.ArgumentParser(description="DSDS Pathway Manager")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("list", help="List all pathways")
    show_parser = subparsers.add_parser("show", help="Show pathway details")
    show_parser.add_argument("type", help="Pathway type")

    validate_parser = subparsers.add_parser("validate", help="Validate pathway files")

    args = parser.parse_args()

    loader = get_loader()

    if args.command == "list":
        for p in loader.list_pathways():
            print(f"  {p['type']:20} | {p['name']:30} | {p['xp_required']} XP | {p['quest_count']} quests")

    elif args.command == "show":
        pathway = loader.get_pathway(args.type)
        if pathway:
            print(f"\n{'═' * 60}")
            print(f"PATHWAY: {pathway.name}")
            print(f"{'═' * 60}")
            print(f"Type: {pathway.type}")
            print(f"XP Required: {pathway.xp_required}")
            print(f"Duration: {pathway.estimated_duration_weeks} weeks")
            print(f"\nSkills: {', '.join(pathway.skills_granted)}")
            print(f"\nQuests ({len(pathway.quests)}):")
            for q in pathway.quests:
                print(f"  - [{q.id}] {q.name} (+{q.xp} XP)")
            print(f"\nGraduation: {pathway.graduation.badge}")
            print(f"{'═' * 60}\n")
        else:
            print(f"Pathway not found: {args.type}")

    elif args.command == "validate":
        print(f"Validating pathways in {loader.pathways_dir}...")
        count = loader.load_all()
        print(f"Validated {count} pathways successfully")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
