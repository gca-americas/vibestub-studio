import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { In, StepHeader } from "../components/shared";
import { COLORS, tint } from "./colors";
import { SnakeGraph } from "./Overview";

/*
 * Step 10: the whole workflow, and every concept it carries. Hover a node
 * for what it taught and where; the pulse walks the graph the way a run does.
 */

const PURPLE = COLORS.purple;
const AMBER = COLORS.amber;
const CYAN = COLORS.cyan;
const GREEN = COLORS.green;
const RED = COLORS.red;
const BLUE = COLORS.blue;
const mono = { fontFamily: "var(--font-mono)" } as const;

/* ── the design rules, each with a picture ─────────────────────────────── */

const box = (x: number, y: number, w: number, label: string, color?: string, dashed = false, h = 22) => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={7} fill={color ? tint(color, 0.1) : "var(--overlay)"} stroke={color ?? "var(--hairline)"} strokeWidth={color ? 1.3 : 1} strokeDasharray={dashed ? "4 3" : undefined} />
    <text x={x + w / 2} y={y + h / 2 + 3.5} fontSize="8.5" style={mono} textAnchor="middle" fill={color ?? "currentColor"}>{label}</text>
  </g>
);
const arrow = (x1: number, y1: number, x2: number, y2: number, color = "currentColor", dashed = false) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.1" strokeDasharray={dashed ? "4 3" : undefined} markerEnd="url(#rule-arrow)" />
);
const note = (x: number, y: number, text: string, color?: string, anchor: "start" | "middle" | "end" = "start") => (
  <text x={x} y={y} fontSize="7.5" style={mono} textAnchor={anchor} fill={color ?? "currentColor"} opacity={color ? 1 : 0.7}>{text}</text>
);
const person = (cx: number, cy: number, color = BLUE) => (
  <g>
    <circle cx={cx} cy={cy} r="4.5" fill={tint(color, 0.15)} stroke={color} strokeWidth="1.2" />
    <path d={`M${cx - 8} ${cy + 16} a8 8 0 0 1 16 0`} fill={tint(color, 0.15)} stroke={color} strokeWidth="1.2" />
  </g>
);

function RuleFigure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 118" role="img" aria-label={label} className="h-auto w-full text-fg">
      <defs>
        <marker id="rule-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="context-stroke" />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

const RULES: { text: string; figure: React.ReactNode }[] = [
  {
    text: "Graphs pause for people and for receipts, never for a wait. RequestInput and the pending tool call both suspend the run; nothing stays alive on a timer.",
    figure: (
      <RuleFigure label="Two paused nodes: direction_gate, resumed by a person's answer, and render_desk, resumed by the receipt of the render. A clock, struck out: nothing waits on a timer.">
        {person(60, 14)}
        {note(60, 46, "a person answers", BLUE, "middle")}
        {arrow(60, 50, 60, 62, BLUE)}
        {box(16, 64, 88, "direction_gate", AMBER)}
        <rect x="186" y="8" width="26" height="30" rx="3" fill="var(--overlay)" stroke={AMBER} strokeWidth="1.1" />
        <line x1="191" y1="16" x2="207" y2="16" stroke={AMBER} strokeWidth="1" /><line x1="191" y1="22" x2="207" y2="22" stroke={AMBER} strokeWidth="1" /><line x1="191" y1="28" x2="203" y2="28" stroke={AMBER} strokeWidth="1" />
        {note(199, 50, "the render's receipt", AMBER, "middle")}
        {arrow(199, 54, 199, 62, AMBER)}
        {box(155, 64, 88, "render_desk", AMBER)}
        {note(60, 100, "paused, on disk", undefined, "middle")}
        {note(199, 100, "paused, on disk", undefined, "middle")}
        <circle cx="290" cy="75" r="11" fill="none" stroke={RED} strokeWidth="1.2" />
        <line x1="290" y1="75" x2="290" y2="68" stroke={RED} strokeWidth="1.2" /><line x1="290" y1="75" x2="295" y2="78" stroke={RED} strokeWidth="1.2" />
        <line x1="280" y1="86" x2="300" y2="64" stroke={RED} strokeWidth="1.6" />
        {note(290, 100, "never a wait", RED, "middle")}
      </RuleFigure>
    ),
  },
  {
    text: "Every resume is one function_response carrying the call's id, whoever sends it: a page, a console, another process, after a restart.",
    figure: (
      <RuleFigure label="Three senders, a page, a console and another process after a restart, each sending the same function_response with the call's id into the one open call.">
        {box(8, 8, 92, "the page", BLUE)}
        {box(8, 42, 92, "a console", BLUE)}
        {box(8, 76, 92, "another process", BLUE)}
        {note(54, 112, "even after a restart", undefined, "middle")}
        <path d="M100 19 C 140 19, 150 53, 186 53" fill="none" stroke="currentColor" strokeWidth="1.1" markerEnd="url(#rule-arrow)" />
        <path d="M100 53 L 186 53" fill="none" stroke="currentColor" strokeWidth="1.1" markerEnd="url(#rule-arrow)" />
        <path d="M100 87 C 140 87, 150 53, 186 53" fill="none" stroke="currentColor" strokeWidth="1.1" markerEnd="url(#rule-arrow)" />
        {note(143, 86, "function_response(id)", undefined, "middle")}
        {box(188, 40, 124, "the open call", AMBER, true, 26)}
        {note(250, 82, "id call_3719769", AMBER, "middle")}
        {note(250, 96, "one id, one answer, one resume", undefined, "middle")}
      </RuleFigure>
    ),
  },
  {
    text: "Nodes share state by key name. candidates, direction, render_url move through the graph without being passed between nodes.",
    figure: (
      <RuleFigure label="A state store in the middle with three keys. propose_directions writes candidates and persist_direction reads it; persist_direction writes direction and scripter reads it; store_video writes render_url and the app reads it. No edge carries any of them.">
        <rect x="110" y="6" width="100" height="106" rx="9" fill={tint(GREEN, 0.06)} stroke={GREEN} strokeWidth="1.1" />
        {note(160, 20, "state", GREEN, "middle")}
        {["candidates", "direction", "render_url"].map((k, i) => (
          <g key={k}>
            <rect x="118" y={30 + i * 26} width="84" height="18" rx="4" fill="var(--overlay)" stroke="var(--hairline)" />
            <text x="160" y={42 + i * 26} fontSize="8" style={mono} textAnchor="middle" fill="currentColor">{k}</text>
          </g>
        ))}
        {["propose_directions", "persist_direction", "store_video"].map((n, i) => (
          <g key={n}>
            <text x="100" y={42 + i * 26} fontSize="7.5" style={mono} textAnchor="end" fill="currentColor">{n}</text>
            {arrow(102, 39 + i * 26, 116, 39 + i * 26, GREEN)}
          </g>
        ))}
        {["persist_direction", "scripter", "the app"].map((n, i) => (
          <g key={n}>
            {arrow(204, 39 + i * 26, 218, 39 + i * 26, GREEN)}
            <text x="222" y={42 + i * 26} fontSize="7.5" style={mono} fill="currentColor">{n}</text>
          </g>
        ))}
        {note(6, 108, "writes by key")}
        {note(314, 108, "reads by key", undefined, "end")}
      </RuleFigure>
    ),
  },
  {
    text: "Routing is plain code and policy is data. The gate is a function and a text file, decided before any money is spent.",
    figure: (
      <RuleFigure label="policy_check, a plain function, reads policy_words.txt, a text file, and routes OK to the scripter or BLOCK to quarantine, before the render that costs money.">
        <rect x="6" y="10" width="88" height="34" rx="4" fill="var(--overlay)" stroke="currentColor" strokeOpacity="0.5" />
        <path d="M84 10 L 94 20 L 84 20 Z" fill="var(--overlay)" stroke="currentColor" strokeOpacity="0.5" />
        {note(50, 26, "policy_words.txt", undefined, "middle")}
        {note(50, 37, "data", RED, "middle")}
        {arrow(50, 46, 50, 62)}
        {box(8, 64, 84, "policy_check", RED)}
        {note(50, 100, "a function · code", RED, "middle")}
        <path d="M92 70 C 118 70, 118 44, 140 44" fill="none" stroke={GREEN} strokeWidth="1.1" markerEnd="url(#rule-arrow)" />
        <path d="M92 80 C 118 80, 118 100, 140 100" fill="none" stroke={RED} strokeWidth="1.1" markerEnd="url(#rule-arrow)" />
        {note(116, 40, '"OK"', GREEN, "middle")}
        {note(116, 112, '"BLOCK"', RED, "middle")}
        {box(142, 33, 66, "scripter", PURPLE)}
        {box(142, 89, 66, "quarantine", PURPLE)}
        {arrow(208, 44, 232, 44)}
        {box(234, 33, 78, "render_desk", AMBER, true)}
        {note(273, 70, "Veo · costs money", AMBER, "middle")}
        {note(273, 82, "decided before this", undefined, "middle")}
      </RuleFigure>
    ),
  },
  {
    text: "Context that belongs to one agent rides a callback on that agent. Research that produces data before the model runs is a node in the fan-out.",
    figure: (
      <RuleFigure label="Left: propose_directions with a before_model_callback that reads Memory Bank, the creator's taste, context for that one agent. Right: read_feedback, a node in the fan-out beside the other readers, that reads the RAG corpus and hands data to the join before any model runs.">
        <line x1="164" y1="8" x2="164" y2="110" stroke="var(--hairline)" />
        {box(32, 40, 100, "propose_directions", PURPLE)}
        <rect x="30" y="10" width="104" height="18" rx="9" fill={tint(CYAN, 0.12)} stroke={CYAN} strokeWidth="1" />
        <text x="82" y="22" fontSize="7.5" style={mono} textAnchor="middle" fill={CYAN}>before_model_callback</text>
        {arrow(82, 28, 82, 38, CYAN)}
        {note(82, 78, "Memory Bank · the creator's taste", CYAN, "middle")}
        {note(82, 92, "one agent's context", undefined, "middle")}
        {note(82, 104, "rides that agent", undefined, "middle")}
        {box(172, 12, 72, "scan_trends")}
        {box(172, 40, 72, "read_backlog")}
        {box(172, 68, 72, "read_feedback", CYAN)}
        {arrow(244, 23, 268, 46)}
        {arrow(244, 51, 268, 51)}
        {arrow(244, 79, 268, 56)}
        {box(270, 40, 44, "join", CYAN)}
        {note(208, 96, "RAG Engine · the comments", CYAN, "middle")}
        {note(244, 108, "data, before any model: a node", undefined, "middle")}
      </RuleFigure>
    ),
  },
  {
    text: "The app owns the loop, not the graph: a Runner drives it, an event stream shows it, the graph itself does not know a page exists.",
    figure: (
      <RuleFigure label="The app, holding the page, a Runner and an event stream, drives the graph and shows its events. The graph, in its own box, has no arrow back to the page.">
        <rect x="8" y="8" width="150" height="104" rx="10" fill={tint(BLUE, 0.05)} stroke={BLUE} strokeWidth="1.1" />
        {note(83, 22, "the app", BLUE, "middle")}
        {box(18, 30, 60, "the page", BLUE)}
        {box(88, 30, 60, "Runner", BLUE)}
        {box(18, 82, 130, "event stream", BLUE)}
        {arrow(48, 52, 48, 80, BLUE)}
        {note(52, 68, "shows", BLUE)}
        <rect x="186" y="8" width="126" height="104" rx="10" fill="var(--overlay)" stroke="var(--hairline)" />
        {note(249, 22, "the graph", undefined, "middle")}
        {box(196, 32, 50, "join")}
        {box(256, 32, 48, "propose")}
        {box(196, 62, 50, "gate", AMBER)}
        {box(256, 62, 48, "desk", AMBER)}
        {arrow(148, 41, 184, 41, BLUE)}
        {note(166, 36, "runs", BLUE, "middle")}
        <path d="M186 90 L 150 90" fill="none" stroke={BLUE} strokeWidth="1.1" markerEnd="url(#rule-arrow)" />
        {note(166, 100, "events", BLUE, "middle")}
        {note(249, 104, "knows no page", undefined, "middle")}
      </RuleFigure>
    ),
  },
];

/* ── share the video ────────────────────────────────────────────────────── */

const SHARE_EXAMPLE = "https://vibetube.dev/e/sandbox?v=v_d0af3758159d";

/** The screenshot slot: web/public/share.png when it exists, a marked space until then. */
function ShareImage() {
  const [missing, setMissing] = useState(false);
  return (
    <div className="mt-5">
      {!missing && (
        <img src="/share.png" alt="A published clip on vibetube.dev" className="w-full rounded-2xl border border-hairline" onError={() => setMissing(true)} />
      )}
      {missing && (
        <div className="flex aspect-[16/7] w-full items-center justify-center rounded-2xl border border-dashed border-hairline bg-overlay font-mono text-[11px] text-fg-muted">
          image · web/public/share.png
        </div>
      )}
    </div>
  );
}

type Kind = "start" | "func" | "join" | "agent" | "human" | "router" | "task" | "desk";

interface NodeInfo {
  name: string;
  kind: Kind;
  step: string;
  to: string;
  concepts: string[];
}

const NODES: NodeInfo[] = [
  { name: "START", kind: "start", step: "Step 4 · Agentic workflow fundamentals", to: "/step/fan-out/a", concepts: ["Workflow and its edge list", "START: the entry every chain begins at", "A tuple is a chain, a list of tuples is the graph"] },
  { name: "scan_trends", kind: "func", step: "Step 4b · Parallel research fan-out", to: "/step/fan-out/b", concepts: ["A function node: node_input in, Event(output=...) out", "Two chains from START run in parallel", "Trends drawn from a pool beside the graph"] },
  { name: "read_backlog", kind: "func", step: "Step 4b · Parallel research fan-out", to: "/step/fan-out/b", concepts: ["The creator's notes from a text file", "idea_text: the message that started the run", "The same function in the stage app and in production"] },
  { name: "read_feedback", kind: "func", step: "Step 7 · RAG Engine", to: "/step/rag/a", concepts: ["A RAG Engine corpus: files, passages, embeddings", "retrieval_query: meaning in, meaning out", "Retrieval as a third reader, one more edge into the join"] },
  { name: "join_research", kind: "join", step: "Step 4b · Parallel research fan-out", to: "/step/fan-out/b", concepts: ["JoinNode waits for every incoming edge", "Its output is one dict, keyed by node name", "Adding a reader changes one line"] },
  { name: "propose_directions", kind: "agent", step: "Step 4c · Agent nodes", to: "/step/fan-out/c", concepts: ["An Agent as a node, single_turn", "output_schema: four typed candidates in one call", "Step 6: before_model_callback recall_taste appends Memory Bank"] },
  { name: "direction_gate", kind: "human", step: "Step 4d · Human-in-the-loop", to: "/step/fan-out/d", concepts: ["RequestInput suspends the graph", "response_schema, payload, interrupt_id", "Resume by function_response with the call's id"] },
  { name: "persist_direction", kind: "func", step: "Step 5a · State", to: "/step/policy-gate/a", concepts: ["Event(state=...) writes shared state", "parameter_binding: candidates arrives by name", "user: keys outlive the session; runs/state.json is the app's copy"] },
  { name: "policy_check", kind: "router", step: "Step 5b · The router node", to: "/step/policy-gate/b", concepts: ["A router: Event(route=...) picks the edge", "Policy as data: policy_words.txt read at decision time", "A dict target maps route names to nodes"] },
  { name: "scripter", kind: "agent", step: "Step 5b · The router node", to: "/step/policy-gate/b", concepts: ["An agent node after the gate", "Step 6: after_agent_callback remember_pick writes the pick to Memory Bank"] },
  { name: "quarantine", kind: "task", step: "Step 5c · Agent modes", to: "/step/policy-gate/c", concepts: ["mode='task': tools until finish_task", "find_policy_hits and suggest_replacement", "A refused direction repaired, then rerouted to the scripter"] },
  { name: "render_desk", kind: "desk", step: "Step 8 · The video", to: "/step/video/a", concepts: ["LongRunningFunctionTool and the pending receipt", "The workflow suspends at an agent node", "Delivered by id from another process, after a restart"] },
  { name: "store_video", kind: "func", step: "Step 8b · render_desk in the graph", to: "/step/video/b", concepts: ["The delivered render into shared state", "runs/state.json as the bridge between processes", "The run ends with a clip"] },
];



const KIND_LABEL: Record<Kind, string> = { start: "", func: "function", join: "join", agent: "agent", human: "your pick", router: "router", task: "agent (mode: task)", desk: "long-running tool" };

const STEP_ROWS = [
  { step: "3 · Monolithic agent", covered: "An Agent with function tools; function_call and function_response events; why prose is a poor interface between steps" },
  { step: "4 · Agentic workflow fundamentals", covered: "Workflow, START, edges as tuples; JoinNode; an Agent as a node with output_schema; RequestInput with response_schema, payload and interrupt_id" },
  { step: "5 · State and the policy gate", covered: "Event(state=...), parameter binding, the user: prefix; a router node; policy as data; agent modes and a task agent with tools" },
  { step: "6 · Memory Bank", covered: "Scope, extraction, consolidation, custom topics; memories.generate and retrieve; before_model_callback and after_agent_callback" },
  { step: "7 · RAG Engine", covered: "A corpus, chunking, an embedding model, retrieval by meaning; a retrieval node as one more edge into the join; a model that varies" },
  { step: "8 · The video", covered: "LongRunningFunctionTool, the pending receipt, a workflow suspended at an agent node, resume by id from another process, Veo with retries" },
  { step: "9 · Deploy", covered: "The Runner and run_async; an app on top with one SSE stream; the finished agent as a byte-identical copy; a container on Cloud Run" },
];

export function Summary() {
  const [hover, setHover] = useState<string | null>(null);
  const node = NODES.find((n) => n.name === hover) ?? null;
  return (
    <div className="space-y-12">
      <StepHeader
        kicker="Step 10 · Summary"
        color={PURPLE}
        title="The finished workflow and every concept in it."
        blurb="This is the graph you built, node by node, from a single prompt to a published clip. Hover a node for what it taught and where. The pulse walks it the way a run does."
      />

      <In delay={0.1}>
        <section className="rounded-3xl border border-hairline bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">The workflow</p>
          <SnakeGraph hover={hover === "START" ? "__START__" : hover} onHover={(n) => setHover(n === "__START__" ? "START" : n)} label="The whole workflow, the way the app draws it: START fans out to scan_trends, read_backlog and read_feedback, then join_research, propose_directions, direction_gate, persist_direction, policy_check routing OK to scripter and BLOCK to quarantine, render_desk, store_video. Hover a node for what it taught." />
          <div className="mt-4 min-h-[112px] rounded-2xl border border-hairline bg-overlay p-4">
            {node ? (
              <motion.div key={node.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-sm text-fg">
                    {node.name} <span className="text-fg-muted">· {KIND_LABEL[node.kind] || "entry"}</span>
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
              <p className="text-sm text-fg-muted">Hover a node. Each one links back to the step that built it.</p>
            )}
          </div>
        </section>
      </In>

      <In delay={0.2}>
        <section className="rounded-3xl border border-hairline bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">Step by step</p>
          <h2 className="font-display mt-2 text-2xl">What each step covered.</h2>
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
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">Design rules the graph follows</p>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {RULES.map((r) => (
              <li key={r.text} className="rounded-2xl border border-hairline bg-overlay p-3">
                <div className="rounded-xl bg-card p-2">{r.figure}</div>
                <p className="mt-3 text-sm text-fg-muted">{r.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </In>

      <In delay={0.4}>
        <section className="rounded-3xl border border-hairline bg-card p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg-muted">Share it</p>
          <h2 className="font-display mt-2 text-2xl">Post your video.</h2>
          <p className="mt-2 max-w-3xl text-sm text-fg-muted">
            Your clip is on vibetube.dev. The Vibe Studio app published it there in step 9 and showed the link when it did; the link is
            also on your room's page, under your name. It looks like this:
          </p>
          <div className="mt-3 rounded-xl border border-hairline bg-input px-4 py-2.5 font-mono text-xs text-fg">{SHARE_EXAMPLE}</div>
          <p className="mt-3 max-w-3xl text-sm text-fg-muted">
            Post that link where you post, with the idea you typed in step 8 and what the workflow made of it. The clip, its title and
            its thumbnail are the app's; the direction, the script and the render behind them are the graph you built.
          </p>
          <ShareImage />
        </section>
      </In>
    </div>
  );
}
