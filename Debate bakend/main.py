import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from google.api_core import exceptions

app = FastAPI(title="Hyper-Realistic Tamil TV Debate Studio Engine (Dynamic Universal Prompt)")

# --- CONFIGURE ROBUST CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API Key
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

class DebateRequest(BaseModel):
    topic: str

# --- REUSABLE GENERATION HELPER WITH MODEL FALLBACK ---
def generate_debate_with_fallback(prompt: str):
    """
    Attempts generation with Gemini 3.5 Flash, 3.1 Flash Lite, or 2.5 Flash.
    """
    models_to_try = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash']
    
    for model_name in models_to_try:
        try:
            print(f"Attempting script generation via: {model_name}...")
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return response.text
        except exceptions.ResourceExhausted as e:
            print(f"Warning: Rate limit reached on {model_name}. details: {str(e)}")
            if model_name == models_to_try[-1]:
                raise e
            print("Switching over to fallback model cluster...")
            continue
        except Exception as e:
            raise e

# --- CORE API ROUTE ---
@app.post("/api/studio/process-debate")
async def process_debate_session(request: DebateRequest):
    try:
        # Dynamic date context insertion to keep real-world timelines accurate
        current_date_context = datetime.now().strftime("%B %Y")
        
        # UNIVERSAL SYSTEM PROMPT (Handles any given topic dynamically)
        system_orchestration_prompt = f"""
        You are the chief director for an elite, high-intensity live Tamil TV News Debate program (பாணியில் விவாத மேடை).
        Generate a deeply engaging, aggressive, and fast-paced script written entirely in conversational, media-style spoken Tamil (தமிழ்).
        
        CURRENT REAL-WORLD TIMELINE: {current_date_context}. Ensure any time-sensitive references in arguments logically align with this real-world date.

        THE VISUALIZED DEBATE TOPIC: 
        "{request.topic}"
        
        STRICT BEHAVIORAL & QUESTIONING RULES:
        1. UNIVERSAL ADAPTABILITY: Analyze the provided topic. Identify the core friction point (whether it is political, social, financial, local, or systemic) and build highly relevant, contrasting arguments around it.
        2. HIGH ATTACK & AGGRESSION: The Attacker/Opposer (Speaker 5) must be highly interrogative. They must ask sharp, direct, biting, consecutive questions to the Supporter (Speaker 2) instead of giving calm, passive monologues.
        3. NATURAL TAMIL INTERRUPTIONS: To maintain a live broadcast energy, speakers must aggressively cut each other off or start their turns with combative dialogue markers (e.g., "இருங்க இருங்க!", "கேள்விக்கு பதில் சொல்லுங்க!", "என்னங்க பேசுறீங்க?!", "நியாயமே இல்லை!").
        4. TEXT LENGTH SPECIFICATION: Each speaker's response must be a solid, descriptive monologue (aim for roughly 100-180 words per turn) delivered passionately.
        5. LANGUAGE TONE: Use colloquial media-style Tamil as heard on leading 24/7 news channels (e.g., 'நிஜமாவே', 'யோசிச்சு பாருங்க', 'ஆதாரத்தோட பேசுங்க').
        
        STRICT POSITION MATRIX (Exactly 7 entries in chronological order):
        1. Speaker 3 (Anchor): Delivers a dramatic, theatrical intro framing the core conflict of the topic, introducing the guests, and laying out why this is a massive issue for the public right now.
        2. Speaker 2 (Supported Guest): Defends the core premise of the topic passionately, using strong ideological, practical, or policy-based justifications.
        3. Speaker 5 (Opposite Guest/Attacker): Interrupts fiercely! Fires back with an aggressive rebuttal, challenging Speaker 2 with a rapid volley of critical questions demanding accountability.
        4. Speaker 4 (Neutral Expert): Breaks down the data or structural parameters calmly. Evaluates the ground realities, logistics, and legal or economic constraints without taking sides.
        5. Speaker 1 (Public Voice Pro): Real-world community perspective, offering everyday grass-roots support or a personal narrative backing the concept.
        6. Speaker 6 (Public Voice Anti): Expresses frustration or localized skepticism about how the decision impacts the average citizen, calling out optics vs reality.
        7. Speaker 3 (Anchor): Restores order over the shouting panel, cuts off cross-talk, summarizes the high stakes, and delivers a professional closing statement.

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
            detail="Gemini API Request Limits Exhausted across all operational models. Please wait a few minutes before regenerating."
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Model response generated successfully but failed to parse into structured JSON array."
        )
    except Exception as e:
        print(f"System Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)