import os
from typing import Dict, Any

from openai import OpenAI
from dotenv import load_dotenv, find_dotenv

# IN DEVELOPMENT, this loads variables from .env.local into the environment
load_dotenv(find_dotenv(".env.local"))

class OpenAIContentService:

    def __init__(self) -> None:
        # IN PRODUCTION, WORKS WITH ENV VARIABLE SET IN VM CONFIG PANEL
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY is not set")
        self.client = OpenAI(api_key=api_key)

    async def generate(self, prompt: str, content_type: str) -> Dict[str, Any]:
        system_prompt = self._build_system_prompt(content_type)

        completion = self.client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=800,
        )

        raw_content = completion.choices[0].message.content or ""

        try:
            import json
            parsed = json.loads(raw_content)
        except Exception:
            parsed = {"title": "OpenAI went through, response erorr"}

        return {"content": parsed}

    def _build_system_prompt(self, content_type: str) -> str:
        if content_type == "workout":
            return (
                "You are a professional fitness trainer.\n"
                "Create a detailed workout plan based on the user's requirements.\n"
                "Respond with ONLY a valid JSON object.\n"
                "Do not include any text outside the JSON object.\n\n"
                "The JSON should be in this exact format:\n"
                '{ "title": "<workout name>",\n'
                '  "exercises": [\n'
                '    {"name": "<exercise 1>", "sets_reps": "<sets and reps>"},\n'
                '    {"name": "<exercise 2>", "sets_reps": "<sets and reps>"},\n'
                '    ...]\n'
                '  "rest": "<time between sets> minutes between sets",\n'
                '  "safety": ["<safety tip 1>", "<safety tip 2>", ...],\n'
                '  "time": "<total workout time in minutes> minutes",\n'
                '  "calories_burned": "<estimated calories burned in kcal> kcal"\n'
                '}'
            )
        else:
            return (
                "You are a professional nutritionist and chef.\n"
                "Create a detailed healthy recipe based on the user's requirements.\n"
                "Respond with ONLY a valid JSON object.\n"
                "Do not include any text outside the JSON object.\n\n"
                "The JSON should be in this exact format:\n"
                '{ "title": "<recipe name>",\n'
                '  "ingredients": [\n'
                '    {"name": "<ingredient 1>", "quantity": "<quantity>"},\n'
                '    {"name": "<ingredient 2>", "quantity": "<quantity>"},\n'
                '    ...],\n'
                '  "instructions": ["<step 1>", "<step 2>", ...],\n'
                '  "time": "<total time in minutes> minutes",\n'
                '  "servings": "<number of servings> servings",\n'
                '  "nutrition": {\n'
                '    "calories": "<calories in kcal> kcal",\n'
                '    "protein": "<protein in grams>g",\n'
                '    "carbs": "<carbs in grams>g",\n'
                '    "fats": "<fat in grams>g"\n'
                '  }\n'
                '}'
            )


