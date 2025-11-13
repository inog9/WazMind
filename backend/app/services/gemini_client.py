import os
import re
import time
import logging
import google.generativeai as genai
from typing import List

logger = logging.getLogger(__name__)

class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        
        genai.configure(api_key=api_key)
        
        # List available models to find the right one
        available_models = []
        try:
            models = genai.list_models()
            for model in models:
                # Filter models that support generateContent
                if 'generateContent' in model.supported_generation_methods:
                    model_name = model.name.replace('models/', '')  # Remove models/ prefix
                    available_models.append(model_name)
            logger.info(f"Available Gemini models with generateContent: {available_models}")
        except Exception as e:
            logger.warning(f"Could not list models: {str(e)}")
            # Use default fallback list
            available_models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"]
        
        # Try to initialize model - use first available or env specified
        model_name = os.getenv("GEMINI_MODEL")
        if not model_name and available_models:
            model_name = available_models[0]  # Use first available model
        
        if not model_name:
            model_name = "gemini-1.5-flash"  # Ultimate fallback
        
        # Try to initialize the model
        self.model = None
        models_to_try = [model_name] if model_name else []
        models_to_try.extend([m for m in available_models if m != model_name])
        
        # Also try with models/ prefix
        models_to_try.extend([f"models/{m}" for m in models_to_try if not m.startswith("models/")])
        
        for model_to_try in models_to_try:
            try:
                logger.info(f"Trying to initialize model: {model_to_try}")
                self.model = genai.GenerativeModel(model_to_try)
                logger.info(f"Successfully initialized model: {model_to_try}")
                break
            except Exception as e:
                logger.warning(f"Failed to initialize {model_to_try}: {str(e)}")
                continue
        
        if not self.model:
            error_msg = f"Could not initialize any Gemini model. Tried: {models_to_try}. Available models: {available_models}"
            logger.error(error_msg)
            raise ValueError(error_msg)
    
    def generate_wazuh_rule(self, sample_lines: List[str]) -> str:
        """Generate Wazuh rule from log samples using Gemini API"""
        
        sample_text = "\n".join(sample_lines[:50])  # Limit to 50 lines
        
        prompt = f"""You are a Wazuh rule creation expert.

Given the following example log lines:
{sample_text}

Generate a valid Wazuh rule in XML format that detects similar patterns.
Include:
- unique rule id (>=100000)
- level (10–12)
- description
- decoder name if possible
- pattern matching for the log structure

Return ONLY XML rule, no explanations. The XML should be properly formatted and valid.

Example format:
<rule id="100001" level="10">
    <decoder>custom_decoder</decoder>
    <regex>pattern here</regex>
    <description>Description of what this rule detects</description>
</rule>
"""
        
        max_retries = 3
        retry_delay = 5  # Start with 5 seconds
        
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                rule_xml = response.text.strip()
                
                # Clean up response (remove markdown code blocks if present)
                if rule_xml.startswith("```xml"):
                    rule_xml = rule_xml[6:]
                if rule_xml.startswith("```"):
                    rule_xml = rule_xml[3:]
                if rule_xml.endswith("```"):
                    rule_xml = rule_xml[:-3]
                
                return rule_xml.strip()
                
            except Exception as e:
                error_str = str(e)
                
                # Check for quota/rate limit errors
                if "429" in error_str or "quota" in error_str.lower() or "rate limit" in error_str.lower():
                    if attempt < max_retries - 1:
                        # Extract retry delay from error if available
                        if "retry in" in error_str.lower():
                            try:
                                # Try to extract seconds from error message
                                match = re.search(r'retry in ([\d.]+)s', error_str.lower())
                                if match:
                                    retry_delay = int(float(match.group(1))) + 2  # Add 2 seconds buffer
                            except:
                                retry_delay = min(retry_delay * 2, 60)  # Exponential backoff, max 60s
                        else:
                            retry_delay = min(retry_delay * 2, 60)  # Exponential backoff
                        
                        logger.warning(f"Rate limit/quota exceeded. Retrying in {retry_delay} seconds (attempt {attempt + 1}/{max_retries})")
                        time.sleep(retry_delay)
                        continue
                    else:
                        # Last attempt failed
                        user_friendly_msg = "Gemini API quota exceeded. "
                        if "free_tier" in error_str.lower():
                            user_friendly_msg += "You've reached the free tier limit. "
                        user_friendly_msg += "Please check your API quota at https://ai.dev/usage or upgrade your plan. "
                        user_friendly_msg += "You can also try again later."
                        raise Exception(f"Error generating rule with Gemini: {user_friendly_msg}")
                else:
                    # Other errors - don't retry
                    raise Exception(f"Error generating rule with Gemini: {str(e)}")
        
        # Should not reach here, but just in case
        raise Exception("Error generating rule with Gemini: Max retries exceeded")

