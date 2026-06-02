# 📺 MedaTV Live Debate Simulation Engine

An elite, high-intensity live TV news debate script generation engine powered by **FastAPI** and **Google Gemini AI**. This system dynamically generates structured, high-conflict debate scripts entirely in conversational, media-style spoken Tamil (தமிழ்) for any given topic.

It features a robust **multi-model fallback mechanism** to ensure high availability and bypass tight free-tier rate limits during rapid frontend development.

---

## 🚀 Key Features

* **Universal Topic Adaptability:** Seamlessly analyzes any social, political, or economic topic and extracts core structural friction points dynamically.
* **High-Intensity Dialogue Flow:** Instructs the AI to generate aggressive, interrogative monologues where speakers interrupt each other using authentic Tamil news broadcast markers (e.g., *“இருங்க இருங்க!”*, *“கேள்விக்கு பதில் சொல்லுங்க!”*).
* **Resilient Multi-Model Fallback:** Automatically cycles through API clusters to avoid `429 ResourceExhausted` errors:
  $$\text{Gemini 3.5 Flash} \longrightarrow \text{Gemini 3.1 Flash Lite} \longrightarrow \text{Gemini 2.5 Flash}$$
* **Deterministic JSON Outputs:** Guarantees strict output formats without markdown code blocks, perfectly mapping to a fixed 7-step presentation matrix ready for frontend parsing.
* **CORS Enabled:** Fully configured to integrate safely with your React / MERN stack web applications.

---

## 🛠️ Project Components

### 1. Production Dependencies (`requirements.txt`)
Save the following lines into a file named `requirements.txt`:

```text
fastapi==0.111.0
uvicorn==0.30.1
pydantic==2.7.4
google-generativeai==0.7.0
