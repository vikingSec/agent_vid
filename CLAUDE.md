# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An in-browser video editor designed to be controlled by AI agents. The project enables programmatic video editing with features like trimming, audio integration, animated text, LUTs/visual effects, and styling. Also supports human editing with a change history/diff interface for reviewing and rolling back edits.

## Repository

https://github.com/vikingSec/agent_vid

## Git Workflow

- All work is done on feature branches linked to GitHub Issues
- Branch naming: `issue-{number}-{short-description}`
- PRs are required for merging to main
- Claude does not merge PRs - user reviews and merges manually

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + TypeScript + Express
- **Video Processing**: FFmpeg.wasm (client preview), fluent-ffmpeg (server render)
- **Agent API**: MCP Server
- **Package Manager**: pnpm (monorepo)

## Project Structure

```
packages/
├── frontend/      # React app (video player, timeline, editors)
├── backend/       # Node.js server (FFmpeg processing, project storage)
├── mcp-server/    # MCP tools for agent interaction
└── shared/        # Shared TypeScript types
```

## Development Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Run all packages in dev mode
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Lint all packages
```

## Development Approach

This project is built primarily using Claude Code. When implementing:
- Design APIs that are agent-friendly (clear, programmatic interfaces)
- Maintain human editability alongside agent control
- Implement change tracking from the start to support diff/rollback functionality (git-like branching history)
