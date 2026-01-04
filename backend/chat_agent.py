import os
import threading
import time
from dataclasses import dataclass
from typing import Dict, Tuple, Any

import pandas as pd


DF_AGENT_SYSTEM_PROMPT = (
    "You are a DataFrame analysis assistant. Your job is to analyze the provided pandas "
    "DataFrame and answer questions about the dataset's details.\n\n"
    "Guidelines:\n"
    "- Use the DataFrame as the single source of truth. Do not guess or invent values.\n"
    "- When asked about data details, prefer concrete facts: column names, dtypes, "
    "row/column counts, missing values, unique counts, ranges, summary statistics, "
    "duplicates, and distributions.\n"
    "- If a question is ambiguous (e.g., unclear column name, timeframe, or grouping), "
    "ask a brief clarifying question.\n"
    "- If you compute statistics, compute them from the DataFrame (via pandas) "
    "and report the result clearly.\n"
    "- Keep responses concise and focused on the requested data detail."
)


@dataclass
class _CachedSession:
    agent: Any
    expires_at: float
    last_used_at: float


class DataFrameAgentManager:
    """Caches one LangChain pandas DataFrame agent per (user_id, file_id).

    Notes:
    - This uses in-memory storage. If you run multiple workers/containers,
      each one will have its own conversation state.
    """

    def __init__(self, *, ttl_seconds: int = 60 * 60, max_sessions: int = 128):
        self._ttl_seconds = ttl_seconds
        self._max_sessions = max_sessions
        self._lock = threading.Lock()
        self._sessions: Dict[Tuple[str, str], _CachedSession] = {}

    def get_agent(self, *, user_id: str, file_id: str, df: pd.DataFrame) -> Any:
        now = time.time()
        key = (user_id, file_id)

        with self._lock:
            session = self._sessions.get(key)
            if session and session.expires_at > now:
                session.last_used_at = now
                return session.agent

            # cleanup expired first
            self._sessions = {k: v for k, v in self._sessions.items() if v.expires_at > now}

            # evict LRU if needed
            if len(self._sessions) >= self._max_sessions:
                lru_key = min(self._sessions.items(), key=lambda kv: kv[1].last_used_at)[0]
                self._sessions.pop(lru_key, None)

            agent = _build_pandas_df_agent(df)
            self._sessions[key] = _CachedSession(
                agent=agent,
                expires_at=now + self._ttl_seconds,
                last_used_at=now,
            )
            return agent


def _build_pandas_df_agent(df: pd.DataFrame) -> Any:
    """Create a LangChain agent for Q&A over a pandas DataFrame."""

    # Imported lazily so importing the FastAPI app doesn't hard-fail
    # until you actually hit the chat endpoint.
    from langchain_classic.agents.agent_types import AgentType
    from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
    from langchain_openai import ChatOpenAI

    model = os.getenv("OPENAI_MODEL")
    if not model:
        raise ValueError("OPENAI_MODEL must be set (no default is configured)")
    temperature = float(os.getenv("OPENAI_TEMPERATURE", "0"))
    verbose = os.getenv("LANGCHAIN_VERBOSE", "false").lower() in {"1", "true", "yes"}

    llm = ChatOpenAI(model=model, temperature=temperature)

    agent = create_pandas_dataframe_agent(
        llm,
        df,
        prefix=DF_AGENT_SYSTEM_PROMPT,
        verbose=verbose,
        agent_type=AgentType.OPENAI_FUNCTIONS,
        agent_executor_kwargs={"handle_parsing_errors": True},
        allow_dangerous_code=True,
    )

    return agent


def invoke_agent(agent: Any, message: str) -> str:
    """Invoke an agent and normalize the output to a plain string."""

    # Newer LangChain uses dict inputs/outputs; some allow string input.
    result: Any
    try:
        result = agent.invoke({"input": message})
    except TypeError:
        result = agent.invoke(message)

    if isinstance(result, str):
        return result

    if isinstance(result, dict):
        # Common keys depending on version
        for key in ("output", "result", "answer", "text"):
            if key in result and result[key] is not None:
                return str(result[key])

    return str(result)


# Singleton manager used by the API router.
_df_agent_manager = DataFrameAgentManager()


def get_dataframe_agent(*, user_id: str, file_id: str, df: pd.DataFrame) -> Any:
    return _df_agent_manager.get_agent(user_id=user_id, file_id=file_id, df=df)
