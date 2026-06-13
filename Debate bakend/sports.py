import os
import json
import asyncio
import httpx
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pydantic import BaseModel
from google import genai
from google.genai import types

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FOOTBALL_API_KEY = os.getenv("FOOTBALL_DATA_API_KEY")
CRICKET_API_KEY = os.getenv("CRICKET_DATA_API_KEY")

client = genai.Client(api_key=GEMINI_API_KEY)

def is_within_window(date_string: str, days_back=3, days_forward=7) -> bool:
    if not date_string or date_string == "Unknown":
        return True
    try:
        match_date = datetime.strptime(date_string[:10], "%Y-%m-%d").date()
        today = datetime.now().date()
        return (today - timedelta(days=days_back)) <= match_date <= (today + timedelta(days=days_forward))
    except Exception:
        return True

class BroadcastRequest(BaseModel):
    choice: str
    language: str
    match_index: int

class ScorecardRequest(BaseModel):
    match_id: str

def generate_broadcast_script(prompt: str) -> str:
    models_to_try = ['gemini-3.1-flash-lite','gemini-3.5-flash', 'gemini-2.5-flash']
    
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                ),
            )
            return response.text
        except Exception as e:
            print(f"⚠️ Model {model_name} failed: {e}. Trying fallback...")
            continue
            
    raise RuntimeError("All AI generation engine clusters are currently busy. Try again shortly.")

# ==========================================
# REAL-TIME SPORTS DATA ACQUISITION LAYERS
# ==========================================

import httpx

WORLD_CUP_URL = "https://worldcup26.ir/get/games"


def parse_scorers(raw):
    if not raw or str(raw).lower() == "null":
        return []

    text = str(raw)

    for ch in ['{', '}', '[', ']', '"', '“', '”', '\\']:
        text = text.replace(ch, '')

    return [x.strip() for x in text.split(',') if x.strip()]



async def get_football_wc():
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(WORLD_CUP_URL)

            if response.status_code != 200:
                return []

            data = response.json()

            matches = (
                data.get("games", data)
                if isinstance(data, dict)
                else data
            )

            # Sort matches by date
            matches.sort(
                key=lambda m: datetime.strptime(
                    m.get("local_date", "12/31/2099 23:59"),
                    "%m/%d/%Y %H:%M"
                )
            )

            formatted_matches = []

            for m in matches:
                raw_status = str(
                    m.get("time_elapsed", "")
                ).lower()

                if raw_status == "notstarted":
                    status = "Not Started"
                    score = "vs"

                elif str(m.get("finished", "")).upper() == "TRUE":
                    status = "Finished"
                    score = f"{m.get('home_score')} - {m.get('away_score')}"

                elif raw_status == "live":
                    status = "Live"
                    score = f"{m.get('home_score')} - {m.get('away_score')}"

                else:
                    status = raw_status.title()
                    score = f"{m.get('home_score')} - {m.get('away_score')}"

                formatted_matches.append({
                    "id": int(m.get("id", 0)),
                    "homeTeam": m.get("home_team_name_en", "Unknown"),
                    "awayTeam": m.get("away_team_name_en", "Unknown"),
                    "date": m.get("local_date"),
                    "group": m.get("group"),
                    "status": status,
                    "score": score
                })

            return formatted_matches

    except Exception as e:
        print(f"World Cup fetch error: {e}")
        return []




async def get_goal_scorers(match_id: int):
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(WORLD_CUP_URL, timeout=15)

            data = res.json()

            matches = data.get("games", data) if isinstance(data, dict) else data

            for m in matches:
                if str(m.get("id")) == str(match_id):

                    return {
                        "homeTeam": m.get("home_team_name_en"),
                        "awayTeam": m.get("away_team_name_en"),
                        "score": f"{m.get('home_score')} - {m.get('away_score')}",
                        "homeScorers": parse_scorers(
                            m.get("home_scorers")
                        ),
                        "awayScorers": parse_scorers(
                            m.get("away_scorers")
                        )
                    }

            return {}

        except Exception as e:
            print("Goal scorer error:", e)
            return {}



            
async def get_cricket():
    url = f"https://api.cricapi.com/v1/cricScore?apikey={CRICKET_API_KEY}"

    try:
        timeout = httpx.Timeout(
            connect=20.0,
            read=60.0,
            write=20.0,
            pool=20.0
        )

        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.get(url)

        if res.status_code != 200:
            print("API Error:", res.text[:300])
            return []

        data = res.json()
        matches = data.get("data", [])

        today = datetime.now().date()
        start_date = today - timedelta(days=3)
        end_date = today + timedelta(days=5)

        def get_category(series: str):
            s = (series or "").lower()

            if "tour of" in s:
                return "INTERNATIONAL"

            if " a " in s or " a " in s or "lions" in s or "tri nation a" in s:
                return "A_TEAMS"

            if "icc" in s:
                return "ICC"

            if "women" in s or "womens" in s:
                return "WOMEN"

            if "legends" in s or "postponed" in s:
                return "LEGENDS"

            return "DOMESTIC"

        grouped = {
            "INTERNATIONAL": [],
            "A_TEAMS": [],
            "ICC": [],
            "DOMESTIC": [],
            "LEGENDS": [],
            "WOMEN": []
        }

        for m in matches:
            date_str = m.get("dateTimeGMT")

            if not date_str:
                continue

            try:
                match_date = datetime.fromisoformat(date_str).date()
            except:
                continue

            if not (start_date <= match_date <= end_date):
                continue

            category = get_category(m.get("series"))

            status_text = m.get("status", "")
            ms = m.get("ms", "")

            if ms == "fixture":
                status = "SCHEDULED"
            elif "won" in status_text.lower():
                status = "FINISHED"
            else:
                status = "LIVE"

            match_obj = {
                "id": m.get("id"),
                "homeTeam": m.get("t1", "Team A"),
                "awayTeam": m.get("t2", "Team B"),
                "status": status,
                "score": status_text,
                "competition": m.get("series", "Unknown"),
                "date": match_date.isoformat()
            }

            grouped[category].append(match_obj)

        ordered_output = []

        order = [
            "INTERNATIONAL",
            "A_TEAMS",
            "ICC",
            "DOMESTIC",
            "LEGENDS",
            "WOMEN"
        ]

        for cat in order:
            grouped[cat].sort(key=lambda x: x["date"])
            ordered_output.extend(grouped[cat])

        return ordered_output

    except httpx.ReadTimeout:
        print("Timeout: CricAPI too slow to respond")
        return []

    except Exception as e:
        print("Error:", repr(e))
        return []

async def get_cricket_scorecard(match_id):
    url = f"https://api.cricapi.com/v1/match_scorecard?apikey={CRICKET_API_KEY}&id={match_id}"
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(url, timeout=10.0)
            return res.json().get("data", {})
        except Exception as e:
            return {"error": str(e)}

# ==========================================
# ORCHESTRATION PIPELINE & INTERACTION
# ==========================================
import json

async def get_sports_broadcast(request: BroadcastRequest) -> dict:
    choice = request.choice
    lang_choice = request.language
    match_idx = request.match_index

    # ---------------- LANGUAGE STYLE ----------------
    if lang_choice == "2":
        language_style = """
        LANGUAGE RULE:
            - Write ONLY in Tamil script (தமிழ்)
    - BUT English sports words MUST be written in Tamil phonetic form
      (NOT translated meaning, NOT English letters)

    EXAMPLES:
    match → மேட்ச்
    cricket → கிரிக்கெட்
    football → ஃபுட்பால்
    player → பிளேயர்
    team → டீம்
    goal → கோல்
    wicket → விக்கெட்
    run → ரன்

    STYLE:
    - Natural TV commentary style
    - Emotional, energetic broadcast tone
    - Like Star Sports Tamil commentary
    
        """
    else:
        language_style = """
        LANGUAGE RULE:
        - Use professional English TV broadcast tone
        """

    # ---------------- MATCH FETCHING ----------------
    if choice == "1":
        matches = await get_cricket()
        sport_lbl = "Cricket"

    elif choice == "2":
        matches = await get_football_wc()
        sport_lbl = "Football (World Cup)"

    else:
        return {"success": False, "error": "Invalid Selection"}

    if not matches:
        return {"success": False, "error": f"No active match streams for {sport_lbl}"}

    if match_idx < 0 or match_idx >= len(matches):
        return {"success": False, "error": "Invalid match index"}

    selected = matches[match_idx]

    # ---------------- SCORECARD (CRICKET ONLY) ----------------
    if choice == "1" and selected.get("status") != "SCHEDULED":
        selected["scorecard_details"] = await get_cricket_scorecard(selected["id"])
    analysis_data = {
    "sport": sport_lbl,
    "match": selected,
    "goal_scorers": await get_goal_scorers(selected["id"]) if choice == "2" else {},
    "scorecard": selected.get("scorecard_details", {}) if choice == "1" else {}
    }

    # ---------------- STYLE INSTRUCTION ----------------
    style_instruction = ""

    # ===================== CRICKET =====================
    if choice == "1":

        if selected["status"] == "SCHEDULED":
            style_instruction = """
            STYLE: Elite Cricket Pre-Match Show

            REQUIRED ANALYSIS:
            - Predicted Playing XI
            - Pitch & Weather Report
            - Key Player Battles
            - Team Form Analysis
            - Fantasy Picks
            - X-Factor Players
            - Win Probability (%)
            - Match Prediction
            """

        else:
            style_instruction = """
            STYLE: Elite Cricket Match Review

            REQUIRED ANALYSIS:
            - Match Summary
            - Top Performer (BAT/BOWL/ALL-ROUND)
            - Turning Point of Match
            - Key Partnerships
            - Captaincy Decisions
            - Powerplay / Middle / Death Overs Analysis

            PLAYER ANALYSIS (MANDATORY):
            For each batter:
            - Runs, Balls, SR, Boundaries, Impact

            For each bowler:
            - Overs, Wickets, Economy, Dot Balls

            FINAL OUTPUT:
            - Player Ratings (/10)
            - Man of the Match
            - Emerging Star
            - Winning Factors
            """

    # ===================== FOOTBALL =====================
    else:

        if selected["status"] == "SCHEDULED":

            style_instruction = """
        STYLE: FIFA World Cup Pre-Match Studio

        REQUIRED ANALYSIS:

        - Predicted Starting XI
        - Formation Analysis (4-3-3 / 4-2-3-1 etc.)
        - Tactical Matchup Breakdown
        - Key Player Battles
        - Team Form Comparison
        - Pressing Style Analysis
        - Defensive Structure Analysis
        - Attacking Strategy Breakdown
        - Set Piece Threat Analysis

        FROM DATA (MANDATORY USE):
        - Match Stats (if available)
        - Team strengths from API data

        ADVANCED INSIGHTS:
        - Expected Goals (xG) prediction
        - Possession dominance prediction
        - Midfield control analysis
        - Wing play vs central attack analysis

        OUTPUT:
        - Win Probability (%)
        - Predicted Scoreline
        - X-Factor Player
        - Match Tempo Prediction
        """

        else:

            style_instruction = """
        STYLE: Elite Football Match Review (ESPN / Sky Sports Level)

        REQUIRED ANALYSIS:

        - Full Match Summary (minute-by-minute flow)
        - Tactical Breakdown using match events
        - Formation shifts during match
        - Possession dominance analysis
        - Attacking vs Defensive transitions
        - Counter Attack effectiveness
        - Set Piece impact

        FROM MATCH EVENTS (MANDATORY):
        - Goals timeline
        - Substitutions impact
        - Red / Yellow cards impact
        - Momentum shifts (minute-based)
        - Tactical changes after events

        FROM MATCH STATS (MANDATORY):
        - Possession %
        - Shots / Shots on target
        - Pass accuracy
        - Fouls / Cards
        - Defensive actions

        PLAYER ANALYSIS:

        For each key player:
        - Goals / Assists
        - Key passes
        - Chances created
        - Tackles / Interceptions
        - Defensive contribution
        - Match impact rating

        FINAL OUTPUT:
        - Best Player
        - Best Defender / Midfielder / Attacker
        - Player Ratings (/10)
        - Team Performance Rating
        - Man of the Match
        - Tactical Turning Point
        - Winning Factors
        """

    # ---------------- BROADCAST PROMPT ----------------
    studio_prompt = f"""
You are the Executive Producer of a World-Class Sports Broadcast Studio.

Use ONLY the provided data:

{json.dumps(analysis_data)[:15000]}

{language_style}

{style_instruction}

STRICT RULES:
- Do NOT invent stats
- Use only given match + scorecard data
- Include real player names whenever available
- Include tactical insights and deep analysis
- Every speaker must speak like LIVE TV BROADCAST experts
- NO SHORT ANSWERS ALLOWED

 LENGTH RULE (VERY IMPORTANT):
- Each speaker MUST write MINIMUM 6 to 9 sentences
- Each sentence must be detailed and analytical
- No bullet points
- No 1-line responses
- Must feel like real live TV debate conversation

OUTPUT FORMAT:

You MUST generate 6 segments:

1. Anchor Introduction (10–12 sentences)
2. Tactical Analyst Deep Breakdown (10–12 sentences)
3. Field Expert Insight (10–12 sentences)
4. Data Analyst (10–12 sentences)
5. Fan Reaction (10–12 sentences)
6. Anchor Closing Summary (10–12 sentences)

STYLE:
- ESPN / Sky Sports / ICC Live Panel
- Emotional, analytical, storytelling tone
- Mention players, turning points, tactics

STRICT JSON ONLY:

[
  {{"speaker": "Anchor", "text": "..."}},
  {{"speaker": "Tactical Analyst", "text": "..."}},
  {{"speaker": "Field Expert", "text": "..."}},
  {{"speaker": "Data Analyst", "text": "..."}},
  {{"speaker": "Fan Voice", "text": "..."}},
  {{"speaker": "Anchor", "text": "..."}}
]
"""

    # ---------------- GENERATION ----------------
    try:
        raw_json_output = generate_broadcast_script(studio_prompt)

        if raw_json_output.startswith("```json"):
            raw_json_output = raw_json_output[7:-3].strip()

        script_data = json.loads(raw_json_output)

        return {
            "success": True,
            "sport": sport_lbl,
            "match": selected,
            "broadcast": script_data
        }

    except Exception as err:
        return {
            "success": False,
            "error": f"Broadcast Engine Error: {err}"
        }


# ---------------- FOOTBALL LIST API ----------------
async def get_football_wc_list() -> dict:
    try:
        matches = await get_football_wc()
        return {
            "success": True,
            "sport": "Football (World Cup)",
            "matches": matches
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# ---------------- CRICKET LIST API ----------------
async def get_cricket_matches() -> dict:
    try:
        matches = await get_cricket()
        return {
            "success": True,
            "sport": "Cricket",
            "matches": matches
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
