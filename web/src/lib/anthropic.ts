import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Singleton client — created once, reused across requests
// This file is server-only: importing it in a Client Component will throw a build error
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
