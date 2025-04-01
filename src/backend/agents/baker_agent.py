from autogen_core.base import AgentId
from autogen_core.components.models import AzureOpenAIChatCompletionClient
from autogen_core.components.tools import Tool
from autogen_core.components.tool_agent import ToolAgent
from agents.base_agent import BaseAgent
from typing import List
from context.cosmos_memory import CosmosBufferedChatCompletionContext

# Define Baker tools (functions)
async def bake_cookies(cookie_type: str, quantity: int) -> str:
    return f"Baked {quantity} {cookie_type} cookies."

async def prepare_dough(dough_type: str) -> str:
    return f"Prepared {dough_type} dough."

# Function to return Baker tools
def get_baker_tools() -> List[Tool]:
    from autogen_core.components.tools import FunctionTool

    return [
        FunctionTool(
            bake_cookies,
            description="Bake cookies of a specific type.",
            name="bake_cookies",
        ),
        FunctionTool(
            prepare_dough,
            description="Prepare dough of a specific type.",
            name="prepare_dough",
        ),
    ]

# Define the BakerAgent class
class BakerAgent(BaseAgent):
    def __init__(
        self,
        model_client: AzureOpenAIChatCompletionClient,
        session_id: str,
        user_id: str,
        memory: CosmosBufferedChatCompletionContext,
        tools: List[Tool],
        agent_id: AgentId,
    ):
        super().__init__(
            "BakerAgent",
            model_client,
            session_id,
            user_id,
            memory,
            tools,
            agent_id,
            system_message="You are an AI Agent specialized in baking tasks. You can bake cookies and prepare dough based on user requests.",
        )
