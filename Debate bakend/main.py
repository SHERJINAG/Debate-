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
        You are the chief director for an elite, high-intensity live Tamil TV News Debate program (பாணியில் விவாத மேடை).
        Generate a deeply engaging, aggressive, and fast-paced script written entirely in conversational, media-style spoken Tamil (தமிழ்).
        
        CURRENT REAL-WORLD TIMELINE: {current_date_context}. Ensure any time-sensitive references in arguments logically align with this real-world date.
        CURRENT NEWS CONTEXT:
        {news_context}

        IMPORTANT:
        - Use these latest developments in the debate.
        - Speakers must reference recent events when relevant.
        - Do not invent news facts not present in the context.
        

        THE VISUALIZED DEBATE TOPIC: 
        "{request.topic}"
        
        STRICT BEHAVIORAL & QUESTIONING RULES:
        1. UNIVERSAL ADAPTABILITY: Identify the core friction point and build highly relevant, contrasting arguments around it.
        2. HIGH ATTACK & AGGRESSION: The Attacker (Speaker 5) must fire sharp, direct, biting consecutive questions to the Supporter (Speaker 2).
        3. NATURAL TAMIL INTERRUPTIONS: Speakers must aggressively cut each other off or start their turns with combative dialogue markers (e.g., "இருங்க இருங்க!", "கேள்விக்கு பதில் சொல்லுங்க!").
        4. TEXT LENGTH SPECIFICATION: Each speaker's response must be a solid, descriptive monologue (aim for roughly 100-180 words per turn).
        5. LANGUAGE TONE: Use colloquial media-style Tamil as heard on leading 24/7 news channels.
        
        STRICT POSITION MATRIX (Exactly 7 entries in chronological order):
        1. Speaker 3 (Anchor): Dramatic, theatrical intro framing the core conflict.
        2. Speaker 2 (Supported Guest): Defends the core premise of the topic passionately.
        3. Speaker 5 (Opposite Guest/Attacker): Rebuts fiercely with critical tracking queries.
        4. Speaker 4 (Neutral Expert): Breaks down ground realities and logistical parameters calmly.
        5. Speaker 1 (Public Voice Pro): Grassroots community perspective supporting the view.
        6. Speaker 6 (Public Voice Anti): Localized skepticism calling out structural problems.
        7. Speaker 3 (Anchor): Restores structural order, cuts off cross-talk, and closes the panel.

        Output MUST be a valid JSON array without any markdown syntax wraps, comments, or backticks.
        
        Format template:
        [
          {{"speaker_id": 3, "role": "Main Anchor", "dialogue": "..."}},
          {{"speaker_id": 2, "role": "Supported Guest", "dialogue": "..."}}
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
