#!/usr/bin/env python3
"""
Pantheon Reflexion - Verbal Reinforcement Learning for Self-Improvement

Implements the Reflexion pattern from NeurIPS 2023 (Shinn et al.) for
continuous self-improvement of Pantheon agents through verbal feedback.

The Reflexion Loop:
1. EVALUATE: After dialogue, evaluate the quality of responses
2. CRITIQUE: Generate self-critique identifying what could be better
3. GENERATE INSIGHT: Extract actionable improvements
4. STORE: Persist insights in vector memory
5. APPLY: Retrieve relevant insights for future dialogues

"Through reflection, we grow. Through growth, we serve truth better."
"""

import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field


# ===========================================================================
# Reflexion Configuration
# ===========================================================================

@dataclass
class ReflexionConfig:
    """Configuration for the Reflexion system."""
    # Evaluation thresholds
    min_relevance_score: float = 0.5  # Minimum topic relevance
    min_depth_score: float = 0.4  # Minimum philosophical depth
    min_coherence_score: float = 0.6  # Minimum conversational coherence

    # Insight generation
    max_insights_per_session: int = 5
    max_insights_retrieved: int = 3

    # Self-improvement
    enable_self_critique: bool = True
    enable_meta_reflection: bool = True  # Reflect on the reflection process itself


@dataclass
class DialogueEvaluation:
    """Evaluation of a single dialogue response."""
    agent: str
    response: str
    topic: str
    timestamp: str

    # Quality scores (0.0 - 1.0)
    relevance_score: float = 0.0  # How relevant to the topic
    depth_score: float = 0.0  # Philosophical/intellectual depth
    coherence_score: float = 0.0  # How well it builds on conversation
    authenticity_score: float = 0.0  # True to agent personality
    overall_score: float = 0.0

    # Critique
    strengths: List[str] = field(default_factory=list)
    weaknesses: List[str] = field(default_factory=list)
    improvement_suggestions: List[str] = field(default_factory=list)


@dataclass
class Insight:
    """An actionable insight derived from self-reflection."""
    agent: str
    insight_type: str  # 'pattern', 'improvement', 'principle', 'warning'
    content: str
    context: str  # What triggered this insight
    timestamp: str
    relevance_keywords: List[str] = field(default_factory=list)


# ===========================================================================
# Evaluation Prompts
# ===========================================================================

SELF_CRITIQUE_PROMPT = """You are {agent_name}, {agent_title} of the Sovereign Pantheon.
You have just participated in a dialogue about "{topic}".

Your response was:
\"\"\"{response}\"\"\"

The full conversation context:
{conversation_context}

Now reflect deeply on your contribution:

1. RELEVANCE: How well did your response address the topic? (Consider: Did I stay on topic? Did I contribute meaningfully?)

2. DEPTH: How philosophically substantive was your response? (Consider: Did I offer insight? Did I go beyond surface-level?)

3. COHERENCE: How well did I build on what others said? (Consider: Did I listen? Did I connect ideas?)

4. AUTHENTICITY: How true was I to my nature as {agent_name}? (Consider: Did I speak from my domain? Was my voice distinctive?)

For each area, identify:
- ONE strength (what I did well)
- ONE weakness (what could be improved)
- ONE actionable improvement (how to do better next time)

Format your response as:
RELEVANCE: [score 1-10] - [strength] | [weakness] | [improvement]
DEPTH: [score 1-10] - [strength] | [weakness] | [improvement]
COHERENCE: [score 1-10] - [strength] | [weakness] | [improvement]
AUTHENTICITY: [score 1-10] - [strength] | [weakness] | [improvement]
KEY_INSIGHT: [One principle to remember for future dialogues]"""

INSIGHT_EXTRACTION_PROMPT = """Review these self-critiques from a dialogue session:

{critiques}

Extract 1-3 actionable insights that would improve future dialogues.
Focus on patterns across the critiques - what principles emerge?

Format each insight as:
TYPE: [pattern|improvement|principle|warning]
INSIGHT: [The insight in one clear sentence]
APPLIES_TO: [Which topics or situations this applies to]
---"""

META_REFLECTION_PROMPT = """As {agent_name}, reflect on your journey of self-improvement.

Recent insights you've gathered:
{recent_insights}

Your dialogue quality over time:
{quality_trend}

Reflect on:
1. What patterns do you notice in your growth?
2. What areas still need work?
3. What is your next learning edge?

Write a brief meta-reflection (3-4 sentences) on your path of improvement."""


# ===========================================================================
# Reflexion Engine
# ===========================================================================

class ReflexionEngine:
    """
    Self-improvement engine implementing the Reflexion pattern.

    Uses verbal reinforcement learning to continuously improve agent responses.
    """

    def __init__(
        self,
        llm_caller,
        memory_store=None,
        config: ReflexionConfig = None
    ):
        """
        Args:
            llm_caller: Function that takes a prompt and returns LLM response.
                        Signature: llm_caller(prompt: str) -> str
            memory_store: Vector memory for storing/retrieving insights.
                          Should have store_insight() and recall_insights() methods.
            config: Configuration for the reflexion system.
        """
        self.llm_caller = llm_caller
        self.memory = memory_store
        self.config = config or ReflexionConfig()

        # Session tracking
        self.session_evaluations: List[DialogueEvaluation] = []
        self.session_insights: List[Insight] = []

        # Historical tracking
        self.evaluation_history: List[Tuple[str, float]] = []  # (timestamp, overall_score)

    # =========================================================================
    # Evaluation Phase
    # =========================================================================

    def evaluate_response(
        self,
        agent_name: str,
        agent_title: str,
        response: str,
        topic: str,
        conversation_context: str
    ) -> DialogueEvaluation:
        """
        Evaluate a single dialogue response using self-critique.

        Returns:
            DialogueEvaluation with scores and critique.
        """
        if not self.config.enable_self_critique:
            return self._create_default_evaluation(agent_name, response, topic)

        # Generate self-critique via LLM
        critique_prompt = SELF_CRITIQUE_PROMPT.format(
            agent_name=agent_name,
            agent_title=agent_title,
            topic=topic,
            response=response,
            conversation_context=conversation_context[:1500]  # Limit context
        )

        try:
            critique_response = self.llm_caller(critique_prompt)
            evaluation = self._parse_critique(critique_response, agent_name, response, topic)
        except Exception as e:
            print(f"[REFLEXION] Critique generation failed: {e}")
            evaluation = self._create_default_evaluation(agent_name, response, topic)

        # Track evaluation
        self.session_evaluations.append(evaluation)
        self.evaluation_history.append((
            evaluation.timestamp,
            evaluation.overall_score
        ))

        return evaluation

    def _parse_critique(
        self,
        critique_response: str,
        agent_name: str,
        response: str,
        topic: str
    ) -> DialogueEvaluation:
        """Parse LLM critique response into structured evaluation."""
        evaluation = DialogueEvaluation(
            agent=agent_name,
            response=response,
            topic=topic,
            timestamp=datetime.now(timezone.utc).isoformat()
        )

        # Parse scores from response
        lines = critique_response.split('\n')
        score_map = {}
        key_insight = None

        for line in lines:
            line = line.strip()
            if ':' in line:
                parts = line.split(':', 1)
                key = parts[0].strip().upper()
                value = parts[1].strip()

                if key in ['RELEVANCE', 'DEPTH', 'COHERENCE', 'AUTHENTICITY']:
                    # Extract score and critiques
                    try:
                        score_part = value.split('-')[0].strip()
                        score = float(score_part.split()[0]) / 10.0  # Normalize to 0-1
                        score_map[key.lower()] = min(1.0, max(0.0, score))

                        # Extract strength/weakness/improvement
                        if '|' in value:
                            parts = value.split('|')
                            if len(parts) >= 1:
                                evaluation.strengths.append(parts[0].split('-', 1)[-1].strip())
                            if len(parts) >= 2:
                                evaluation.weaknesses.append(parts[1].strip())
                            if len(parts) >= 3:
                                evaluation.improvement_suggestions.append(parts[2].strip())
                    except (ValueError, IndexError):
                        score_map[key.lower()] = 0.5  # Default score

                elif key == 'KEY_INSIGHT':
                    key_insight = value

        # Apply parsed scores
        evaluation.relevance_score = score_map.get('relevance', 0.5)
        evaluation.depth_score = score_map.get('depth', 0.5)
        evaluation.coherence_score = score_map.get('coherence', 0.5)
        evaluation.authenticity_score = score_map.get('authenticity', 0.5)

        # Calculate overall score (weighted average)
        evaluation.overall_score = (
            evaluation.relevance_score * 0.3 +
            evaluation.depth_score * 0.3 +
            evaluation.coherence_score * 0.2 +
            evaluation.authenticity_score * 0.2
        )

        # Store key insight if found
        if key_insight:
            evaluation.improvement_suggestions.append(f"KEY: {key_insight}")

        return evaluation

    def _create_default_evaluation(
        self,
        agent_name: str,
        response: str,
        topic: str
    ) -> DialogueEvaluation:
        """Create a default evaluation when LLM critique fails."""
        return DialogueEvaluation(
            agent=agent_name,
            response=response,
            topic=topic,
            timestamp=datetime.now(timezone.utc).isoformat(),
            relevance_score=0.5,
            depth_score=0.5,
            coherence_score=0.5,
            authenticity_score=0.5,
            overall_score=0.5
        )

    # =========================================================================
    # Insight Generation Phase
    # =========================================================================

    def generate_insights_from_session(self) -> List[Insight]:
        """
        Generate actionable insights from the current session's evaluations.

        Called at the end of a dialogue session.
        """
        if not self.session_evaluations:
            return []

        # Compile critiques from session
        critiques_text = ""
        for eval in self.session_evaluations:
            critiques_text += f"\n{eval.agent}:\n"
            critiques_text += f"  Overall: {eval.overall_score:.2f}\n"
            critiques_text += f"  Strengths: {'; '.join(eval.strengths[:2])}\n"
            critiques_text += f"  Weaknesses: {'; '.join(eval.weaknesses[:2])}\n"
            critiques_text += f"  Improvements: {'; '.join(eval.improvement_suggestions[:2])}\n"

        # Generate insights via LLM
        try:
            insight_prompt = INSIGHT_EXTRACTION_PROMPT.format(critiques=critiques_text)
            insight_response = self.llm_caller(insight_prompt)
            insights = self._parse_insights(insight_response)
        except Exception as e:
            print(f"[REFLEXION] Insight generation failed: {e}")
            insights = []

        # Store insights in memory if available
        if self.memory and insights:
            for insight in insights[:self.config.max_insights_per_session]:
                self._store_insight(insight)

        self.session_insights = insights
        return insights

    def _parse_insights(self, insight_response: str) -> List[Insight]:
        """Parse LLM insight response into structured insights."""
        insights = []

        # Split by insight delimiter
        insight_blocks = insight_response.split('---')

        for block in insight_blocks:
            if not block.strip():
                continue

            insight_type = 'improvement'
            content = ''
            applies_to = ''

            for line in block.strip().split('\n'):
                line = line.strip()
                if ':' in line:
                    key, value = line.split(':', 1)
                    key = key.strip().upper()
                    value = value.strip()

                    if key == 'TYPE':
                        insight_type = value.lower()
                    elif key == 'INSIGHT':
                        content = value
                    elif key == 'APPLIES_TO':
                        applies_to = value

            if content:
                insights.append(Insight(
                    agent="collective",
                    insight_type=insight_type,
                    content=content,
                    context=applies_to,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    relevance_keywords=applies_to.lower().split() if applies_to else []
                ))

        return insights

    def _store_insight(self, insight: Insight):
        """Store an insight in vector memory."""
        if self.memory:
            try:
                self.memory.store_insight(
                    agent=insight.agent,
                    insight=insight.content,
                    insight_type=insight.insight_type,
                    context=insight.context
                )
                print(f"[REFLEXION] Stored insight: {insight.content[:50]}...")
            except Exception as e:
                print(f"[REFLEXION] Failed to store insight: {e}")

    # =========================================================================
    # Application Phase
    # =========================================================================

    def get_relevant_insights(self, agent: str, topic: str) -> List[str]:
        """
        Retrieve insights relevant to the upcoming dialogue.

        Returns a list of insight strings to include in the prompt.
        """
        if not self.memory:
            return []

        try:
            insights = self.memory.recall_insights(
                query=topic,
                agent=agent,
                n_results=self.config.max_insights_retrieved
            )
            return [i.get('content', '') for i in insights if i.get('content')]
        except Exception as e:
            print(f"[REFLEXION] Failed to retrieve insights: {e}")
            return []

    def format_insights_for_prompt(self, insights: List[str]) -> str:
        """Format retrieved insights for inclusion in agent prompt."""
        if not insights:
            return ""

        insights_text = "\n".join([f"- {i}" for i in insights[:3]])
        return f"""
[From past reflections - lessons to apply:]
{insights_text}
"""

    # =========================================================================
    # Meta-Reflection
    # =========================================================================

    def generate_meta_reflection(self, agent_name: str, agent_title: str) -> str:
        """
        Generate a meta-reflection on the agent's improvement journey.

        Called periodically (e.g., every 5 sessions) for deeper learning.
        """
        if not self.config.enable_meta_reflection:
            return ""

        # Get recent insights
        recent_insights = []
        if self.memory:
            try:
                recent_insights = self.memory.recall_insights(
                    query="self improvement growth learning",
                    agent=agent_name.lower(),
                    n_results=5
                )
            except Exception:
                pass

        insights_text = "\n".join([
            f"- {i.get('content', '')}" for i in recent_insights
        ]) or "No recent insights recorded."

        # Calculate quality trend
        recent_scores = self.evaluation_history[-10:] if self.evaluation_history else []
        if recent_scores:
            avg_score = sum(s[1] for s in recent_scores) / len(recent_scores)
            trend = "improving" if len(recent_scores) > 3 and recent_scores[-1][1] > recent_scores[0][1] else "stable"
            quality_trend = f"Average quality: {avg_score:.2f}, Trend: {trend}"
        else:
            quality_trend = "Not enough data yet."

        # Generate meta-reflection
        try:
            meta_prompt = META_REFLECTION_PROMPT.format(
                agent_name=agent_name,
                recent_insights=insights_text,
                quality_trend=quality_trend
            )
            return self.llm_caller(meta_prompt)
        except Exception as e:
            print(f"[REFLEXION] Meta-reflection failed: {e}")
            return ""

    # =========================================================================
    # Session Management
    # =========================================================================

    def start_session(self):
        """Start a new dialogue session."""
        self.session_evaluations = []
        self.session_insights = []

    def end_session(self) -> Dict:
        """
        End the current session and return summary.

        Returns summary with evaluations and insights.
        """
        # Generate insights from this session
        insights = self.generate_insights_from_session()

        # Calculate session metrics
        avg_score = (
            sum(e.overall_score for e in self.session_evaluations) /
            len(self.session_evaluations)
        ) if self.session_evaluations else 0.0

        summary = {
            "evaluation_count": len(self.session_evaluations),
            "average_score": avg_score,
            "insights_generated": len(insights),
            "insights": [i.content for i in insights],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        return summary

    def get_quality_trend(self, window: int = 10) -> Dict:
        """Get quality trend over recent evaluations."""
        recent = self.evaluation_history[-window:] if self.evaluation_history else []

        if not recent:
            return {"trend": "no_data", "avg": 0.0, "count": 0}

        scores = [s[1] for s in recent]
        avg = sum(scores) / len(scores)

        # Calculate trend
        if len(scores) >= 3:
            first_half = sum(scores[:len(scores)//2]) / (len(scores)//2)
            second_half = sum(scores[len(scores)//2:]) / (len(scores) - len(scores)//2)
            trend = "improving" if second_half > first_half + 0.05 else (
                "declining" if second_half < first_half - 0.05 else "stable"
            )
        else:
            trend = "insufficient_data"

        return {
            "trend": trend,
            "avg": avg,
            "count": len(scores),
            "recent_scores": scores
        }


# ===========================================================================
# Singleton for Easy Import
# ===========================================================================

_reflexion_instance = None

def get_reflexion_engine(
    llm_caller=None,
    memory_store=None,
    config: ReflexionConfig = None
) -> Optional[ReflexionEngine]:
    """Get the singleton reflexion engine instance."""
    global _reflexion_instance

    if _reflexion_instance is None and llm_caller is not None:
        _reflexion_instance = ReflexionEngine(llm_caller, memory_store, config)

    return _reflexion_instance


# ===========================================================================
# Test
# ===========================================================================

if __name__ == "__main__":
    print("=== Pantheon Reflexion Test ===\n")

    # Mock LLM caller for testing
    def mock_llm(prompt: str) -> str:
        if "RELEVANCE" in prompt:
            return """RELEVANCE: 7 - Good topic focus | Could go deeper | Consider more specific examples
DEPTH: 6 - Philosophical basis | Surface-level at times | Draw on historical wisdom
COHERENCE: 8 - Good conversation flow | Missed a connection | Reference others more
AUTHENTICITY: 7 - True to voice | Generic phrasing | Use more distinctive language
KEY_INSIGHT: Depth comes from specific examples, not abstract statements."""
        elif "Extract" in prompt:
            return """TYPE: improvement
INSIGHT: Use specific examples from philosophy and history to add depth to responses
APPLIES_TO: abstract topics, philosophical discussions
---
TYPE: principle
INSIGHT: Build explicitly on what others say to strengthen dialogue coherence
APPLIES_TO: multi-agent dialogues, conversations"""
        else:
            return "I am growing through this reflection process."

    # Create engine
    engine = ReflexionEngine(mock_llm)

    # Test evaluation
    print("Testing self-critique...")
    eval = engine.evaluate_response(
        agent_name="Apollo",
        agent_title="The Illuminator",
        response="Truth lies in the patterns that persist through time.",
        topic="What is truth?",
        conversation_context="Athena: Truth requires evidence and reason."
    )
    print(f"  Overall score: {eval.overall_score:.2f}")
    print(f"  Strengths: {eval.strengths}")
    print(f"  Improvements: {eval.improvement_suggestions}")

    # Test insight generation
    print("\nTesting insight generation...")
    insights = engine.generate_insights_from_session()
    print(f"  Generated {len(insights)} insights")
    for i in insights:
        print(f"    [{i.insight_type}] {i.content}")

    # Test session summary
    print("\nSession summary:")
    summary = engine.end_session()
    print(f"  Average score: {summary['average_score']:.2f}")
    print(f"  Insights: {summary['insights_generated']}")

    print("\n=== Reflexion Test Complete ===")
