import asyncio
import json
import re

class MedGemma4BService:
	def __init__(self):
		# Ensure this model is available locally: `ollama pull medgemma:4b`
		# self.model_name = "alibayram/medgemma:4b"
		self.model_name = "amsaravi/medgemma-4b-it:q6"

	async def get_diagnosis(self, symptoms: str) -> str:
		# prompt = (
		# 	"You are a medical AI. Analyze these symptoms and respond with a short, specific diagnosis, "
		# 	"a concise description, possible treatment options, an urgency level, and a confidence score.\n"
		# 	f"Symptoms: {symptoms}"
		# )
		prompt = (
			"You are a medical AI. "
			"Analyze the given symptoms and respond ONLY with a valid JSON object. "
			"Do not include any text outside the JSON. "
			"The JSON must have this exact structure:\n"
			"{\n"
			'  "diagnosis": "<specific diagnosis>",\n'
			'  "description": "<short description>",\n'
			'  "treatment_options": ["<treatment1>", "<treatment2>", "..."],\n'
			'  "urgency": "<urgency level>",\n'
			'  "confidence_score": <number between 0 and 100>\n'
			"}\n\n"
			f"Symptoms: {symptoms}"
		)


		process = await asyncio.create_subprocess_exec(
			"ollama", "run", self.model_name, prompt,
			stdout=asyncio.subprocess.PIPE,
			stderr=asyncio.subprocess.PIPE,
		)

		stdout, stderr = await process.communicate()

		if process.returncode != 0:
			raise RuntimeError(f"Ollama failed: {stderr.decode().strip()}")

		# return stdout.decode().strip()
		output = stdout.decode().strip()

		# Remove markdown code blocks if present
		output = re.sub(r'```json\n|\n```', '', output)
	
		try:
			return json.loads(output)
		except json.JSONDecodeError:
			return {
				"diagnosis": "Response Format Error",
				"description": output[:500],
				"treatment_options": [],
				"urgency": "unknown",
				"confidence_score": "0"
			}


