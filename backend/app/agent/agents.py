import os
import sys
import httpx

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import certifi
os.environ["SSL_CERT_FILE"] = certifi.where()

import asyncio, time, json
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import (
    AgentServer,
    AgentSession,
    Agent,
    room_io,
)
from livekit.plugins import bey, deepgram, silero
from app.agent.tools import search_products, end_conversation
from app.agent.prompts import AGENT_INSTRUCTION, SESSION_INSTRUCTION

load_dotenv()

# 🔧 FORCE LOW LATENCY (NO DEPENDENCE ON ENV NOW)
LOW_LATENCY_MODE = True
# For 2–5s frontend connect: run this agent as a long-running worker (always warm); cold start adds 30–40s.

server = AgentServer()
USER_SILENCE_TIMEOUT = 300



class Assistant(Agent):
    def __init__(self, tools=None):
        super().__init__(instructions=AGENT_INSTRUCTION, tools=tools or [])
        self.last_user_time = time.time()
        self.session_active = True

        self.user_session = None
        self.user_avatar = None
        self.user_ctx = None
        self.pending_exit = False

        # 🔧 NEW: track speech activity
        self.user_speaking = False

    async def on_user_message(self, message: str):
        # This is called when the Agent has fully processed a turn
        # But we want to catch speech earlier
        self.last_user_time = time.time()
        self.user_speaking = False
        print("User (Final Message):", message)

    async def on_user_transcript(self, transcript):
        # 🔧 Handles both interim and final transcripts
        if hasattr(transcript, "text") and transcript.text.strip():
            self.last_user_time = time.time()
            self.user_speaking = True
            is_final = getattr(transcript, "final", False)
            print(f"Transcript ({'Final' if is_final else 'Interim'}): {transcript.text}")

    async def on_tool_result(self, name: str, result):
        if name == "end_conversation" and "CONVERSATION_ENDED" in result:
            self.pending_exit = True

            async def auto_kill():
                await asyncio.sleep(8.0)
                await end_session_gracefully(self)

            asyncio.create_task(auto_kill())


@server.rtc_session()
async def my_agent(ctx: agents.JobContext):
    try:
        print("🔗 Connecting to Room:", ctx.room.name)
        
        # Check keys
        if not os.getenv("DEEPGRAM_API_KEY"):
            print("❌ DEEPGRAM_API_KEY missing - STT/TTS will fail")
        
        # STT: Nova-2 Conversational AI
        stt = deepgram.STT(model="nova-2-conversationalai", language="en-US")

        # TTS: Aura Asteria
        tts = deepgram.TTS(model="aura-asteria-en")

        # VAD: aggressive chunking
        vad = silero.VAD.load(min_silence_duration=0.2)

        session = AgentSession(
            stt=stt,
            llm="google/gemini-3-flash-preview",
            tts=tts,
            vad=vad,
            preemptive_generation=True,  # Restore standard behavior
        )

        avatar = bey.AvatarSession(
            api_key=os.getenv("BEY_API_KEY"),
            avatar_id=os.getenv("BEY_AVATAR_ID"),
        )

        assistant = Assistant(tools=[search_products, end_conversation])
        assistant.user_session = session
        assistant.user_avatar = avatar
        assistant.user_ctx = ctx

        # Start silence monitor only for timeout
        asyncio.create_task(silence_monitor(assistant))

        await avatar.start(session, ctx.room)
        print("👤 Avatar started")

        noise_fn = (lambda _: None)

        await session.start(
            room=ctx.room,
            agent=assistant,
            room_options=room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    noise_cancellation=noise_fn
                ),
                close_on_disconnect=False
            ),
        )
        print("🎙️ Session started")

        # 🔧 DO NOT WAIT — START TALKING ASAP
        await session.generate_reply(
            instructions=SESSION_INSTRUCTION,
            allow_interruptions=True
        )

    except Exception as e:
        print("❌ Critical session error:", e)
        import traceback
        traceback.print_exc()


async def silence_monitor(agent: Assistant):
    # Monitor ONLY for session timeout (user away), not for speech end
    while agent.session_active:
        await asyncio.sleep(1.0) 

        if time.time() - agent.last_user_time > USER_SILENCE_TIMEOUT:
            print("⏱️ User silence timeout - ending session")
            await end_session_gracefully(agent, silent=True)
            break


async def end_session_gracefully(agent: Assistant, silent=False):
    if not agent.session_active:
        return

    agent.session_active = False
    ctx = agent.user_ctx
    avatar = agent.user_avatar
    session = agent.user_session

    try:
        try:
            internal_url = os.getenv("INTERNAL_API_URL", "http://127.0.0.1:8000")
            async with httpx.AsyncClient() as client:
                await client.post(f"{internal_url}/broadcast", json={"type": "END_SESSION"})
        except Exception as e:
            print("Broadcast failed:", e)

        if silent and session:
            await session.generate_reply(
                instructions="It seems you've stepped away. Closing the session now."
            )
            await asyncio.sleep(0.3)

        if ctx and ctx.room:
            payload = json.dumps({"type": "end_conversation"})
            await ctx.room.local_participant.publish_data(
                payload.encode("utf-8"),
                reliable=True,
            )
            await ctx.room.disconnect()

        if avatar:
            asyncio.create_task(avatar.stop())

    except Exception as e:
        print("Shutdown error:", e)


if __name__ == "__main__":
    agents.cli.run_app(server)
