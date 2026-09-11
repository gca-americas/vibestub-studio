import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { In, StepHeader } from "../components/shared";
import { COLORS } from "./colors";
import { SnakeGraph } from "./Overview";

/*
 * Step 10: the whole workflow, and every concept it carries. Hover a node
 * for what it taught and where; the pulse walks the graph the way a run does.
 */

const PURPLE = COLORS.purple;

type Kind = "start" | "func" | "join" | "agent" | "human" | "router" | "task" | "desk";

interface NodeInfo {
  name: string;
  kind: Kind;
  step: string;
  to: string;
  concepts: string[];
}

const NODES: NodeInfo[] = [
  {
    name: "START",
    kind: "start",
    step: "Step 4a · Graph architecture and execution chains",
    to: "/step/fan-out/a",
    concepts: [
      "Workflow graph initialization and edge list definition",
      "START sentinel routing concurrent root execution chains",
      "Tuple-based linear subgraphs composed into an execution DAG",
    ],
  },
  {
    name: "scan_trends",
    kind: "func",
    step: "Step 4b · Parallel research fan-out",
    to: "/step/fan-out/b",
    concepts: [
      "Deterministic FunctionNode that receives node_input and emits Event(output=...)",
      "Concurrent edge traversal from START executed in parallel",
      "Dynamic trend ingestion into structured context dictionaries",
    ],
  },
  {
    name: "read_backlog",
    kind: "func",
    step: "Step 4b · Parallel research fan-out",
    to: "/step/fan-out/b",
    concepts: [
      "Local file ingestion of creator backlog context",
      "Resolves idea_text from initial invocation payload",
      "Stateless node execution shared between development and production",
    ],
  },
  {
    name: "read_feedback",
    kind: "func",
    step: "Step 7b · The third reader",
    to: "/step/rag/b",
    concepts: [
      "GEAP RAG Engine corpus integration with dense vector search",
      "Semantic similarity query for context-driven passage retrieval",
      "Parallel retrieval reader feeding directly into JoinNode synchronization",
    ],
  },
  {
    name: "join_research",
    kind: "join",
    step: "Step 4b · Parallel research fan-out",
    to: "/step/fan-out/b",
    concepts: [
      "JoinNode synchronization barrier awaiting all incoming inbound edges",
      "Aggregates branch outputs into a unified dictionary keyed by node name",
      "Modular edge topology where adding research branches requires a single edge definition",
    ],
  },
  {
    name: "propose_directions",
    kind: "agent",
    step: "Step 4c · Agent nodes",
    to: "/step/fan-out/c",
    concepts: [
      "Single-turn AgentNode executing Gemini structured inference",
      "output_schema guarantees validated multi-candidate Pydantic models",
      "before_model_callback injects personalized taste memories from Agent Runtime",
    ],
  },
  {
    name: "direction_gate",
    kind: "human",
    step: "Step 4d · Human-in-the-loop",
    to: "/step/fan-out/d",
    concepts: [
      "RequestInput event suspends workflow execution asynchronously",
      "Exposes response_schema, candidate payload, and unique interrupt_id",
      "Execution resumes via FunctionResponse targeting matching call_id",
    ],
  },
  {
    name: "persist_direction",
    kind: "func",
    step: "Step 5a · Workflow State",
    to: "/step/policy-gate/a",
    concepts: [
      "Event(state=...) commits variables to shared session state",
      "parameter_binding injects state variables directly into node signatures",
      "User-scoped keys persist across sessions; mirrored to disk for external workers",
    ],
  },
  {
    name: "policy_check",
    kind: "router",
    step: "Step 5b · The router node",
    to: "/step/policy-gate/b",
    concepts: [
      "RouterNode emits Event(route=...) for deterministic conditional branching",
      "Policy-as-data enforcement through dynamic evaluation against policy rules",
      "Dictionary-based target routing maps outcome labels to downstream nodes",
    ],
  },
  {
    name: "scripter",
    kind: "agent",
    step: "Step 5b · The router node",
    to: "/step/policy-gate/b",
    concepts: [
      "Downstream AgentNode generating complete video script and visual prompts",
      "after_agent_callback commits selected direction to long-term Memory Bank",
      "Pydantic-validated production script with shot breakdown and dialogue",
    ],
  },
  {
    name: "quarantine",
    kind: "task",
    step: "Step 5c · Agent modes and the task node",
    to: "/step/policy-gate/c",
    concepts: [
      "Autonomous task-mode loop that iterates tool calls until finish_task is invoked",
      "Interactive remediation that identifies violations and applies replacements",
      "Sanitizes non-compliant directions before re-entering generation pipeline",
    ],
  },
  {
    name: "render_desk",
    kind: "desk",
    step: "Step 8a · A long-running tool",
    to: "/step/video/a",
    concepts: [
      "LongRunningFunctionTool emits pending receipt without blocking worker thread",
      "Workflow suspends waiting for asynchronous external tool completion",
      "Resumed by call_id via external delivery poller or webhook",
    ],
  },
  {
    name: "store_video",
    kind: "func",
    step: "Step 8b · render_desk in the graph",
    to: "/step/video/b",
    concepts: [
      "Persists final video asset URI and metadata into shared session state",
      "Inter-process synchronization between background poller and workflow runner",
      "Terminal node completing end-to-end multi-modal content generation",
    ],
  },
];

const KIND_LABEL: Record<Kind, string> = {
  start: "entry sentinel",
  func: "function node",
  join: "join barrier",
  agent: "agent node",
  human: "human-in-the-loop gate",
  router: "conditional router",
  task: "task-mode agent",
  desk: "long-running tool",
};

const STEP_ROWS = [
  {
    step: "Step 3 · Monolithic Agent Architecture",
    covered: "Single-agent orchestration with function tools; function_call and function_response mechanics; architectural limitations of unstructured natural language coordination between pipeline stages",
  },
  {
    step: "Step 4 · Agentic Workflow Fundamentals",
    covered: "Workflow DAG initialization, START sentinel, edge lists as chained tuples; JoinNode synchronization barriers; AgentNode with structured output_schema; RequestInput suspension with response_schema, candidate payload, and interrupt_id",
  },
  {
    step: "Step 5 · State Management & Conditional Routing",
    covered: "Event(state=...) mutation, parameter_binding injection, user-scoped persistence; deterministic RouterNode branching; policy-as-data enforcement; autonomous task-mode agents with tool remediation loops",
  },
  {
    step: "Step 6 · Long-Term Memory Bank",
    covered: "Memory Bank lifecycle covering episodic ingestion, LLM consolidation, and custom user-scoped topics; memories.generate and retrieve APIs; before_model_callback dynamic context injection and after_agent_callback preference extraction",
  },
  {
    step: "Step 7 · Enterprise Retrieval (RAG Engine)",
    covered: "GEAP RAG Engine infrastructure covering corpus management, document chunking, and text-embedding-004 vector search; parallel retrieval reader integrated into JoinNode synchronization; grounded multi-modal generation",
  },
  {
    step: "Step 8 · Long-Running Video Generation",
    covered: "LongRunningFunctionTool protocol, pending receipt generation, asynchronous workflow suspension at agent nodes; decoupled delivery resumption by call_id across independent processes; Veo video generation API with exponential backoff",
  },
  {
    step: "Step 9 · Production Deployment Architecture",
    covered: "ADK Runner orchestration with run_async; decoupled FastAPI server with Server-Sent Events (SSE) telemetry stream; containerized deployment to Google Cloud Run with session affinity and warm instances",
  },
];

export function Summary() {
  const [hover, setHover] = useState<string | null>(null);
  const node = NODES.find((n) => n.name === hover) ?? null;
  return (
    <div className="space-y-12">
      <StepHeader
        kicker="Step 10 · Summary"
        color={PURPLE}
        title="Complete workflow topology and architectural summary."
        blurb="Comprehensive review of the production workflow topology, from initial idea fan-out to long-running video asset delivery. Inspect each node to review underlying architectural patterns, state contracts, and lifecycle hooks."
      />

      <In delay={0.1}>
        <section className="rounded-3xl border border-hairline bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">Workflow Topology</p>
          <SnakeGraph hover={hover === "START" ? "__START__" : hover} onHover={(n) => setHover(n === "__START__" ? "START" : n)} label="Complete production workflow topology where START fans out to scan_trends, read_backlog, and read_feedback, synchronizing at join_research before propose_directions. The direction_gate suspends for human review, followed by persist_direction and policy_check routing to either scripter or quarantine. The workflow concludes at render_desk and store_video. Select a node to inspect architectural details." />
          <div className="mt-4 min-h-[112px] rounded-2xl border border-hairline bg-overlay p-4">
            {node ? (
              <motion.div key={node.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-sm text-fg">
                    {node.name} <span className="text-fg-muted">· {KIND_LABEL[node.kind] || "entry sentinel"}</span>
                  </p>
                  <Link to={node.to} className="font-mono text-[11px] text-vibe-cyan hover:underline">
                    {node.step} →
                  </Link>
                </div>
                <ul className="mt-2 grid gap-1 text-sm text-fg-muted md:grid-cols-3">
                  {node.concepts.map((c) => (
                    <li key={c} className="rounded-xl border border-hairline bg-card px-3 py-2">
                      {c}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              <p className="text-sm text-fg-muted">Select or hover a node to inspect its architectural pattern, implementation details, and learning module.</p>
            )}
          </div>
        </section>
      </In>

      <In delay={0.2}>
        <section className="rounded-3xl border border-hairline bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">Curriculum Overview</p>
          <h2 className="font-display mt-2 text-2xl">Core architectural concepts by module.</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                  <th className="pb-2 pr-4">Step</th>
                  <th className="pb-2">Concepts</th>
                </tr>
              </thead>
              <tbody>
                {STEP_ROWS.map((r) => (
                  <tr key={r.step} className="border-t border-hairline align-top">
                    <td className="py-2 pr-4 font-semibold text-fg">{r.step}</td>
                    <td className="py-2 text-fg-muted">{r.covered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </In>

      <In delay={0.3}>
        <section className="rounded-3xl border border-hairline bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">Architectural design principles</p>
          <ul className="mt-3 grid gap-2 text-sm text-fg-muted md:grid-cols-2">
            <li className="rounded-2xl border border-hairline bg-overlay p-3">
              <strong className="text-fg">Stateless execution suspension.</strong> Workflows suspend cleanly for human review or long-running async tools. RequestInput and LongRunningFunctionTool yield execution without consuming worker resources or holding memory connections.
            </li>
            <li className="rounded-2xl border border-hairline bg-overlay p-3">
              <strong className="text-fg">Deterministic ID-based resumption.</strong> Every suspended execution resumes via a standard FunctionResponse targeting the original call_id, whether dispatched by a web UI, background polling daemon, or webhook across process restarts.
            </li>
            <li className="rounded-2xl border border-hairline bg-overlay p-3">
              <strong className="text-fg">Decoupled session state binding.</strong> Nodes communicate through shared session state. State variables (candidates, direction, render_url) are bound directly to function arguments by parameter name rather than passed manually across edges.
            </li>
            <li className="rounded-2xl border border-hairline bg-overlay p-3">
              <strong className="text-fg">Deterministic pre-inference routing.</strong> Branching decisions and safety guardrails run as deterministic code inspecting structured policy data before triggering expensive downstream model inference or generation calls.
            </li>
            <li className="rounded-2xl border border-hairline bg-overlay p-3">
              <strong className="text-fg">Separation of concerns in context assembly.</strong> Agent-specific context and preference extraction belong in lifecycle callbacks (before_model_callback, after_agent_callback). Heavy external data ingestion belongs in parallel research DAG nodes.
            </li>
            <li className="rounded-2xl border border-hairline bg-overlay p-3">
              <strong className="text-fg">Inversion of control in runtime orchestration.</strong> The hosting application drives workflow execution through the ADK Runner and broadcasts updates over an event stream. The underlying graph remains completely decoupled from presentation and network layers.
            </li>
          </ul>
        </section>
      </In>

      <In delay={0.4}>
        <section className="rounded-3xl border border-hairline bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">Production roadmap & enhancements</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-fg-muted">
            <li>Migrate from DatabaseSessionService to a managed GEAP session service to colocate session state with Agent Runtime and support fully stateless autoscaling.</li>
            <li>Implement webhook-driven asset delivery to eliminate background polling, delivering FunctionResponse notifications directly from asynchronous completion queues.</li>
            <li>Introduce secondary human-in-the-loop review gates (e.g. executive compliance approval) prior to public media distribution.</li>
            <li>Establish closed-loop audience feedback ingestion by appending user interaction metrics and published comments back into the RAG corpus to steer subsequent generation cycles.</li>
          </ul>
        </section>
      </In>
    </div>
  );
}
