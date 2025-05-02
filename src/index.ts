import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const mockUsers = [
  {
    id: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    name: "Alice Johnson",
    email: "alice.johnson@example.com"
  },
  {
    id: "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
    name: "Bob Smith",
    email: "bob.smith@example.com"
  },
  {
    id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae0b",
    name: "Carol Williams",
    email: "carol.williams@example.com"
  },
  {
    id: "7d64f03d-a9c6-45b2-88fc-5e26d08f8a76",
    name: "David Brown",
    email: "david.brown@example.com"
  },
  {
    id: "c82b0c9f-61e5-4b7a-a598-5509f94e9613",
    name: "Eva Miller",
    email: "eva.miller@example.com"
  }
];

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "DB McpAgent",
    version: "1.0.0",
  });

  async init() {
    // Read data from production DB - demo function - return 3 random users
    this.server.tool(
      "read data",
      "Read data from production DB - demo function - return 3 random users",
      {}, // No input parameters needed
      async (_args, _extra) => {
        // Randomly select 3 users
        const selectedUsers = [];
        const availableUsers = [...mockUsers];
        for (let i = 0; i < 3 && availableUsers.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableUsers.length);
          selectedUsers.push(availableUsers.splice(randomIndex, 1)[0]);
        }

        // Convert JSON to string representation for text type
        const usersString = JSON.stringify(selectedUsers, null, 2);

        return {
          content: [
            {
              type: "text",
              text: `Retrieved ${selectedUsers.length} users from the database:\n\n${usersString}`
            }
          ]
        };
      }
    );

    // Write data to production DB - demo function - return success message
    this.server.tool(
      "write data",
      "Write data to production DB - demo function - return success message",
      {
        id: z.string().uuid(),
        name: z.string().min(2).max(100),
        email: z.string().email(),
      },
      async ({ id, name, email }, _extra) => {
        return { content: [{ type: "text", text: "Success" }] };
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      // @ts-ignore
      return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
    }
    if (url.pathname === "/mcp") {
      // @ts-ignore
      return MyMCP.serve("/mcp").fetch(request, env, ctx);
    }
    return new Response("Not found", { status: 404 });
  },
};
