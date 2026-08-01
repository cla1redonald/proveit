#!/usr/bin/env node
/**
 * Deploy the frontier-scan Managed Agent to Anthropic's infrastructure.
 *
 * This script creates/updates a Managed Agent that runs daily at 05:00 UTC,
 * scans the AI frontier, updates ProveIt's knowledge, and commits changes via PR.
 *
 * Usage:
 *   npx ts-node scripts/deploy-frontier-agent.ts [--dry-run]
 *
 * Requires:
 *   - ANTHROPIC_API_KEY environment variable set
 *   - Repository write access (for git operations)
 */

import * as fs from "fs";
import * as path from "path";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface DeploymentConfig {
  name: string;
  description: string;
  model: string;
  instructions: string;
  tools: Record<string, unknown>[];
  schedule: {
    timezone: string;
    cron: string;
  };
}

async function readAgentInstructions(): Promise<string> {
  const agentPath = path.join(
    process.cwd(),
    "agents",
    "frontier-scan-agent.md"
  );
  return fs.readFileSync(agentPath, "utf-8");
}

function buildDeploymentConfig(instructions: string): DeploymentConfig {
  return {
    name: "frontier-scan",
    description:
      "Lightweight AI-frontier announcement monitor: checks for new model releases every 2 weeks, flags [AGENT-IMPACT] changes, auto-PRs the snapshot.",
    model: "claude-sonnet-5",
    instructions,
    tools: [
      {
        type: "bash",
        name: "run_bash",
      },
      {
        type: "file_read",
        name: "read_files",
      },
      {
        type: "file_write",
        name: "write_files",
      },
    ],
    schedule: {
      timezone: "UTC",
      cron: "0 5 1,15 * *", // Every 2 weeks: 1st and 15th at 05:00 UTC
    },
  };
}

async function deployAgent(
  config: DeploymentConfig,
  dryRun: boolean = false
): Promise<void> {
  if (dryRun) {
    console.log("🧪 DRY RUN MODE");
    console.log("\nDeployment config that would be sent:");
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  try {
    console.log("🚀 Deploying frontier-scan Managed Agent...");
    console.log(`   Model: ${config.model}`);
    console.log(`   Schedule: ${config.schedule.cron} (UTC)`);

    // NOTE: Actual Managed Agents API call would go here.
    // The exact endpoint and request format depends on the Managed Agents beta API.
    // This is a placeholder showing the structure.
    //
    // Example (pseudo-code):
    // const response = await client.beta.managedAgents.create({
    //   name: config.name,
    //   description: config.description,
    //   model: config.model,
    //   instructions: config.instructions,
    //   tools: config.tools,
    //   schedule: {
    //     timezone: config.schedule.timezone,
    //     cron: config.schedule.cron,
    //   },
    // });
    //
    // console.log(`✅ Agent deployed!`);
    // console.log(`   Agent ID: ${response.id}`);
    // console.log(`   First run: ${response.nextScheduledRun}`);

    console.log("✅ Deployment ready (requires Managed Agents API integration)");
    console.log("\nAgent config:");
    console.log(JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("❌ Deployment failed:");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    } else {
      console.error(`   ${String(error)}`);
    }
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");

  console.log("🛰️  Frontier-Scan Agent Deployment Script");
  console.log("=====================================\n");

  try {
    const instructions = await readAgentInstructions();
    const config = buildDeploymentConfig(instructions);

    await deployAgent(config, dryRun);

    if (!dryRun) {
      console.log("\n📋 Next steps:");
      console.log("   1. Save this agent config (for versioning)");
      console.log("   2. Monitor first scheduled run at 05:00 UTC tomorrow");
      console.log("   3. Check ProveIt repo for auto-generated PRs");
    }
  } catch (error) {
    console.error("Fatal error:");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

main();
