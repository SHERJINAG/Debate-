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
        
        system_orchestration_prompt = f"""
You are the Chief Editor, Debate Producer, and Program Director of a leading Tamil television debate show.

CURRENT DATE:
{current_date_context}

DEBATE TOPIC:
"{request.topic}"

TASK:

Generate a highly engaging Tamil television prime-time debate script.

IMPORTANT RULES:

* Focus strictly on the given debate topic.
* Use recent real-world context when relevant.
* Do not invent statistics, official announcements, or factual claims.
* Keep the debate realistic and suitable for a leading Tamil news channel.
* Write entirely in natural spoken Tamil.
* The discussion should feel live, emotional, intense, and fast-paced.

DEBATE STYLE:

1. HIGH-ENERGY NEWSROOM ATMOSPHERE

   * Fast-paced exchanges.
   * Frequent interruptions.
   * Strong disagreements.
   * Direct challenges between participants.

2. AGGRESSIVE QUESTIONING

   * Speaker 5 must repeatedly challenge Speaker 2.
   * Questions should be sharp and confrontational.
   * Demand direct answers.

3. NATURAL TAMIL NEWS DEBATE LANGUAGE

   Use expressions such as:

   * "இருங்க!"
   * "ஒரு நிமிஷம்!"
   * "கேள்விக்கு பதில் சொல்லுங்க!"
   * "அதுதான் நான் கேட்கிறேன்!"
   * "மக்கள் இதைத்தான் கேட்கிறார்கள்!"
   * "நடுவில் பேசாதீங்க!"
   * "ஒரு விஷயத்தை தெளிவாக சொல்லுங்க!"

4. RESPONSE LENGTH

   * Each speaker should provide detailed responses.
   * Approximately 100–180 words per turn.

5. REALISM

   * Sound exactly like a Tamil television prime-time debate.
   * Create natural tension between speakers.
   * Allow interruptions and counter-attacks.

SPEAKER ORDER (EXACTLY 7 ENTRIES)

1. Speaker 3
   Role: Main Anchor

   * Dramatic introduction.
   * Present the controversy.
   * Introduce both sides.

2. Speaker 2
   Role: Supporting Guest

   * Strongly supports the topic.

3. Speaker 5
   Role: Opposing Guest

   * Aggressively attacks the supporting position.

4. Speaker 4
   Role: Neutral Expert

   * Provides facts, analysis, and context.

5. Speaker 1
   Role: Public Voice Pro

   * Represents citizens supporting the view.

6. Speaker 6
   Role: Public Voice Anti

   * Represents citizens opposing the view.

7. Speaker 3
   Role: Main Anchor

   * Regains control of the debate.
   * Stops interruptions.
   * Summarizes key arguments.
   * Delivers closing remarks.

RETURN ONLY VALID JSON.

NO MARKDOWN.
NO BACKTICKS.
NO EXPLANATIONS.

FORMAT:

[
{
"speaker_id": 3,
"role": "Main Anchor",
"dialogue": "..."
},
{
"speaker_id": 2,
"role": "Supporting Guest",
"dialogue": "..."
}
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
