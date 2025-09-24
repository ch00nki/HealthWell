from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
import os

class FlanService:
    # set up the class variables and prepare it for use
    def __init__(self):
        # Path to your trained model directory (relative to this file)
        MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "flan_t5_large_diagnosis_v2")
        # self. stores it in instance of class
        self.tokenizer = T5Tokenizer.from_pretrained(MODEL_DIR)
        self.model = T5ForConditionalGeneration.from_pretrained(MODEL_DIR)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self.model.to(self.device)

    async def get_diagnosis(self, symptoms: str) -> str:
        prompt = f"You are an experienced medical doctor. Given the following symptoms, provide the most likely diagnosis. Symptoms: {symptoms}"
        inputs = self.tokenizer(prompt, return_tensors="pt", max_length=256, truncation=True)
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=64,
                num_beams=4,
                early_stopping=True
            )
        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)
