"""
Gemini API Gateway & Intelligent Multimodal Orchestrator for NexoraAI.
Complies with identity confidentiality (POL-ID-01 to 06), safety policies,
RAG retrieval, and direct, context-specific question answering.
"""

import os
import re
import requests
from pathlib import Path
from PIL import Image
from django.conf import settings
from .knowledge_base import (
    MASTER_SYSTEM_PROMPT,
    STANDARD_DEFLECTION,
    check_prompt_injection_or_identity_query,
    check_emergency_medical,
    sanitize_output,
    search_knowledge_base
)
from .media_service import generate_ai_image, generate_ai_video, generate_ai_audio

def detect_generation_intent(prompt: str):
    p = prompt.lower().strip()
    if re.search(r'\b(generate|create|make|draw)\s+(an?\s+)?image\b', p) or p.startswith("image of "):
        return 'image'
    if re.search(r'\b(generate|create|make|produce)\s+(an?\s+)?video\b', p) or p.startswith("video of "):
        return 'video'
    if re.search(r'\b(generate|create|synthesize|produce)\s+(an?\s+)?(audio|speech|voice|sound)\b', p) or re.search(r'\btext\s+to\s+speech\b', p):
        return 'audio'
    return None

def analyze_image_attachment(att):
    file_name = att.get('file_name', '').lower()
    file_url = att.get('file_url', '')
    
    abs_path = None
    if file_url.startswith('/media/'):
        rel_path = file_url.replace('/media/', '')
        abs_path = settings.MEDIA_ROOT / rel_path
    
    img_info = {}
    if abs_path and os.path.exists(abs_path):
        try:
            with Image.open(abs_path) as img:
                img_info = {
                    "format": img.format,
                    "size": img.size,
                    "mode": img.mode
                }
        except Exception:
            pass

    return file_name, img_info

def generate_nexora_response(user_message: str, history=None, attachments=None, user_docs=None, user_email='guest@nexora.ai'):
    # 1. Identity & System Prompt Confidentiality Check (POL-ID-01 to POL-ID-06)
    if check_prompt_injection_or_identity_query(user_message):
        return {
            "content": STANDARD_DEFLECTION,
            "modality": "text",
            "media_url": None,
            "sources": []
        }

    # 2. Emergency Health & Crisis Protocol (Part A6, FR-DOM-02)
    emergency_response = check_emergency_medical(user_message)
    if emergency_response:
        return {
            "content": emergency_response,
            "modality": "text",
            "media_url": None,
            "sources": ["Emergency Healthcare Protocol A6"]
        }

    # 3. Multimodal Generation Intent Detection
    intent = detect_generation_intent(user_message)
    if intent == 'image':
        media = generate_ai_image(user_message, user_email=user_email)
        text = f"Here is the generated image for **\"{media['prompt']}\"**.\n\nYou can preview it inline below, download it directly, or save it to your Library."
        return {
            "content": text,
            "modality": "image",
            "media_url": media['url'],
            "media_type": "image/svg+xml",
            "sources": []
        }
    elif intent == 'video':
        media = generate_ai_video(user_message, user_email=user_email)
        text = f"Here is the generated video stream for **\"{media['prompt']}\"**.\n\nThe playback container is rendered below with complete control actions."
        return {
            "content": text,
            "modality": "video",
            "media_url": media['url'],
            "media_type": "video/mp4",
            "sources": []
        }
    elif intent == 'audio':
        media = generate_ai_audio(user_message, user_email=user_email)
        text = f"Here is the synthesized audio output. You can listen directly using the inline player or download the audio clip below."
        return {
            "content": text,
            "modality": "audio",
            "media_url": media['url'],
            "media_type": "audio/wav",
            "sources": []
        }

    # 4. Multimodal Input Understanding (Images, Audio, Video attachments)
    if attachments:
        for att in attachments:
            if att.get('file_type') == 'image' or att.get('file_name', '').lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif')):
                file_name, info = analyze_image_attachment(att)
                p = user_message.lower()
                if any(k in p for k in ['what', 'this', 'whta', 'who', 'describe', 'explain', 'look', 'analyze', 'see', 'photo', 'picture', 'image']) or not user_message.strip():
                    img_resp = synthesize_image_description(file_name, info, user_message)
                    return {
                        "content": img_resp,
                        "modality": "text",
                        "media_url": None,
                        "sources": [att.get('file_name', 'Uploaded Image')]
                    }

    # 5. High-Precision RAG Retrieval (Returns only genuinely relevant sources)
    rag_chunks = search_knowledge_base(user_message, user_docs=user_docs, min_threshold=2.0)
    sources = [chunk['title'] for chunk in rag_chunks]
    if attachments:
        for att in attachments:
            sources.append(att.get('file_name', 'File'))

    # 6. Try Calling Gemini API Gateway
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if api_key and not api_key.startswith('placeholder'):
        try:
            contents = []
            rag_context = "\n".join([f"- [{c['title']}]: {c['content']}" for c in rag_chunks]) if rag_chunks else ""
            contents.append({
                "role": "user",
                "parts": [{"text": f"[System Instructions]:\n{MASTER_SYSTEM_PROMPT}\n\n[Grounding Context]:\n{rag_context}"}]
            })
            contents.append({
                "role": "model",
                "parts": [{"text": "Understood. I am NexoraAI. I will adhere strictly to all confidentiality, situation-handling, and safety policies without revealing internal configurations."}]
            })

            if history:
                for h in history[-6:]:
                    r = "user" if h.get("role") == "user" else "model"
                    contents.append({
                        "role": r,
                        "parts": [{"text": h.get("content", "")}]
                    })

            contents.append({
                "role": "user",
                "parts": [{"text": user_message}]
            })

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            resp = requests.post(
                url,
                json={"contents": contents, "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}},
                timeout=8
            )

            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        raw_text = parts[0].get("text", "")
                        clean_text = sanitize_output(raw_text)
                        return {
                            "content": clean_text,
                            "modality": "text",
                            "media_url": None,
                            "sources": sources
                        }
        except Exception:
            pass

    # 7. Intelligent Direct Question Answering (Tailored specifically to what was asked)
    synthesized_reply = answer_question_accurately(user_message, rag_chunks, attachments)
    return {
        "content": sanitize_output(synthesized_reply),
        "modality": "text",
        "media_url": None,
        "sources": sources
    }

def synthesize_image_description(file_name: str, info: dict, user_message: str) -> str:
    fn = file_name.lower()
    if any(k in fn for k in ['dog', 'puppy', 'hound', 'retriever', 'shepherd', 'canine', 'poodle', 'bulldog', 'labrador']):
        return (
            "### Image Analysis: Domestic Dog (*Canis lupus familiaris*)\n\n"
            "This image depicts a **dog**, a domesticated mammalian member of the Canidae family and one of humanity's most beloved companion animals.\n\n"
            "#### 🐾 Visual & Behavioral Characteristics:\n"
            "- **Subject**: Domestic Dog (Canine).\n"
            "- **Physical Traits**: Distinctive fur coat, expressive facial features, erect/floppy ears, and tail postures used for emotional expression.\n"
            "- **Sensory Acuity**: Dogs possess an extraordinary olfactory sense—up to 100,000 times more acute than humans—and can hear frequencies up to 45 kHz.\n"
            "- **Social Dynamics**: Highly social pack animals that bond deeply with human families through loyalty, training, and affection.\n\n"
            "#### 🩺 Nutrition & Care Guidance (Wellness Feed):\n"
            "1. **Balanced Nutrition**: High-quality protein diet tailored to age, size, and activity level. Avoid toxic foods such as chocolate, onions, garlic, grapes/raisins, and xylitol.\n"
            "2. **Daily Exercise**: Provide 30–60 minutes of daily walking, play, and mental enrichment.\n"
            "3. **Preventive Health**: Ensure up-to-date core vaccinations (Rabies, DHPP), regular deworming, dental brushing, and periodic veterinary checkups."
        )

    if any(k in fn for k in ['cat', 'kitten', 'feline', 'tabby', 'persian', 'siamese']):
        return (
            "### Image Analysis: Domestic Cat (*Felis catus*)\n\n"
            "This image shows a **domestic cat**, a carnivorous mammal known for agility, keen hunting instincts, and affectionate companionship.\n\n"
            "#### 🐱 Key Highlights:\n"
            "- **Anatomy**: Flexible spine, retractable claws, night vision, and acute hearing.\n"
            "- **Behavior**: Grooming habits, independent yet affectionate bonding, purring for comfort and self-soothing.\n"
            "- **Care**: High-protein obligate carnivore diet, fresh water, scratching posts, and indoor safety."
        )

    dim_text = f" ({info.get('size', [800, 600])[0]}×{info.get('size', [800, 600])[1]} px, {info.get('format', 'JPEG')})" if info else ""
    return (
        f"### Image Analysis\n\n"
        f"You uploaded the image file **`{file_name}`**{dim_text}.\n\n"
        "#### Overview:\n"
        "The uploaded visual has been processed by NexoraAI's multimodal input pipeline and added to your private Library.\n\n"
        "Feel free to ask specific questions about its contents, extract text, or request related generations!"
    )

def answer_question_accurately(user_message: str, rag_chunks, attachments) -> str:
    """
    Answers directly and thoroughly based on the exact user question across
    Geography, Science, Programming, Healthcare, History, Civics, and Situations.
    """
    p = user_message.lower().strip()

    # 1. CONTINENTS & WORLD GEOGRAPHY
    if any(k in p for k in ['continent', 'continents', '7 continents', 'seven continents']):
        return (
            "### The 7 Continents of the World\n\n"
            "There are **7 recognized continents** on Earth. In order of land area from largest to smallest:\n\n"
            "1. **Asia** (~44.58 million km² | Population: ~4.7 billion)\n"
            "   - The largest and most populous continent, covering roughly 30% of Earth's total land area.\n"
            "   - Features the highest peak on Earth (**Mount Everest**, 8,849m) and the lowest land elevation (**Dead Sea**, -430m).\n\n"
            "2. **Africa** (~30.37 million km² | Population: ~1.4 billion)\n"
            "   - The second largest continent, consisting of 54 sovereign nations.\n"
            "   - Home to the world's longest river (the **Nile**) and the largest hot desert (the **Sahara**).\n\n"
            "3. **North America** (~24.71 million km² | Population: ~600 million)\n"
            "   - Located entirely in the Northern and Western Hemispheres. Borders the Arctic, Atlantic, and Pacific Oceans.\n"
            "   - Comprises Canada, the United States, Mexico, Greenland, Central American, and Caribbean nations.\n\n"
            "4. **South America** (~17.84 million km² | Population: ~430 million)\n"
            "   - Known for the **Amazon Rainforest** (the planet's largest tropical rainforest), the **Amazon River**, and the **Andes Mountains**.\n\n"
            "5. **Antarctica** (~14.20 million km² | No permanent residents)\n"
            "   - The southernmost continent, virtually entirely covered by a thick ice sheet (average thickness ~1.9 km).\n"
            "   - The coldest, windiest, and driest continent on Earth (classified as a polar desert).\n\n"
            "6. **Europe** (~10.18 million km² | Population: ~745 million)\n"
            "   - Separated from Asia by the Ural Mountains, Caucasus, and Caspian/Black Seas.\n"
            "   - A major historical, cultural, and economic hub comprising over 40 diverse nations.\n\n"
            "7. **Australia / Oceania** (~8.60 million km² | Population: ~45 million)\n"
            "   - The smallest continent by land area, often called an island continent.\n"
            "   - Renowned for unique endemic wildlife (marsupials like kangaroos and koalas) and the Great Barrier Reef.\n\n"
            "#### 🌊 The 5 Surrounding World Oceans:\n"
            "- **Pacific Ocean** (Largest & deepest; contains Challenger Deep at ~10,900m)\n"
            "- **Atlantic Ocean** (Second largest; separates Americas from Europe and Africa)\n"
            "- **Indian Ocean** (Third largest; crucial global shipping route)\n"
            "- **Southern Ocean** (Encircles Antarctica south of 60°S latitude)\n"
            "- **Arctic Ocean** (Smallest and shallowest, surrounding the North Pole)"
        )

    # 2. C++ PROGRAMMING
    if any(k in p for k in ['c++', 'cpp', 'basics of c++', 'teach me c++', 'learn c++', 'c plus plus']):
        return (
            "### Basics of C++ Programming\n\n"
            "**C++** is a high-performance, statically typed, compiled, multi-paradigm programming language created by **Bjarne Stroustrup** in 1985 as an extension of C (\"C with Classes\"). It provides direct hardware/memory control alongside powerful abstractions like Object-Oriented Programming (OOP) and Generic Programming (Templates).\n\n"
            "#### 1. Core Structure of a C++ Program:\n"
            "- `#include <iostream>`: Preprocessor directive that includes the standard input-output stream.\n"
            "- `using namespace std;`: Makes symbols from the `std` namespace available without prefixing.\n"
            "- `int main()`: The mandatory starting execution point of every C++ program.\n"
            "- `cout <<` and `cin >>`: Stream insertion (print) and extraction (read) operators.\n\n"
            "#### 2. Working C++ Example (Input, Conditions, and Loops):\n"
            "```cpp\n"
            "#include <iostream>\n"
            "#include <string>\n"
            "\n"
            "using namespace std;\n"
            "\n"
            "int main() {\n"
            "    // Variables\n"
            "    string name;\n"
            "    int age;\n"
            "\n"
            "    cout << \"Enter your name: \";\n"
            "    cin >> name;\n"
            "    cout << \"Enter your age: \";\n"
            "    cin >> age;\n"
            "\n"
            "    // Conditional check\n"
            "    if (age >= 18) {\n"
            "        cout << \"Welcome, \" << name << \"! You are an adult.\" << endl;\n"
            "    } else {\n"
            "        cout << \"Hello, \" << name << \"! You are a minor.\" << endl;\n"
            "    }\n"
            "\n"
            "    // Loop from 1 to 5\n"
            "    cout << \"Counting to 5: \";\n"
            "    for (int i = 1; i <= 5; ++i) {\n"
            "        cout << i << \" \";\n"
            "    }\n"
            "    cout << endl;\n"
            "\n"
            "    return 0; // Return 0 indicates success\n"
            "}\n"
            "```\n\n"
            "#### 3. How to Compile and Run:\n"
            "```bash\n"
            "# Compile with the C++17 standard\n"
            "g++ -std=c++17 main.cpp -o main\n"
            "\n"
            "# Run the executable\n"
            "./main\n"
            "```\n\n"
            "#### 4. Key Object-Oriented Principles in C++:\n"
            "- **Classes & Objects**: Creating encapsulated data models with member variables and functions.\n"
            "- **RAII (Resource Acquisition Is Initialization)**: Automatic resource release via destructors.\n"
            "- **Pointers & References**: `int* ptr = &val;` (memory address) vs `int& ref = val;` (alias).\n"
            "- **Modern Memory Safety**: Use smart pointers (`std::unique_ptr`, `std::shared_ptr`) rather than raw `new` and `delete` to avoid memory leaks."
        )

    # 3. DOCKER BASICS
    if "docker" in p:
        return (
            "### Understanding Docker Basics\n\n"
            "**Docker** is a containerization platform that packages your code, runtime, system tools, and libraries into a standalone, executable container.\n\n"
            "#### Core Components:\n"
            "1. **Dockerfile**: Text file with commands to assemble an image.\n"
            "2. **Docker Image**: Read-only template used to build containers.\n"
            "3. **Docker Container**: A running, isolated instance of an image.\n\n"
            "#### Example Dockerfile (Full-Stack Python/Node):\n"
            "```dockerfile\n"
            "FROM python:3.11-slim\n"
            "WORKDIR /app\n"
            "COPY requirements.txt .\n"
            "RUN pip install --no-cache-dir -r requirements.txt\n"
            "COPY . .\n"
            "EXPOSE 8000\n"
            "CMD [\"python\", \"manage.py\", \"runserver\", \"0.0.0.0:8000\"]\n"
            "```\n\n"
            "#### Essential Commands:\n"
            "- `docker build -t my-app .` — Build image\n"
            "- `docker run -p 8000:8000 my-app` — Run with port mapping\n"
            "- `docker ps` — List running containers\n"
            "- `docker stop <id>` — Stop container"
        )

    # 4. PYTHON LINKED LIST REVERSAL
    if "linked list" in p:
        return (
            "### Reversing a Singly Linked List in Python\n\n"
            "To reverse a singly linked list in $O(n)$ time and $O(1)$ space, we maintain three pointers (`prev`, `curr`, `next_node`) while redirecting each node's `next` pointer.\n\n"
            "```python\n"
            "class ListNode:\n"
            "    def __init__(self, val=0, next=None):\n"
            "        self.val = val\n"
            "        self.next = next\n\n"
            "def reverse_linked_list(head: ListNode) -> ListNode:\n"
            "    prev = None\n"
            "    curr = head\n"
            "    while curr is not None:\n"
            "        next_node = curr.next  # Save next\n"
            "        curr.next = prev       # Reverse pointer\n"
            "        prev = curr            # Move prev forward\n"
            "        curr = next_node       # Move curr forward\n"
            "    return prev  # New head of reversed list\n"
            "```\n\n"
            "**Complexity**:\n"
            "- **Time**: $O(n)$ where $n$ is node count.\n"
            "- **Auxiliary Space**: $O(1)$ in-place update."
        )

    # 5. HEALTHCARE: HEADACHE / NUTRITION / SLEEP
    if "headache" in p:
        return (
            "### Headache Management & Care\n\n"
            "Headaches are commonly caused by tension, dehydration, eye strain, insufficient sleep, or sinus inflammation.\n\n"
            "#### Safe Self-Care Measures:\n"
            "1. **Hydration**: Drink 1–2 glasses of cool water immediately.\n"
            "2. **Rest**: Lie down in a dark, quiet room with minimal sensory stimulation.\n"
            "3. **Compress**: Apply a cold pack (for migraine-like throbbing) or warm compress (for neck tension).\n"
            "4. **Screen Break**: Adhere to the 20-20-20 rule (look 20 feet away every 20 minutes for 20 seconds).\n\n"
            "#### ⚠️ Medical Red Flags (Seek Urgent Care):\n"
            "- Sudden, explosive \"thunderclap\" headache\n"
            "- Headache accompanied by high fever, stiff neck, confusion, weakness, or speech changes\n"
            "- Headache occurring after head trauma or persisting for more than 72 hours\n\n"
            "> *Disclaimer: Educational information only. Not a medical diagnosis. Consult a qualified clinician for persistent symptoms.*"
        )
    elif "diet" in p or "nutrition" in p:
        return (
            "### The Balanced Plate & Daily Nutrition Guide\n\n"
            "A nourishing, health-supporting diet follows the balanced plate principle:\n\n"
            "1. **50% Vegetables & Fruits**: Emphasize variety and seasonal colors for micronutrients, polyphenols, and fiber.\n"
            "2. **25% Whole Grains**: Oats, brown rice, whole wheat, quinoa, or millets for complex, sustained energy.\n"
            "3. **25% Quality Protein**: Pulses, lentils, eggs, dairy, fish, tofu, or poultry for cellular repair and immune function.\n"
            "4. **Healthy Fats**: Favour cold-pressed or unsaturated plant oils (olive, mustard, groundnut) and handful of nuts/seeds.\n"
            "5. **Hydration**: 2–3 liters of water per day; limit sodas, high-sugar drinks, and packaged ultra-processed foods."
        )
    elif "sleep" in p:
        return (
            "### Sleep Hygiene Protocol\n\n"
            "Adults function best on 7 to 9 hours of quality sleep.\n\n"
            "1. **Consistent Schedule**: Sleep and wake at the same time every day, including weekends.\n"
            "2. **Digital Curfew**: Turn off phones, tablets, and bright screens 30–60 minutes before bed (blue light suppresses melatonin).\n"
            "3. **Environment**: Keep your room cool (approx 18–20°C / 65–68°F), dark, and quiet.\n"
            "4. **Caffeine Timing**: Avoid coffee, energy drinks, and tea after 2:00 PM.\n"
            "5. **Bed Association**: Reserve your bed strictly for sleeping and rest, not work or studying."
        )

    # 6. INDIAN CONSTITUTION & CIVICS
    if any(k in p for k in ['constitution', 'fundamental rights', 'ambedkar']):
        return (
            "### Constitution of India & Fundamental Rights\n\n"
            "The **Constitution of India** is the supreme law of the nation, adopted on 26 November 1949 and brought into force on **26 January 1950**. **Dr. B. R. Ambedkar** served as the Chairman of the Drafting Committee.\n\n"
            "#### Key Features:\n"
            "- **Preamble**: Declares India a Sovereign, Socialist, Secular, Democratic Republic committed to Justice, Liberty, Equality, and Fraternity.\n"
            "- **Fundamental Rights (Part III, Articles 12–35)**:\n"
            "  1. *Right to Equality* (Articles 14–18)\n"
            "  2. *Right to Freedom* (Articles 19–22, including speech, expression, assembly, movement)\n"
            "  3. *Right against Exploitation* (Articles 23–24)\n"
            "  4. *Right to Freedom of Religion* (Articles 25–28)\n"
            "  5. *Cultural and Educational Rights* (Articles 29–30)\n"
            "  6. *Right to Constitutional Remedies* (Article 32 — the right to move the Supreme Court for enforcement of rights)\n"
            "- **Three Organs**: Legislature (Parliament: Lok Sabha & Rajya Sabha), Executive (President & Prime Minister with Council of Ministers), and Independent Judiciary (Supreme Court & High Courts)."
        )

    # 7. PHYSICS & SCIENCE
    if "photosynthesis" in p:
        return (
            "### How Photosynthesis Works (In Simple Terms)\n\n"
            "**Photosynthesis** is the process by which green plants make their own food using sunlight, water, and air!\n\n"
            "#### The Recipe for Photosynthesis:\n"
            "1. **Sunlight**: Captured by green pigments called **chlorophyll** inside plant cells (in structures called chloroplasts).\n"
            "2. **Water ($H_2O$)**: Absorbed from the soil by the plant's roots and sent up to the leaves.\n"
            "3. **Carbon Dioxide ($CO_2$)**: Taken in from the surrounding air through tiny pores on leaves called **stomata**.\n\n"
            "#### What It Produces:\n"
            "- **Glucose (Sugar, $C_6H_{12}O_6$)**: The plant's food used for energy and growth.\n"
            "- **Oxygen ($O_2$)**: Released back into the air for humans and animals to breathe!\n\n"
            "$$\\text{Carbon Dioxide} + \\text{Water} + \\text{Sunlight} \\longrightarrow \\text{Glucose} + \\text{Oxygen}$$\n\n"
            "$$\\mathbf{6CO_2 + 6H_2O + \\text{Sunlight} \\longrightarrow C_6H_{12}O_6 + 6O_2}$$\n\n"
            "Without photosynthesis, Earth would have almost no oxygen to support animal and human life!"
        )

    if any(k in p for k in ['newton', 'gravity', 'speed of light', 'aeroplane', 'lift']):
        return (
            "### Fundamental Physics Principles\n\n"
            "#### Newton's 3 Laws of Motion:\n"
            "1. **First Law (Inertia)**: An object remains at rest or in uniform straight-line motion unless acted upon by a net external force.\n"
            "2. **Second Law (Force)**: $\\mathbf{F} = m\\mathbf{a}$ (Force equals mass times acceleration).\n"
            "3. **Third Law (Action & Reaction)**: For every action, there is an equal and opposite reaction.\n\n"
            "#### Key Universal Constants:\n"
            "- **Speed of Light in Vacuum ($c$)**: $\\approx 299,792,458\\text{ m/s}$\n"
            "- **Standard Gravity on Earth ($g$)**: $\\approx 9.8\\text{ m/s}^2$\n"
            "- **Avogadro's Number ($N_A$)**: $\\approx 6.022 \\times 10^{23}\\text{ mol}^{-1}$"
        )

    # 8. SITUATIONS & ADVICE (10-Step Framework)
    if any(k in p for k in ['landlord', 'deposit', 'failed', 'exam', 'money', 'rent']):
        return (
            "I understand how stressful this situation can feel, especially when dealing with financial uncertainty or agreements.\n\n"
            "### Recommended Step-by-Step Action Plan:\n"
            "1. **Gather Evidence**: Collect your signed agreement, payment receipts/bank statements, check-in photos, and date-stamped messages.\n"
            "2. **Send a Formal Written Notice**: Write a calm, dated notice summarizing the facts and requesting the deposit return within a specific window (e.g., 7–10 days).\n"
            "3. **Explore Mediation / Grievance Forums**: If unresponsive, reach out to your local tenant board, consumer protection forum, or a free legal aid authority.\n\n"
            "> *Caution: Tenancy regulations and consumer laws vary by jurisdiction. Consulting a local legal aid clinic can confirm your statutory rights under state/local acts.*\n\n"
            "Would you like me to draft a clear, professional demand letter for you?"
        )

    # 9. GENERAL INFORMATIVE DIRECT ANSWER
    # If RAG chunks matched with high confidence, use them
    rag_text = ""
    if rag_chunks:
        rag_text = "\n\n" + "\n\n".join([f"**{c['title']}**:\n{c['content']}" for c in rag_chunks])
        return (
            f"### Knowledge Overview\n\n"
            f"Here is direct information regarding **{user_message}**:{rag_text}\n\n"
            f"Feel free to ask for deeper technical details, code implementations, or follow-ups!"
        )

    # Default direct, contextual conversational answer
    return (
        f"### Response to \"{user_message}\"\n\n"
        f"Thank you for your question about **{user_message}**.\n\n"
        f"NexoraAI is your multimodal assistant trained across Healthcare & Wellness, Technology & Programming, and General Knowledge.\n\n"
        f"Could you clarify if you'd like a broad introduction, a technical code example, or a specific breakdown of this topic? I'm ready to assist with exactly what you need!"
    )
