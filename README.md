<div align="center">

<img src="./icons/openmcp.png" height="200px"/>

<h3>OpenMCP: All you need for MCP Development</h3>

English | [中文](./README.zh.md)

<a href="https://kirigaya.cn/openmcp" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: rgb(84, 176, 84); color: white; border-radius: .5em; text-decoration: none;"> 📄 OpenMCP Documentation</a>

<a href="https://qm.qq.com/cgi-bin/qm/qr?k=C6ZUTZvfqWoI12lWe7L93cWa1hUsuVT0&jump_from=webapi&authKey=McW6B1ogTPjPDrCyGttS890tMZGQ1KB3QLuG4aqVNRaYp4vlTSgf2c6dMcNjMuBD" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #CB81DA; color: white; border-radius: .5em; text-decoration: none;">OpenMCP QQ Group</a>

<a href="https://discord.gg/SKTZRf6NzU" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: rgb(84, 176, 84); color: white; border-radius: .5em; text-decoration: none;">OpenMCP Discord Channel</a>

</div>

## OpenMCP

An all-in-one vscode/trae/cursor plugin for MCP server debugging.

[![IMAGE ALT TEXT HERE](https://pic1.zhimg.com/80/v2-951261f789708621a2c34faa5fa6f330_1440w.png)](https://www.youtube.com/watch?v=S7igsEhcLiw)
### [👆 Full Video](https://www.youtube.com/watch?v=S7igsEhcLiw)

Integrated Inspector + MCP client basic functions, combining development and testing into one.

![](./icons/openmcp.welcome.png)

Test resource protocols, tools, and Prompts for MCP servers.

![](./icons/openmcp.resource.png)

Tested tools can be placed in the "Interactive Testing" module for large model interaction testing.

![](./icons/openmcp.chatbot.png)

Complete project-level management panel for easier MCP project management at both project and global levels.

![](./icons/openmcp.management.png)

Supports multiple large models

![](./icons/openmcp.support.llm.png)

## TODO

## Feature Roadmap

| Module | Feature | Priority | Status | Fix Priority |
|---------|---------|--------|---------|-----------|
| `all` | Complete basic infrastructure | `Full Version` | 100% | `Done` |
| `render` | Support cost analysis in chat mode | `Iteration` | 100% | `Done` |
| `ext` | Support basic MCP project management | `Iteration` | 100% | `P0` |
| `service` | Support custom OpenAI-compatible large model integration | `Full Version` | 100% | `Done` |
| `service` | Support custom protocol large model integration | `MVP` | 0% | `P1` |
| `all` | Support debugging multiple MCP Servers simultaneously | `MVP` | 100% | `P0` |
| `all` | Support online verification via large models | `Iteration` | 100% | `Done` |
| `all` | Support saving user's server debugging work | `Iteration` | 100% | `Done` |
| `render` | High-risk operation permission confirmation | `MVP` | 0% | `P1` |
| `service` | Hot update for connected MCP servers | `MVP` | 0% | `P1` |
| `service` | Cloud sync for system configuration | `MVP` | 0% | `P1` |
| `all` | System prompt management module | `Iteration` | 100% | `Done` |
| `service` | Tool-wise logging system | `MVP` | 0% | `P1` |
| `service` | MCP security checks (prevent prompt injection, etc.) | `MVP` | 0% | `P1` |
| `service` | Built-in OCR for character recognition | `Iteration` | 100% | `Done` |

## Project Concept

OpenMCP adopts a layered modular design. By assembling different modules, it can be implemented in different modes on different platforms.

```mermaid
flowchart TD
    subgraph OpenMCP Core Components
        renderer[Renderer]
        openmcpservice[OpenMCPService]
    end

    subgraph OpenMCP_Web["OpenMCP Web"]
        renderer
        openmcpservice
        nginx[Nginx]
    end

    subgraph OpenMCP_Plugin["OpenMCP Plugin"]
        renderer
        openmcpservice
        vscode[VSCode Plugin Code]
    end

    subgraph OpenMCP_App["OpenMCP App"]
        renderer
        openmcpservice
        electron[Electron Code]
    end

    subgraph QQBot["OpenMCP-based QQ Bot"]
        lagrange[Lagrange.OneBot]
        openmcpservice
    end

    %% Dependencies
    OpenMCP_Web -->|Frontend Rendering| renderer
    OpenMCP_Web -->|Backend Service| openmcpservice
    OpenMCP_Web -->|Reverse Proxy| nginx

    OpenMCP_Plugin -->|UI Interface| renderer
    OpenMCP_Plugin -->|Core Logic| openmcpservice
    OpenMCP_Plugin -->|IDE Integration| vscode

    OpenMCP_App -->|Frontend UI| renderer
    OpenMCP_App -->|Local Service| openmcpservice
    OpenMCP_App -->|Desktop Packaging| electron

    QQBot -->|Protocol Adaptation| lagrange
    QQBot -->|Business Logic| openmcpservice
```

## Development
- renderer : Frontend UI definitions
- service : Test components for renderer , including a simple forwarding layer
- src : VSCode plugin definitions

### Renderer & Service Development

```mermaid
flowchart LR
D[renderer] <--> A[Dev Server] 
<--ws--> B[service]
B <--mcp--> m(MCP Server)
```
Project setup:

```bash
npm run setup
```
Start dev server:

```bash
npm run serve
```

### Extension Development

```mermaid
flowchart LR
D[renderer] <--> A[extention.ts] <--> B[service]
B <--mcp--> m(MCP Server)
```

Build for deployment:

```bash
npm run build
```

build vscode extension:

```bash
npm run build:plugin
```

Then just press F5, いただきます (Let's begin)
