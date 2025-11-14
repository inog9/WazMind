import os
import re
import time
import logging
from openai import OpenAI
from typing import List

logger = logging.getLogger(__name__)

class GroqClient:
    _instance = None
    _client = None
    _model_name = None
    
    def __new__(cls):
        """Singleton pattern to reuse client instance"""
        if cls._instance is None:
            cls._instance = super(GroqClient, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Only initialize client once (singleton pattern)
        if GroqClient._client is not None:
            self.client = GroqClient._client
            self.model_name = GroqClient._model_name
            return
            
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set")
        
        # Use OpenAI SDK with Groq base URL (OpenAI-compatible API)
        self._client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
            timeout=60.0,  # 60 second timeout
        )
        GroqClient._client = self._client
        
        # Recommended models for Wazuh rule generation (ordered by preference)
        # Based on limits: llama-4-scout-17b has best tokens/min (30K), llama-3.3-70b has best quality
        recommended_models = [
            "meta-llama/llama-4-scout-17b-16e-instruct",  # Best balance: 30K tokens/min, 500K tokens/day
            "llama-3.3-70b-versatile",  # Best quality: 70B params, 12K tokens/min
            "llama-3.1-8b-instant",  # Fastest: 14.4K requests/day, 500K tokens/day
            "openai/gpt-oss-20b",  # Alternative OpenAI model
            "qwen/qwen3-32b",  # Alternative: 60 req/min, 6K tokens/min
        ]
        
        # Get model from env or use default
        model_name = os.getenv("GROQ_MODEL")
        
        if not model_name:
            # Use recommended model (llama-4-scout-17b for best balance)
            model_name = recommended_models[0]
            logger.info(f"No GROQ_MODEL specified, using recommended model: {model_name}")
        else:
            # Log if model is not in recommended list (but still allow it)
            if model_name not in recommended_models:
                logger.info(f"Using custom model: {model_name} (not in recommended list)")
        
        self.model_name = model_name
        self.client = self._client
        GroqClient._model_name = model_name
        logger.info(f"Using Groq model: {self.model_name}")
    
    def generate_wazuh_rule(self, sample_lines: List[str]) -> str:
        """Generate Wazuh rule from log samples using Groq API"""
        
        sample_text = "\n".join(sample_lines[:50])  # Limit to 50 lines
        
        prompt = f"""You are a Wazuh rule creation expert.

IMPORTANT: Before creating a new rule, check if a similar rule already exists in the official Wazuh-Rules repository:
https://github.com/socfortress/Wazuh-Rules

This repository contains advanced Wazuh detection rules for various integrations including:
- Sysmon (Windows/Linux)
- Office365, Microsoft Defender
- Sophos, Crowdstrike, F-Secure
- Suricata, Packetbeat, Falco
- Yara, Osquery, MISP
- Windows PowerShell, Auditd
- And many more integrations

If a similar rule exists in that repository, adapt or reference it instead of creating a duplicate.
Only create a NEW rule if no suitable existing rule is found.

Given the following example log lines:
{sample_text}

Generate a valid Wazuh rule in XML format that detects similar patterns.
Include:
- unique rule id (>=100000)
- level (10–12)
- description
- decoder name if possible
- pattern matching for the log structure

If you're adapting an existing rule from the repository, mention it in the description.

Return ONLY XML rule, no explanations. The XML should be properly formatted and valid.

Example format:
<rule id="100001" level="10">
    <decoder>custom_decoder</decoder>
    <regex>pattern here</regex>
    <description>Description of what this rule detects</description>
</rule>
"""
        
        max_retries = 3
        retry_delay = 2  # Start with 2 seconds (Groq is faster)
        
        for attempt in range(max_retries):
            try:
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert in Wazuh security rules and XML formatting. Always return valid XML without markdown code blocks."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.3,  # Lower temperature for more consistent, focused output
                    max_tokens=2000,
                )
                
                rule_xml = response.choices[0].message.content.strip()
                
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
                                    retry_delay = int(float(match.group(1))) + 1  # Add 1 second buffer
                            except:
                                retry_delay = min(retry_delay * 2, 30)  # Exponential backoff, max 30s
                        else:
                            retry_delay = min(retry_delay * 2, 30)  # Exponential backoff
                        
                        logger.warning(f"Rate limit/quota exceeded. Retrying in {retry_delay} seconds (attempt {attempt + 1}/{max_retries})")
                        time.sleep(retry_delay)
                        continue
                    else:
                        # Last attempt failed
                        user_friendly_msg = "Groq API rate limit exceeded. "
                        user_friendly_msg += "Please check your API quota or try again later. "
                        user_friendly_msg += "You can also try a different model with higher limits."
                        raise Exception(f"Error generating rule with Groq: {user_friendly_msg}")
                else:
                    # Other errors - don't retry
                    raise Exception(f"Error generating rule with Groq: {str(e)}")
        
        # Should not reach here, but just in case
        raise Exception("Error generating rule with Groq: Max retries exceeded")

