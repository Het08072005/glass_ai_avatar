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
    inference,
)
from livekit.plugins import bey, deepgram, silero
from tools import search_products, end_conversation
from prompts import AGENT_INSTRUCTION, SESSION_INSTRUCTION

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
        self.last_user_time = time.time()
        self.user_speaking = False
        print("User:", message)

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
        # STT: Nova-2 Conversational AI = fastest for voice agents (realtime streaming)
        stt = inference.STT(model="deepgram/nova-2-conversationalai", language="en-US")

        # TTS: Aura Asteria = high quality, fast
        tts = deepgram.TTS(model="aura-asteria-en")

        # VAD: aggressive chunking — shorter silence = faster first word (0.2s)
        vad = silero.VAD.load(min_silence_duration=0.2)

        session = AgentSession(
            stt=stt,
            llm="google/gemini-3-flash-preview",
            tts=tts,
            vad=vad,
            preemptive_generation=True,  # Start LLM/TTS as soon as transcript ready
        )

        avatar = bey.AvatarSession(
            api_key=os.getenv("BEY_API_KEY"),
            avatar_id=os.getenv("BEY_AVATAR_ID"),
        )

        assistant = Assistant(tools=[search_products, end_conversation])
        assistant.user_session = session
        assistant.user_avatar = avatar
        assistant.user_ctx = ctx

        asyncio.create_task(silence_monitor(assistant))

        await avatar.start(session, ctx.room)

        # 🔧 TRANSCRIPT HOOK (CRITICAL)
        @session.on("user_transcript")
        def on_transcript(transcript):
            if hasattr(transcript, "text") and transcript.text.strip():
                assistant.last_user_time = time.time()
                assistant.user_speaking = True
                print("Transcript:", transcript.text)

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

        # 🔧 DO NOT WAIT — START TALKING ASAP
        await session.generate_reply(
            instructions=SESSION_INSTRUCTION,
            allow_interruptions=True      # 🔧 BIG WIN
        )

    except Exception as e:
        print("Critical session error:", e)


async def silence_monitor(agent: Assistant):
    while agent.session_active:
        await asyncio.sleep(0.05)  # Check every 50ms for ultra-fast reply trigger

        # 🔧 IF USER STOPPED SPEAKING → FORCE RESPONSE (0.20s = aggressive chunking, faster reply)
        if agent.user_speaking and time.time() - agent.last_user_time > 0.20:
            agent.user_speaking = False
            await agent.user_session.generate_reply()

        if time.time() - agent.last_user_time > USER_SILENCE_TIMEOUT:
            await end_session_gracefully(agent, silent=True)
            # Break to stop monitoring
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
