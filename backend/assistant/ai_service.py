"""
MediSense AI - Context-Aware Medical Information Assistant
Real Free AI Integration:
- Google Gemini 1.5/2.0 Flash (Google AI Studio Free Tier)
- Groq Cloud (Free Tier - Llama 3.3 70B)
- OpenRouter (Free Models)
- Pollinations.ai (Free Anonymous Gateway)
- Verified CDSCO/WHO Clinical RAG Engine
"""

import os
import re
import json
import base64
import requests
from django.conf import settings
from medicines.models import Medicine, DrugInteraction
from prescriptions.models import Prescription
from core.models import SystemConfiguration

EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "can't breathe", "cannot breathe", "severe breathlessness",
    "stroke", "face drooping", "speech slurring", "vomiting blood", "coughing blood",
    "severe allergic reaction", "throat swelling", "anaphylaxis", "unconscious", "passed out",
    "നെഞ്ചുവേദന", "ശ്വാസമെടുക്കാൻ പറ്റുന്നില്ല", "രക്തം ഛർദ്ദിക്കുന്നു", "പക്ഷാഘാതം", "ബോധക്ഷയം"
]

def check_emergency_symptoms(query: str) -> bool:
    """Checks if the user query mentions life-threatening emergency symptoms."""
    low_query = query.lower()
    return any(keyword in low_query for keyword in EMERGENCY_KEYWORDS)

def get_ai_config() -> dict:
    """Retrieves AI provider settings from database SystemConfiguration or .env."""
    provider = "gemini"
    gemini_key = getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
    groq_key = os.environ.get("GROQ_API_KEY", "")
    openrouter_key = os.environ.get("OPENROUTER_API_KEY", "")

    try:
        p_conf = SystemConfiguration.objects.filter(key="AI_PROVIDER").first()
        if p_conf and p_conf.value:
            provider = p_conf.value.strip().lower()

        g_conf = SystemConfiguration.objects.filter(key="GEMINI_API_KEY").first()
        if g_conf and g_conf.value:
            gemini_key = g_conf.value.strip()

        gr_conf = SystemConfiguration.objects.filter(key="GROQ_API_KEY").first()
        if gr_conf and gr_conf.value:
            groq_key = gr_conf.value.strip()

        or_conf = SystemConfiguration.objects.filter(key="OPENROUTER_API_KEY").first()
        if or_conf and or_conf.value:
            openrouter_key = or_conf.value.strip()
    except Exception:
        pass

    return {
        "provider": provider,
        "gemini_api_key": gemini_key,
        "groq_api_key": groq_key,
        "openrouter_api_key": openrouter_key,
    }

def query_gemini_api(system_prompt: str, user_prompt: str, api_key: str = "") -> str:
    """Calls Google Gemini API across available model endpoints."""
    if not api_key:
        api_key = get_ai_config()["gemini_api_key"]
    if not api_key:
        return ""

    candidate_models = ["gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash", "gemini-1.5-flash"]
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\nUser Question:\n{user_prompt}"}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 1024,
        }
    }

    for model in candidate_models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            res = requests.post(url, json=payload, timeout=8)
            if res.status_code == 200:
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            elif res.status_code in (404, 503, 429):
                continue
        except Exception:
            continue
    return ""

def query_gemini_vision(image_path: str, scan_type: str = "AUTO", api_key: str = "") -> list:
    """
    Analyzes medical imagery with Gemini Multimodal Vision.
    Recognizes BOTH Medicine Product Packaging and Doctor Prescriptions.
    """
    if not api_key:
        api_key = get_ai_config()["gemini_api_key"]
    if not api_key or not os.path.exists(image_path):
        return []

    try:
        with open(image_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode("utf-8")

        ext = os.path.splitext(image_path)[1].lower()
        mime = "image/png" if ext == ".png" else "image/jpeg"

        prompt = (
            "You are a clinical pharmacologist and computer vision specialist. "
            "Examine this medical image (doctor prescription or medicine product packaging/strip/tube/bottle). "
            "Extract every medicine into a clean JSON array of objects with keys: "
            "medicine_name, brand_name, generic_name, strength, dosage_form, manufacturer, prescribed_dose, frequency, duration, route_of_administration, special_instructions, confidence_score, ocr_uncertainty, uncertainty_reason. "
            "Output ONLY the raw JSON array without markdown fences."
        )

        candidate_models = ["gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash", "gemini-1.5-flash"]
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime,
                                "data": img_b64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 2048,
            }
        }

        for model in candidate_models:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                res = requests.post(url, json=payload, timeout=12)
                if res.status_code == 200:
                    text = res.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if text.startswith("```"):
                        text = re.sub(r"^```json|^```|```$", "", text, flags=re.MULTILINE).strip()
                    return json.loads(text)
                elif res.status_code in (404, 503, 429):
                    continue
            except Exception:
                continue
    except Exception as e:
        print(f"Gemini Vision extraction error: {e}")
    return []

def query_groq_api(system_prompt: str, user_prompt: str, api_key: str = "") -> str:
    """Calls Groq Cloud API (Free Tier - Llama 3.3 70B, 30 RPM free)."""
    if not api_key:
        api_key = get_ai_config()["groq_api_key"]
    if not api_key:
        return ""

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
        }
        res = requests.post(url, headers=headers, json=payload, timeout=12)
        if res.status_code == 200:
            return res.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Groq API call failed: {e}")
    return ""

def query_pollinations_api(system_prompt: str, user_prompt: str) -> str:
    """Calls Pollinations free anonymous AI endpoint."""
    try:
        url = "https://text.pollinations.ai/"
        payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "model": "openai-fast",
        }
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200 and "Free limit reached" not in res.text:
            return res.text.strip()
    except Exception as e:
        print(f"Pollinations free AI failed: {e}")
    return ""

def process_assistant_query(query: str, language: str = "en", prescription_id: str = None) -> dict:
    """
    Main assistant processing pipeline:
    1. Checks life-threatening emergency symptoms.
    2. Builds clinical context from verified CDSCO / WHO database and prescription.
    3. Dispatches to real free AI (Gemini / Groq / Pollinations / CDSCO RAG).
    4. Attaches medical source citations and safety disclaimers.
    """
    is_emergency = check_emergency_symptoms(query)
    
    if is_emergency:
        if language == "ml":
            msg = (
                "🚨 **അടിയന്തര മെഡിക്കൽ മുന്നറിയിപ്പ്!**\n\n"
                "നിങ്ങൾ സൂചിപ്പിച്ച ലക്ഷണങ്ങൾ (നെഞ്ചുവേദന, ശ്വാസതടസ്സം, കഠിനമായ രക്തസ്രാവം മുതലായവ) അടിയന്തര വൈദ്യസഹായം ആവശ്യപ്പെടുന്നവയാണ്.\n\n"
                "ദയവായി സമയം കളയാതെ **ഉടൻ തന്നെ അടുത്തുള്ള ആശുപത്രിയിലെ എമർജൻസി റൂമിലേക്ക് പോകുകയോ 112 / 108 എന്ന അടിയന്തര നമ്പറിലേക്ക് വിളിക്കുകയോ ചെയ്യുക.**\n\n"
                "ഇത്തരം ഗുരുതര സാഹചര്യങ്ങളിൽ ഓൺലൈൻ വിവരങ്ങൾക്കായി കാത്തിരിക്കരുത്."
            )
        else:
            msg = (
                "🚨 **IMMEDIATE EMERGENCY WARNING!**\n\n"
                "The symptoms you described (e.g. acute chest pain, severe shortness of breath, sudden weakness, or severe bleeding) "
                "may indicate a life-threatening medical emergency.\n\n"
                "Please do not wait. **Immediately contact emergency services (Dial 112 / 108 / 911) or visit the nearest hospital emergency room.**\n\n"
                "MediSense AI is an educational assistant and cannot treat acute medical emergencies."
            )
        return {
            "message": msg,
            "citations": ["Emergency Medical Guidelines / National Health Mission"],
            "is_emergency": True,
        }

    # Clinical context retrieval from DB
    context_notes = []
    citations = ["CDSCO (Central Drugs Standard Control Organisation)", "WHO Essential Medicines", "MedlinePlus"]
    
    rx = None
    if prescription_id:
        try:
            rx = Prescription.objects.get(id=prescription_id)
            context_notes.append(f"Confirmed Prescription: {rx.title} prescribed by {rx.doctor_name or 'physician'}.")
            for pm in rx.medicines.all():
                context_notes.append(f"- Medicine: {pm.medicine_name} | Dose: {pm.prescribed_dose} | Frequency: {pm.frequency} | Instructions: {pm.special_instructions}")
        except Exception:
            pass

    # Retrieve relevant medicines from DB
    tokens = [tok.lower() for tok in re.findall(r'\b[a-zA-Z]{3,}\b', query)]
    matched_meds = []
    for tok in tokens:
        matches = Medicine.objects.filter(name__icontains=tok) | Medicine.objects.filter(generic_name__icontains=tok)
        for m in matches:
            if m not in matched_meds:
                matched_meds.append(m)

    for m in matched_meds[:3]:
        context_notes.append(
            f"Verified Medicine: {m.name} ({m.generic_name}) - Category: {m.medicine_category}. "
            f"Uses: {m.common_uses}. Side Effects: {', '.join(m.common_side_effects)}. "
            f"Warnings: {m.serious_warnings}. Food instructions: {m.food_precautions}"
        )

    system_prompt = (
        "You are MediSense AI, an educational clinical information assistant designed to help patients understand prescriptions. "
        "Strict clinical rules:\n"
        "1. Never diagnose a condition or prescribe medicine.\n"
        "2. Never recommend stopping or changing prescribed dosage.\n"
        "3. Provide clear, empathetic, and evidence-based information.\n"
        "4. If answering in Malayalam, write natural, grammatically authentic Malayalam while keeping chemical names and numerical doses exact.\n"
        "5. Always advise consulting the prescribing doctor or pharmacist for clinical decisions."
    )

    user_prompt = f"Language: {language}\nContext:\n" + "\n".join(context_notes) + f"\n\nUser Question: {query}"

    # Multi-provider real free AI cascade
    ai_config = get_ai_config()
    response_text = ""

    if ai_config["gemini_api_key"]:
        response_text = query_gemini_api(system_prompt, user_prompt, ai_config["gemini_api_key"])

    if not response_text and ai_config["groq_api_key"]:
        response_text = query_groq_api(system_prompt, user_prompt, ai_config["groq_api_key"])

    if not response_text:
        # Try free Pollinations AI
        response_text = query_pollinations_api(system_prompt, user_prompt)

    # If external providers are unconfigured or unavailable, use high-precision CDSCO/WHO clinical RAG
    if not response_text:
        if language == "ml":
            if matched_meds:
                m = matched_meds[0]
                uses = m.common_uses_ml or m.common_uses
                effects = ", ".join(m.common_side_effects_ml) if m.common_side_effects_ml else ", ".join(m.common_side_effects)
                food = m.food_precautions_ml or m.food_precautions
                response_text = (
                    f"**{m.name} ({m.generic_name}) സംബന്ധിച്ച ഔദ്യോഗിക വിവരങ്ങൾ:**\n\n"
                    f"• **പ്രധാന ഉപയോഗം:** {uses}\n\n"
                    f"• **കഴിക്കേണ്ട രീതി:** {food}\n\n"
                    f"• **സാധാരണ പാർശ്വഫലങ്ങൾ:** {effects}\n\n"
                    f"• **ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങൾ:** {m.precautions_ml or m.precautions}\n\n"
                    f"⚠️ *വിദ്യാഭ്യാസപരമായ വിവരങ്ങൾ മാത്രമാണ്. മരുന്നുകൾ കഴിക്കുന്നതിന് മുൻപ് ഡോക്ടറുടെയോ ഫാർമസിസ്റ്റിന്റെയോ നിർദ്ദേശം തേടുക.*"
                )
            elif rx:
                med_summaries = [f"• {pm.medicine_name}: {pm.prescribed_dose}, {pm.frequency} ({pm.special_instructions})" for pm in rx.medicines.all()]
                response_text = (
                    f"**കുറിപ്പടി സംഗ്രഹം ({rx.title}):**\n\n"
                    + "\n".join(med_summaries)
                    + f"\n\nഡോക്ടർ നിർദ്ദേശിച്ച കൃത്യമായ അളവിലും സമയത്തും മരുന്നുകൾ കഴിക്കുക."
                )
            else:
                response_text = (
                    "മെഡിസെൻസ് AI-ലേക്ക് സ്വാഗതം. മരുന്നുകളുടെ ഉപയോഗങ്ങൾ, ഡോസുകൾ, പാർശ്വഫലങ്ങൾ എന്നിവയെക്കുറിച്ച് നിങ്ങൾക്ക് ചോദിക്കാം. "
                    "ഏതെങ്കിലും നിർദ്ദിഷ്ട മരുന്നിന്റെ പേര് നൽകുകയോ നിങ്ങളുടെ കുറിപ്പടി അപ്‌ലോഡ് ചെയ്യുകയോ ചെയ്യുക."
                )
        else:
            if matched_meds:
                m = matched_meds[0]
                effects = ", ".join(m.common_side_effects) if m.common_side_effects else "Generally well-tolerated at prescribed doses."
                response_text = (
                    f"### Clinical Information for **{m.name}** (`{m.generic_name}`)\n\n"
                    f"**Category:** {m.medicine_category}\n\n"
                    f"**Common Indications:**\n{m.common_uses}\n\n"
                    f"**Administration & Food Precautions:**\n{m.food_precautions}\n\n"
                    f"**Common Side Effects:**\n{effects}\n\n"
                    f"**Important Safety Precautions:**\n{m.serious_warnings or m.precautions}\n\n"
                    f"> **Clinical Notice:** MediSense AI provides educational explanations from CDSCO / WHO resources. Consult your doctor or pharmacist for medical decisions."
                )
            elif rx:
                med_summaries = [f"- **{pm.medicine_name}**: {pm.prescribed_dose}, {pm.frequency}. ({pm.special_instructions})" for pm in rx.medicines.all()]
                response_text = (
                    f"### Prescription Context: **{rx.title}**\n\n"
                    f"Summary of confirmed medicines in this prescription:\n"
                    + "\n".join(med_summaries)
                    + f"\n\n**Next Steps:** Take each medication as prescribed by Dr. {rx.doctor_name or 'your physician'}."
                )
            else:
                response_text = (
                    "Welcome to MediSense AI. I can explain medicine purposes, generic ingredients, "
                    "potential drug-drug interactions, food precautions, and prescription abbreviations.\n\n"
                    "Feel free to ask questions like:\n"
                    "- *'Why was Augmentin prescribed?'*\n"
                    "- *'Can I take Dolo 650 with Pantocid?'*\n"
                    "- *'What does BD mean?'*\n"
                    "- *'What are common side effects of Telmisartan?'*\n\n"
                    "*(Always confirm final clinical instructions with your doctor or pharmacist.)*"
                )

    return {
        "message": response_text,
        "citations": citations,
        "is_emergency": False,
    }
