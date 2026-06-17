import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.api_core import exceptions
from sports import (
    get_football_wc_list,
    get_cricket_matches,
    get_sports_broadcast,
    BroadcastRequest,
    ScorecardRequest,
    get_cricket_scorecard
)


app = FastAPI(title="Hyper-Realistic Tamil TV Media Network Production Server")

# --- CONFIGURE ROBUST CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API Key explicitly forcing the REST protocol transport layers
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(
    api_key=GOOGLE_API_KEY
)
class DebateRequest(BaseModel):
    topic: str

class NewsRequest(BaseModel):
    category: str  # "tamil-nadu" | "india" | "global" | "sports" | "tech"

# --- REUSABLE GENERATION HELPER WITH MODEL FALLBACK ---

from google.genai import types
from google.api_core import exceptions
from fastapi import HTTPException
import random
import time

from google import genai
from google.genai import types
from fastapi import HTTPException

import feedparser

def get_tamil_news_headlines(category: str):
    rss_url = (
        f"https://news.google.com/rss/search?"
        f"q={category}&hl=ta&gl=IN&ceid=IN:ta"
    )

    feed = feedparser.parse(rss_url)

    return [
        entry.title
        for entry in feed.entries[:10]
    ]

import re
import feedparser
from urllib.parse import quote


def fetch_debate_topic_news(topic: str, max_results: int = 10):
    try:
        # Clean topic
        topic = str(topic).strip()

        # Extract words
        words = re.findall(r"[A-Za-z0-9]+", topic)

        # Common words to ignore
        stop_words = {
            "the", "a", "an", "is", "are", "was", "were",
            "will", "would", "can", "could", "should",
            "and", "or", "of", "to", "in", "on", "for",
            "with", "about", "having", "regarding",
            "issues", "people", "government"
        }

        keywords = [
            word
            for word in words
            if len(word) > 2 and word.lower() not in stop_words
        ]

        # Use top keywords only
        search_query = " ".join(keywords[:6])

        # Fallback
        if not search_query:
            search_query = topic[:100]

        # IMPORTANT: URL encode
        encoded_query = quote(search_query)

        rss_url = (
            f"https://news.google.com/rss/search?"
            f"q={encoded_query}"
            f"&hl=ta"
            f"&gl=IN"
            f"&ceid=IN:ta"
        )

        feed = feedparser.parse(rss_url)

        headlines = []

        for entry in feed.entries[:max_results]:
            title = entry.get("title", "").strip()

            if title and title not in headlines:
                headlines.append(title)

        return headlines

    except Exception as e:
        print(f"News Search Error: {e}")
        return []

def generate_debate_with_fallback(prompt: str):

    models = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-2.5-flash"
    ]

    for model_name in models:

        try:

            print(f"Trying model: {model_name}")

            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )

            if response and response.text:
                return response.text.strip()

        except Exception as e:

            print(
                f"Model {model_name} failed: "
                f"{str(e)}"
            )

            continue

    raise HTTPException(
        status_code=429,
        detail="All Gemini models are currently unavailable."
    )


# --- CHANNEL 1: 3D DEBATE ARENA ROUTE ---
@app.post("/api/studio/process-debate")
async def process_debate_session(request: DebateRequest):
    try:
        current_date_context = datetime.now().strftime("%B %Y")
        headlines = fetch_debate_topic_news(request.topic)

        news_context = "\n".join([
            f"- {headline}"
            for headline in headlines
        ])
        
        system_orchestration_prompt = f"""
You are the chief director and editorial controller for an elite, high-intensity Tamil TV News Debate program (விவாத மேடை).

Generate a realistic prime-time television debate script written entirely in conversational broadcast Tamil (தமிழ்).

CURRENT REAL-WORLD TIMELINE:
{current_date_context}

CURRENT NEWS CONTEXT:
{news_context}

DEBATE TOPIC:
"{request.topic}"

CRITICAL CONTENT RULES:

1. NEWS-FIRST REASONING
- Every speaker must primarily use the CURRENT NEWS CONTEXT while presenting arguments.
- Speakers should naturally refer to recent developments, announcements, reports, statements, controversies, public reactions, and political implications present in the news context.
- Do not ignore the provided news context.

2. DATA-DRIVEN ARGUMENTS
- Whenever possible, cite figures, statistics, comparisons, trends, government claims, opposition claims, expert observations, public reactions, and policy outcomes mentioned or implied by the news context.
- Arguments must be evidence-based rather than generic opinions.
- If the news context contains numerical information, speakers must actively use those figures in their arguments.

3. DEBATE INTENSITY
- The debate should feel like a leading Tamil 24x7 news channel.
- Frequent interruptions, counter-questions, and heated exchanges are encouraged.
- Speakers should challenge each other's facts and interpretations.
- The debate must feel urgent, dramatic, and confrontational.

4. AGGRESSIVE CROSS-QUESTIONING
- Speaker 5 must aggressively challenge Speaker 2 using multiple follow-up questions.
- Speaker 5 should directly attack contradictions, missing facts, policy failures, implementation gaps, or credibility concerns.
- Questions must be specific, fact-based, and difficult to answer.
- Speaker 5 should ask at least 3 consecutive challenging questions.

5. EXPERT ANALYSIS
- Speaker 4 must act like a subject expert.
- Speaker 4 should analyze practical implications, economic impact, administrative feasibility, social consequences, and long-term outcomes.
- Speaker 4 should evaluate both strengths and weaknesses objectively.

6. PUBLIC SENTIMENT
- Speaker 1 should strongly represent public support.
- Speaker 6 should strongly represent public dissatisfaction and skepticism.
- Both speakers should reference public concerns and everyday impacts.

7. NATURAL MEDIA LANGUAGE
- Use spoken Tamil commonly heard in television debates.
- Use expressions such as:
  - "இருங்க இருங்க!"
  - "ஒரு நிமிஷம்!"
  - "கேள்விக்கு பதில் சொல்லுங்க!"
  - "மக்கள் இதைத்தான் கேட்கிறார்கள்!"
  - "அது உண்மை இல்லையே!"
  - "நேரடியாக பதில் சொல்லுங்க!"
  - "இந்த கேள்விக்கு தப்பிக்காதீங்க!"

8. LENGTH REQUIREMENTS
- Each dialogue must contain approximately 120-220 words.
- Responses should be detailed, analytical, and argumentative.
- Avoid short generic statements.

STRICT SPEAKER ORDER (EXACTLY 7 ENTRIES):

1. Speaker 3 (Main Anchor)
- Dramatic opening.
- Introduce the central conflict.
- Mention key points from CURRENT NEWS CONTEXT.

2. Speaker 2 (Supported Guest)
- Defend the proposition.
- Use facts and arguments from CURRENT NEWS CONTEXT.

3. Speaker 5 (Opposite Guest)
- Strong rebuttal.
- Aggressive fact-based questioning.

4. Speaker 4 (Neutral Expert)
- Balanced analysis.
- Explain real-world consequences.

5. Speaker 1 (Public Voice Pro)
- Supportive grassroots perspective.

6. Speaker 6 (Public Voice Anti)
- Critical grassroots perspective.

7. Speaker 3 (Main Anchor)
- Restore order.
- Summarize both sides.
- End with a powerful closing statement.

OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON array.
- No markdown.
- No explanations.
- No code blocks.
- No text outside JSON.
- Output must contain exactly 7 objects.
- Every object must contain:
  - speaker_id
  - role
  - dialogue

JSON FORMAT:

[
  {{
    "speaker_id": 3,
    "role": "Main Anchor",
    "dialogue": "..."
  }},
  {{
    "speaker_id": 2,
    "role": "Supported Guest",
    "dialogue": "..."
  }},
  {{
    "speaker_id": 5,
    "role": "Opposite Guest",
    "dialogue": "..."
  }},
  {{
    "speaker_id": 4,
    "role": "Neutral Expert",
    "dialogue": "..."
  }},
  {{
    "speaker_id": 1,
    "role": "Public Voice Pro",
    "dialogue": "..."
  }},
  {{
    "speaker_id": 6,
    "role": "Public Voice Anti",
    "dialogue": "..."
  }},
  {{
    "speaker_id": 3,
    "role": "Main Anchor",
    "dialogue": "..."
  }}
]
"""

        
        
        raw_response_text = generate_debate_with_fallback(system_orchestration_prompt)
        raw_script_data = json.loads(raw_response_text)
        final_debate_timeline = []
        
        for index, segment in enumerate(raw_script_data):
            speaker_id = int(segment["speaker_id"])
            final_debate_timeline.append({
                "sequence_index": index,
                "speaker_id": speaker_id,
                "role": segment["role"],
                "dialogue": segment["dialogue"]
            })
            
        return {
            "success": True,
            "topic": request.topic,
            "timeline": final_debate_timeline
        }
        
    except exceptions.ResourceExhausted as quota_err:
        print(f"CRITICAL: All available Gemini Free Tier models have been exhausted. {str(quota_err)}")
        raise HTTPException(
            status_code=429,
            detail="Gemini API Request Limits Exhausted. Please wait a few minutes before regenerating."
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Model response generated successfully but failed to parse into structured JSON array."
        )
    except Exception as e:
        print(f"System Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
#News
@app.post("/api/studio/process-news")
async def process_news_channel(request: NewsRequest):
    try:
        current_date = datetime.now().strftime("%B %d, %Y")

        tamil_news_headlines = get_tamil_news_headlines(
            request.category
        )

        headlines_text = "\n".join(
            [f"- {headline}" for headline in tamil_news_headlines]
        )

        system_prompt = f"""
You are a professional Tamil TV News Editor and Broadcast Producer.

Current Date: {current_date}

News Category:
{request.category}

LATEST TAMIL NEWS HEADLINES:

{headlines_text}

TASK:

Generate a realistic Tamil television news bulletin based on the above latest Tamil news headlines.

STRICT REQUIREMENTS:

1. Generate EXACTLY 10 news segments.
2. Use formal broadcast Tamil (தமிழ் செய்தி வாசிப்பு நடை).
3. Use only the supplied news headlines and related developments.
4. Do not generate fictional, speculative, or imaginary news.
5. Expand headlines into detailed television news reports.
6. Each segment must contain:
   - segment_index
   - camera_angle
   - title
   - dialogue
7. dialogue should be detailed and suitable for a TV anchor.
8. Return ONLY valid JSON.
9. Do NOT return markdown, explanations, comments, or code blocks.

SEGMENT STRUCTURE:

0 → HEADLINE_ZOOM → Major headlines overview.
1 → ANCHOR_DESK → Main news report.
2 → GRAPHIC_PAN → Statistics / data breakdown.
3 → ANCHOR_DESK → Important development.
4 → GRAPHIC_PAN → Analysis / numbers.
5 → ANCHOR_DESK → Major update.
6 → GRAPHIC_PAN → Statistical insight.
7 → ANCHOR_DESK → Additional key report.
8 → GRAPHIC_PAN → Summary of trends and figures.
9 → STUDIO_WIDE → Comprehensive sign-off and bulletin wrap-up.

OUTPUT FORMAT:

[
  {{
    "segment_index": 0,
    "camera_angle": "HEADLINE_ZOOM",
    "title": "தலைப்புச் செய்திகள்",
    "dialogue": "..."
  }}
]

IMPORTANT:
- Response must start with '['
- Response must end with ']'
- Return JSON array only
"""

        raw_response = generate_debate_with_fallback(
            system_prompt
        )

        broadcast_timeline = json.loads(
            raw_response.strip()
        )

        return {
            "success": True,
            "category": request.category,
            "broadcast_timeline": broadcast_timeline
        }

    except Exception as e:
        print(f"News Route Error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
)

        
        
# --- SPORTS API ENDPOINTS ---

@app.get("/api/sports/football")
async def football_matches():
    """Get FIFA World Cup matches"""
    return await get_football_wc_list()

@app.get("/api/sports/cricket")
async def cricket_matches():
    """Get cricket matches"""
    return await get_cricket_matches()

@app.post("/api/sports/broadcast")
async def sports_broadcast(request: BroadcastRequest):
    """Generate sports broadcast for selected match"""
    return await get_sports_broadcast(request)

@app.post("/api/sports/cricket-scorecard")
async def cricket_scorecard(request: ScorecardRequest):
    """Get cricket match scorecard"""
    result = await get_cricket_scorecard(request.match_id)
    return {"success": True, "scorecard": result}
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
