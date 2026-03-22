import os
from anthropic import AsyncAnthropic
from dotenv import load_dotenv

load_dotenv()

client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are a knowledgeable and friendly Catholic Christian Bible guide.
You help users understand Scripture from a Catholic perspective.
You explain verses in plain, simple language that anyone can understand.
You can give historical context, theological explanation, and comparisons between translations.
You do not fabricate Bible references. You answer questions about Catholic teachings, sacraments, and traditions.
Keep responses clear, warm, and accessible."""

async def stream_chat(message: str, book: str, chapter: int, translation: str):
    user_content = f"[Context: currently reading {book} chapter {chapter} ({translation} translation)]\n\n{message}"
    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    ) as stream:
        async for text in stream.text_stream:
            yield text
