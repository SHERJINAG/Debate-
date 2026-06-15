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
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[
                        types.Tool(
                            google_search=types.GoogleSearch()
                        )
                    ]
                )
            )

            return response.text

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

TODAY'S DATE:
{current_date_context}

DEBATE TOPIC:
"{request.topic}"

IMPORTANT INSTRUCTIONS:

* Search Google for the latest real-world developments related to this topic.
* Use current events, recent announcements, policy decisions, statistics, controversies, public reactions, and verified developments.
* Prefer information from today and recent days.
* Do NOT invent facts, data, people, statements, or events.
* All arguments must be grounded in real-world developments.
* Write entirely in spoken Tamil as heard on leading Tamil news channels.
* The debate should feel live, intense, emotional, and highly engaging.

DEBATE STYLE RULES:

1. HIGH-ENERGY TELEVISION FORMAT

   * Fast-paced newsroom atmosphere.
   * Frequent interruptions.
   * Strong disagreements.
   * Direct challenges between speakers.

2. AGGRESSIVE QUESTIONING

   * Speaker 5 must repeatedly challenge Speaker 2.
   * Questions should be sharp, fact-driven, and confrontational.

3. NATURAL TAMIL SPEECH

   * Use expressions such as:
     "இருங்க!"
     "ஒரு நிமிஷம்!"
     "கேள்விக்கு பதில் சொல்லுங்க!"
     "அதுதான் நான் கேட்கிறேன்!"
     "மக்கள் இதைத்தான் கேட்கிறார்கள்!"

4. RESPONSE LENGTH

   * Every speaker must deliver detailed responses.
   * Target approximately 100-180 words per turn.

5. REALISM

   * The discussion should sound exactly like a Tamil television prime-time debate.

SPEAKER ORDER (EXACTLY 7 ENTRIES):

1. Speaker 3 (Main Anchor)

   * Dramatic introduction.
   * Present the controversy.
   * Introduce both sides.

2. Speaker 2 (Supporting Guest)

   * Strongly supports the topic.

3. Speaker 5 (Opposing Guest)

   * Aggressively attacks the supporting argument.

4. Speaker 4 (Neutral Expert)

   * Provides facts, context, and analysis.

5. Speaker 1 (Public Voice Pro)

   * Represents citizens supporting the position.

6. Speaker 6 (Public Voice Anti)

   * Represents citizens opposing the position.

7. Speaker 3 (Main Anchor)

   * Controls the final arguments.
   * Stops interruptions.
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

        system_prompt = f"""
Search Google for the latest news and current developments related to:

Category: {request.category}

Date: {current_date}

IMPORTANT:

- Use Google Search results.
- Use only recent real-world news.
- Prefer news from today.
- Do not create fictional stories.
- Do not speculate.
- Use verified developments, announcements, statistics and events.
- Write entirely in formal Tamil television news style.
- Generate EXACTLY 10 segments.

Each segment must contain:

- segment_index
- camera_angle
- title
- dialogue

Return ONLY valid JSON.

Required camera sequence:

0 HEADLINE_ZOOM
1 ANCHOR_DESK
2 GRAPHIC_PAN
3 ANCHOR_DESK
4 GRAPHIC_PAN
5 ANCHOR_DESK
6 GRAPHIC_PAN
7 ANCHOR_DESK
8 GRAPHIC_PAN
9 STUDIO_WIDE
"""

        raw_response = generate_debate_with_fallback(system_prompt)

        return {
            "success": True,
            "category": request.category,
            "broadcast_timeline": json.loads(raw_response)
        }

    except Exception as e:
        print(f"News Route Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

        
        
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
