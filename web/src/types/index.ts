// All TypeScript interfaces for ProveIt Web
// Source: ARCHITECTURE.md §4

// ─── Shared ───────────────────────────────────────────────────────────────────

export type Verdict = "SUPPORTED" | "WEAK" | "CONTRADICTED";

export type DiscoveryPhase =
  | "brain_dump"
  | "discovery"
  | "research"
  | "findings"
  | "complete";

// ─── Fast Check ───────────────────────────────────────────────────────────────

export interface AssumptionResult {
  assumption: string;
  category: "Desirability" | "Viability" | "Competition";
  verdict: Verdict;
  evidence: EvidenceItem[];
}

export interface EvidenceItem {
  source: string; // URL or source name
  finding: string; // what it shows
}

export interface FastResult {
  assumptions: AssumptionResult[];
  quickVerdict: string; // one-sentence summary of the biggest risk or strongest signal
  offerFullValidation: boolean; // always true — UI decision, not AI
}

// ─── Full Validation ──────────────────────────────────────────────────────────

export interface Message {
  id: string; // nanoid, client-generated
  role: "user" | "assistant";
  content: string;
  timestamp: number; // Date.now()
  isStreaming?: boolean; // true only during active stream, never persisted
}

export interface ConfidenceScores {
  desirability: number | null; // null = not yet scored
  viability: number | null;
  feasibility: number | null;
}

export interface KillSignal {
  type: "tarpit" | "saturation" | "no_switching" | "no_willingness_to_pay";
  evidence: string;
  detectedAt: number; // message index when signal was first flagged
}

export interface ValidationSession {
  id: string; // nanoid, created at session start
  ideaSummary: string; // 1-2 sentence summary, set after brain dump phase
  phase: DiscoveryPhase;
  messages: Message[];
  scores: ConfidenceScores;
  killSignals: KillSignal[];
  researchComplete: boolean;
  createdAt: number;
  updatedAt: number;
}

// ─── API Request / Response Shapes ────────────────────────────────────────────

export interface FastCheckRequest {
  idea: string; // validated: 10–2000 chars
}

export interface ChatRequest {
  sessionId: string;
  messages: Pick<Message, "role" | "content">[]; // stripped of client-only fields
  phase: DiscoveryPhase;
  scores: ConfidenceScores;
}

// Streaming events sent as line-delimited text
// Normal text deltas: raw text chunks (no wrapper)
// Special events: prefixed with `data: ` as JSON lines
export type StreamEvent =
  | { type: "phase_change"; phase: DiscoveryPhase }
  | { type: "scores"; scores: ConfidenceScores }
  | { type: "kill_signal"; signal: KillSignal }
  | { type: "searching"; active: boolean }
  | { type: "search_query"; query: string } // emitted when a web search query is ready to run
  | { type: "done" }
  | { type: "error"; message: string };

// ─── localStorage ─────────────────────────────────────────────────────────────

export interface StoredSession {
  version: 1; // schema version for future migrations
  session: ValidationSession;
}
