import json
import asyncio

class MedLlama2Service:
    def __init__(self):
        self.model_name = "medllama2:7b-q4_0"

    async def get_diagnosis(self, symptoms: str) -> dict:
        # Combine system message and prompt into one
        prompt = (
            "You are a medical AI. Analyze these symptoms and respond ONLY with the following: "
            "A short and specific diagnosis, "
            "a concise description of the diagnosis, "
            "possible treatment options, "
            "an urgency level based on the seriousness of the symptoms, "
            "and a confidence score for the diagnosis. "
            "Keep the response short."
            f"\nSymptoms: {symptoms}"
        )

        # Too longwinded, couldnt catch the strictly JSON format
            # "You are an experienced and responsible medical doctor. "
            # "Given the symptoms provided by the patient, identify the most likely diagnosis, "
            # "then provide a concise description of that diagnosis, "
            # "then list possible treatment options the patient can take, "
            # "and finally, give an urgency level based on how serious the symptoms are, " 
            # "and confidence score for the diagnosis based on how accurate the diagnosis is likely to be. "
            # "Always return the output strictly in JSON format with the following keys: "
            # "diagnosis, description, treatment_options, urgency, confidence_score. "
            # "Here is an example format:\n"
            # "{\n"
            # '  "diagnosis": "Influenza",\n'
            # '  "description": "A viral infection that attacks your respiratory system.",\n'
            # '  "treatment_options": "Rest, fluids, antiviral medications",\n'
            # '  "urgency": "Low",\n'
            # '  "confidence_score": "85%"\n'
            # "}\n"
            # f"Symptoms: {symptoms}"

        # Create async subprocess
        process = await asyncio.create_subprocess_exec(
            "ollama", "run", self.model_name, prompt,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        # Wait for the process to complete
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            raise RuntimeError(f"Ollama failed: {stderr.decode().strip()}")

        return stdout.decode().strip()