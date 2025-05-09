from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Response
import httpx
import os
import json
import time

app = FastAPI()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

@app.post("/proxy")
async def proxy():
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": "You are a helpful assistant. This is a test environment. answer in korean or english or mixed."
            },
            {
                "role": "user",
                "content": "이 메시지는 테스트 중입니다. 5자 내의 무작위 텍스트를 생성해주세요."
            }
        ],
        "max_tokens": 5
    }
    start = time.time()
    async with httpx.AsyncClient() as client:
        r = await client.post(url, headers=headers, content=json.dumps(payload))
    elapsed = int((time.time() - start) * 1000)
    return Response(content=r.content, media_type="application/json", headers={"External-Api-Time": str(elapsed)})