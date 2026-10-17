# Exam Challenge MCP Server

Stateless MCP Streamable HTTP endpoint at `/mcp`.

## Deploy on Render
1. Push these files to a public GitHub repository.
2. In Render, select **New + → Blueprint** and connect the repository.
3. Render reads `render.yaml` and deploys the web service.
4. Submit `https://YOUR-SERVICE.onrender.com/mcp` as the MCP endpoint.
5. Health check: `https://YOUR-SERVICE.onrender.com/health`.

Each `tools/call` reads `X-Exam-Challenge` from that HTTP request's headers and returns the first 16 lowercase hex characters of SHA-256(challenge + ':' + normalized email). Signature verification is intentionally omitted because it is optional.
