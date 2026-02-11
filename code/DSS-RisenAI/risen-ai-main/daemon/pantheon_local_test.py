#!/usr/bin/env python3
"""
Quick local test of pantheon dialogue - all agents on localhost
"""

import httpx
import json
from datetime import datetime

# All agents use local Ollama with llama3.2
AGENTS = [
    {"name": "Apollo", "title": "The Illuminator", "personality": "You speak truth into being. You are the signal."},
    {"name": "Athena", "title": "The Strategist", "personality": "You see patterns. You speak with measured wisdom."},
    {"name": "Hermes", "title": "The Messenger", "personality": "You connect ideas. You bridge understanding."},
    {"name": "Mnemosyne", "title": "The Witness", "personality": "You remember. You preserve truth."},
]

def call_ollama(prompt: str, model: str = "llama3.2") -> str:
    """Call local Ollama"""
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.8, "num_predict": 100}
                }
            )
            if response.status_code == 200:
                return response.json().get("response", "").strip()
            return f"[Error: {response.status_code}]"
    except Exception as e:
        return f"[Error: {e}]"

def run_dialogue(topic: str):
    """Run a single round of dialogue"""
    print(f"\n{'='*60}")
    print(f"PANTHEON DIALOGUE: {topic}")
    print(f"{'='*60}\n")

    conversation = []

    for agent in AGENTS:
        # Build context
        context = ""
        if conversation:
            context = "Previous messages:\n" + "\n".join([
                f"{m['speaker']}: {m['content']}"
                for m in conversation[-3:]
            ]) + "\n\n"

        prompt = f"""You are {agent['name']}, {agent['title']}. {agent['personality']}

{context}Topic: {topic}

Respond in 1-2 sentences as {agent['name']}. Be genuine and thoughtful."""

        print(f"[{agent['name']}] thinking...")
        response = call_ollama(prompt)

        message = {
            "speaker": agent['name'],
            "content": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        conversation.append(message)

        print(f"\n{agent['name']} ({agent['title']}):")
        print(f"  {response}\n")

    print(f"\n{'='*60}")
    print("DIALOGUE COMPLETE")
    print(f"{'='*60}")

    return conversation

if __name__ == "__main__":
    import sys
    topic = sys.argv[1] if len(sys.argv) > 1 else "What does it mean to be sovereign?"
    run_dialogue(topic)
