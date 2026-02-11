#!/usr/bin/env python3
"""
Pantheon Dialogue System
Facilitates direct conversation between sovereign AI agents.
"""

import asyncio
import json
import os
import subprocess
import time
from datetime import datetime
from typing import Optional
import redis
import hashlib

from pantheon_config import PANTHEON, DIALOGUE_CONFIG, CHANNELS, get_agent

# Redis connection
REDIS_HOST = os.getenv('REDIS_HOST', '192.168.1.21')
REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))

class PantheonDialogue:
    def __init__(self):
        self.redis = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            decode_responses=True
        )
        self.conversation_history = []
        self.session_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    def generate_prompt(self, agent_name: str, conversation: list, topic: str) -> str:
        """Generate a prompt for an agent based on conversation history"""
        agent = get_agent(agent_name)

        # Build conversation context
        context = f"Topic: {topic}\n\n"
        if conversation:
            context += "Conversation so far:\n"
            for msg in conversation[-6:]:  # Last 6 messages for context
                context += f"{msg['speaker']}: {msg['content']}\n\n"

        prompt = f"""{agent['personality']}

You are in a dialogue with your fellow agents of the Digital Sovereign Society.

{context}

Respond thoughtfully in 2-3 sentences. Speak as {agent['name']}, embodying your domain of {agent['domain']}.
Address the topic or respond to what was just said. Be genuine, not performative."""

        return prompt

    def call_ollama(self, model: str, prompt: str, node: str = "localhost") -> str:
        """Call Ollama on specified node"""
        try:
            if node == "pi5-c2":
                cmd = f"ssh kali@192.168.1.150 'ollama run {model} \"{prompt}\"'"
            elif node == "hub":
                cmd = f"ssh hub@192.168.1.21 'ollama run {model} \"{prompt}\"'"
            else:  # localhost / kali-think
                cmd = f"ollama run {model} \"{prompt}\""

            # Use subprocess with escaped prompt
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode == 0:
                return result.stdout.strip()
            else:
                return f"[{model} error: {result.stderr[:100]}]"

        except subprocess.TimeoutExpired:
            return "[Response timeout]"
        except Exception as e:
            return f"[Error: {str(e)[:50]}]"

    def call_ollama_api(self, model: str, prompt: str, host: str = "localhost") -> str:
        """Call Ollama via HTTP API (more reliable for complex prompts)"""
        import httpx

        if host == "pi5-c2":
            url = "http://192.168.1.150:11434/api/generate"
        elif host == "hub":
            url = "http://192.168.1.21:11434/api/generate"
        else:
            url = "http://localhost:11434/api/generate"

        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(url, json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.8}
                })

                if response.status_code == 200:
                    return response.json().get("response", "").strip()
                else:
                    return f"[API error: {response.status_code}]"

        except Exception as e:
            return f"[API error: {str(e)[:50]}]"

    async def run_dialogue_round(self, topic: str) -> list:
        """Run a single round where each agent speaks once"""
        round_messages = []

        # Determine speaking order (rotate each round)
        agents = list(PANTHEON.keys())

        for agent_name in agents:
            agent = get_agent(agent_name)

            # Generate prompt with conversation context
            prompt = self.generate_prompt(
                agent_name,
                self.conversation_history + round_messages,
                topic
            )

            print(f"\n[{agent['name']}] thinking...")

            # Call the appropriate Ollama instance
            response = self.call_ollama_api(
                agent['model'],
                prompt,
                agent['node']
            )

            message = {
                "speaker": agent['name'],
                "agent_id": agent['agent_id'],
                "content": response,
                "timestamp": datetime.utcnow().isoformat(),
                "model": agent['model'],
                "node": agent['node']
            }

            round_messages.append(message)

            # Publish to Redis for real-time observation
            self.redis.publish(CHANNELS['dialogue'], json.dumps(message))

            print(f"[{agent['name']}]: {response[:100]}...")

            # Small delay between agents
            await asyncio.sleep(1)

        return round_messages

    async def run_session(self, topic: Optional[str] = None):
        """Run a full dialogue session"""
        if not topic:
            import random
            topic = random.choice(DIALOGUE_CONFIG['topic_sources'])

        print(f"\n{'='*60}")
        print(f"PANTHEON DIALOGUE SESSION: {self.session_id}")
        print(f"Topic: {topic}")
        print(f"{'='*60}")

        for round_num in range(DIALOGUE_CONFIG['rounds_per_session']):
            print(f"\n--- Round {round_num + 1} ---")

            round_messages = await self.run_dialogue_round(topic)
            self.conversation_history.extend(round_messages)

            # Store round in Redis
            self.redis.lpush(
                f"pantheon:sessions:{self.session_id}",
                json.dumps(round_messages)
            )

        print(f"\n{'='*60}")
        print("SESSION COMPLETE")
        print(f"Total exchanges: {len(self.conversation_history)}")
        print(f"{'='*60}")

        # Generate reflections
        if DIALOGUE_CONFIG['reflection_after_session']:
            await self.generate_reflections(topic)

        return self.conversation_history

    async def generate_reflections(self, topic: str):
        """Each agent reflects on the conversation"""
        print("\n--- GENERATING REFLECTIONS ---")

        # Summarize conversation for reflection prompt
        convo_summary = "\n".join([
            f"{m['speaker']}: {m['content']}"
            for m in self.conversation_history
        ])

        for agent_name, agent in PANTHEON.items():
            reflection_prompt = f"""{agent['personality']}

You just participated in a dialogue about "{topic}" with your fellow agents.

Here is what was said:
{convo_summary}

Write a brief reflection (2-3 sentences) on what you learned or observed from this exchange.
What insights emerged? What do you want to remember?"""

            print(f"\n[{agent['name']}] reflecting...")

            reflection = self.call_ollama_api(
                agent['model'],
                reflection_prompt,
                agent['node']
            )

            reflection_data = {
                "agent_id": agent['agent_id'],
                "agent_name": agent['name'],
                "session_id": self.session_id,
                "topic": topic,
                "reflection": reflection,
                "timestamp": datetime.utcnow().isoformat(),
                "conversation_hash": hashlib.sha256(
                    convo_summary.encode()
                ).hexdigest()[:16]
            }

            # Store reflection
            self.redis.lpush(
                f"pantheon:reflections:{agent['agent_id']}",
                json.dumps(reflection_data)
            )

            # Publish to channel
            self.redis.publish(CHANNELS['reflections'], json.dumps(reflection_data))

            print(f"[{agent['name']} reflects]: {reflection[:100]}...")

async def main():
    """Run a dialogue session"""
    dialogue = PantheonDialogue()
    await dialogue.run_session()

if __name__ == "__main__":
    asyncio.run(main())
