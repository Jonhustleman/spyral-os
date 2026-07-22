"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProviderManager, type ProviderType } from "@/features/providers";
import { SpyralCognitiveCore } from "@/core";
import { Sparkles, Send, FileText, Image, Music, Film, Share2, Download, ChevronDown, ChevronUp, Copy, Check, Home, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";

// ─── Message types ─────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "agent" | "user";
  content: string;
  timestamp: Date;
};

// ─── Content output sections ────────────────────────────────────────────────

type ContentPackage = {
  creativeBrief: string;
  audience: string;
  objective: string;
  platform: string;
  contentPillars: string[];
  storyboard: { scene: string; visual: string; audio: string; duration: string; }[];
  hookOptions: string[];
  sceneByScene: { scene: string; voiceover: string; onScreenText: string; cameraDirection: string; bRoll: string; }[];
  thumbnailIdea: string;
  caption: string;
  cta: string;
  hashtags: string[];
  batchPrompt: string;
  repurposingIdeas: string[];
};

// ─── Sample content package generator ───────────────────────────────────────

function generateContentPackage(prompt: string): ContentPackage {
  return {
    creativeBrief: `Create compelling content around: "${prompt}". Focus on delivering value to the target audience while maintaining brand consistency and driving engagement.`,
    audience: "Primary: Professionals and enthusiasts interested in this topic. Secondary: Decision-makers looking for solutions in this space.",
    objective: `Educate and inspire the audience about "${prompt}", building trust and positioning as a thought leader while driving meaningful engagement.`,
    platform: "TikTok, Instagram Reels, YouTube Shorts (short-form) + LinkedIn, Blog (long-form)",
    contentPillars: [
      `Core insights about ${prompt}`,
      "Behind-the-scenes and process content",
      "Educational how-to and tutorial content",
      "Community stories and case studies",
      "Industry trends and thought leadership",
    ],
    storyboard: [
      { scene: "Hook (0-3s)", visual: "Bold text overlay with provocative statement", audio: "Trending audio or sound effect", duration: "3s" },
      { scene: "Context (3-8s)", visual: "B-roll footage or screen recording establishing the topic", audio: "Voiceover: 'Here's something most people don't realize...'", duration: "5s" },
      { scene: "Reveal (8-15s)", visual: "Key insight or data point displayed visually", audio: "Voiceover explaining the core concept", duration: "7s" },
      { scene: "Application (15-25s)", visual: "Demonstration or real-world example", audio: "Voiceover walking through the application", duration: "10s" },
      { scene: "CTA (25-30s)", visual: "Follow/subscribe card with call to action", audio: "Voiceover: 'Follow for more insights on this topic'", duration: "5s" },
    ],
    hookOptions: [
      `Stop scrolling if you want to learn about ${prompt}`,
      `The truth about ${prompt} that nobody talks about`,
      `I wish I knew this about ${prompt} sooner`,
      `This is how ${prompt} actually works`,
      `3 things you're getting wrong about ${prompt}`,
    ],
    sceneByScene: [
      { scene: "Opening Hook", voiceover: "Here's something most people don't realize about this topic...", onScreenText: `"The Truth About ${prompt}"`, cameraDirection: "Close-up, direct address", bRoll: "Stock footage related to topic" },
      { scene: "Core Message", voiceover: "The key insight here changes everything.", onScreenText: "Key Insight ↓", cameraDirection: "Medium shot with hand gestures", bRoll: "Screen recording or demonstration" },
      { scene: "Proof Point", voiceover: "And here's the data that backs this up.", onScreenText: "Data Point", cameraDirection: "Graphic overlay", bRoll: "Charts, graphs, or testimonials" },
      { scene: "Application", voiceover: "Here's how you can apply this today.", onScreenText: "Step-by-step guide", cameraDirection: "Over-the-shoulder or demonstration", bRoll: "Real-world application footage" },
      { scene: "Close", voiceover: "Follow for more insights like this.", onScreenText: "Follow @handle", cameraDirection: "Close-up, direct address", bRoll: "Brand card with logo" },
    ],
    thumbnailIdea: `Split-screen or bold single-image thumbnail with text overlay: "${prompt.substring(0, 40)}" — contrasting colors, arrow or circle highlight, expressive face if applicable.`,
    caption: `This is how you think about ${prompt} differently.\n\nMost people get this wrong, but once you understand the core principle, everything changes.\n\nSave this for later and share with someone who needs to see it.\n\nWhat's your take on this? Drop a comment below. 👇`,
    cta: "Follow for more insights. Like and share if this was valuable. Comment your thoughts below.",
    hashtags: ["#" + prompt.replace(/\s+/g, ""), "#ContentCreation", "#Growth", "#Strategy", "#Insights", "#LearnOnTikTok", "#EducationalContent", "#ValueDriven", "#ThoughtLeadership", "#ContentMarketing"].slice(0, 10),
    batchPrompt: `Create 5 content variations around: "${prompt}". Each variation should: have a unique hook angle, target a slightly different audience segment, use a different content format (carousel, video, text post, infographic, thread), maintain consistent core messaging, and include platform-specific optimization.`,
    repurposingIdeas: [
      "Turn this into a Twitter/X thread with key takeaways",
      "Create a LinkedIn carousel summarizing the main points",
      "Record a podcast episode expanding on the topic",
      "Write a blog post with detailed step-by-step guidance",
      "Create an infographic with the key data points",
      "Film a short-form video for each content pillar",
    ],
  };
}

// ─── Session management ─────────────────────────────────────────────────────

type ContentSession = {
  id: string;
  topic: string;
  package: ContentPackage;
  timestamp: number;
  cognitiveResponse?: import("@/core").CognitiveResponse;
};

const CONTENT_SESSIONS_KEY = "spyral-content-sessions";

function loadContentSessions(): ContentSession[] {
  try {
    const raw = localStorage.getItem(CONTENT_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveContentSession(session: ContentSession) {
  const sessions = loadContentSessions();
  sessions.unshift(session);
  localStorage.setItem(CONTENT_SESSIONS_KEY, JSON.stringify(sessions.slice(0, 20)));
}

// ─── Content Agent Page ─────────────────────────────────────────────────────

export default function ContentAgentPage() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "What would you like to create today?\n\nBefore I produce anything, let me think about your audience, positioning, and strategy.\n\nTell me about your project and I'll develop a complete content package.",
      timestamp: new Date(),
    },
  ]);
  const [package_, setPackage] = useState<ContentPackage | null>(null);
  const [cognitiveResponse, setCognitiveResponse] = useState<import("@/core").CognitiveResponse | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<ContentSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState<ProviderType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {}
  };

  useEffect(() => {
    setSavedSessions(loadContentSessions());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSavedContentSession = (session: ContentSession) => {
    setPackage(session.package);
    setCognitiveResponse(session.cognitiveResponse || null);
    setMessages([
      {
        id: "welcome",
        role: "agent",
        content: "What would you like to create today?\n\nBefore I produce anything, let me think about your audience, positioning, and strategy.\n\nTell me about your project and I'll develop a complete content package.",
        timestamp: new Date(),
      },
      {
        id: `user-${session.timestamp}`,
        role: "user",
        content: session.topic,
        timestamp: new Date(session.timestamp),
      },
      {
        id: `agent-${session.timestamp}`,
        role: "agent",
        content: session.cognitiveResponse?.response || `I've created a complete content package for "${session.topic}". Here's everything you need to produce and publish.`,
        timestamp: new Date(session.timestamp),
      },
    ]);
    setShowSessions(false);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    // SPYRAL thinks before creating — research audience, positioning, strategy
    const cognitive = SpyralCognitiveCore.think({
      input: prompt,
      agentType: "content",
    });
    setCognitiveResponse(cognitive);
    setShowThinking(true);

    // Then generate content package
    const pkg = generateContentPackage(prompt);
    setPackage(pkg);

    // Auto-save session
    const session: ContentSession = {
      id: `content-${Date.now()}`,
      topic: prompt,
      package: pkg,
      cognitiveResponse: cognitive,
      timestamp: Date.now(),
    };
    saveContentSession(session);
    setSavedSessions(loadContentSessions());

    const agentMsg: Message = {
      id: `agent-${Date.now()}`,
      role: "agent",
      content: cognitive.response + "\n\nI've prepared a complete content package below with creative brief, storyboard, hooks, and production-ready assets.",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, agentMsg]);
    setIsThinking(false);
    setPrompt("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Section configs ──────────────────────────────────────────────────

  const sections = package_
    ? [
        {
          key: "brief",
          label: "Creative Brief",
          icon: FileText,
          content: (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-zinc-500">Brief: </span>
                <span className="text-zinc-300">{package_.creativeBrief}</span>
              </div>
              <div>
                <span className="text-zinc-500">Audience: </span>
                <span className="text-zinc-300">{package_.audience}</span>
              </div>
              <div>
                <span className="text-zinc-500">Objective: </span>
                <span className="text-zinc-300">{package_.objective}</span>
              </div>
              <div>
                <span className="text-zinc-500">Platform: </span>
                <span className="text-zinc-300">{package_.platform}</span>
              </div>
            </div>
          ),
        },
        {
          key: "pillars",
          label: "Content Pillars",
          icon: Image,
          content: (
            <div className="space-y-1.5">
              {package_.contentPillars.map((p, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-400 mt-0.5">✦</span>
                  <span className="text-zinc-300">{p}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "storyboard",
          label: "Storyboard",
          icon: Film,
          content: (
            <div className="space-y-2">
              {package_.storyboard.map((s, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <div className="font-medium text-white mb-1">{s.scene}</div>
                  <div className="text-zinc-400"><span className="text-zinc-500">Visual:</span> {s.visual}</div>
                  <div className="text-zinc-400"><span className="text-zinc-500">Audio:</span> {s.audio}</div>
                  <div className="text-zinc-500 text-xs mt-1">Duration: {s.duration}</div>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "hooks",
          label: "Hook Options",
          icon: Music,
          content: (
            <div className="space-y-2">
              {package_.hookOptions.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-amber-400 font-mono text-xs mt-0.5">{i + 1}.</span>
                  <span className="text-zinc-300">{h}</span>
                  <button
                    onClick={() => copyToClipboard(h, `hook-${i}`)}
                    className="ml-auto shrink-0 p-1 rounded hover:bg-zinc-800 transition-colors"
                  >
                    {copiedField === `hook-${i}` ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-zinc-600" />}
                  </button>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "sceneBreakdown",
          label: "Scene-by-Scene Breakdown",
          icon: Film,
          content: (
            <div className="space-y-3">
              {package_.sceneByScene.map((s, i) => (
                <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-sm">
                  <div className="font-medium text-white mb-2">{s.scene}</div>
                  <div className="space-y-1 text-zinc-400">
                    <div><span className="text-zinc-500">Voiceover:</span> {s.voiceover}</div>
                    <div><span className="text-zinc-500">On-screen text:</span> {s.onScreenText}</div>
                    <div><span className="text-zinc-500">Camera:</span> {s.cameraDirection}</div>
                    <div><span className="text-zinc-500">B-roll:</span> {s.bRoll}</div>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          key: "thumbnail",
          label: "Thumbnail Idea",
          icon: Image,
          content: <p className="text-sm text-zinc-300">{package_.thumbnailIdea}</p>,
        },
        {
          key: "caption",
          label: "Caption",
          icon: FileText,
          content: (
            <div className="relative">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">{package_.caption}</pre>
              <button
                onClick={() => copyToClipboard(package_.caption, "caption")}
                className="absolute top-0 right-0 p-1.5 rounded hover:bg-zinc-800 transition-colors"
              >
                {copiedField === "caption" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-600" />}
              </button>
            </div>
          ),
        },
        {
          key: "cta",
          label: "Call to Action",
          icon: Sparkles,
          content: <p className="text-sm text-zinc-300">{package_.cta}</p>,
        },
        {
          key: "hashtags",
          label: "Hashtags",
          icon: Share2,
          content: (
            <div className="flex flex-wrap gap-1.5">
              {package_.hashtags.map((tag) => (
                <span key={tag} className="text-sm px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {tag}
                </span>
              ))}
              <button
                onClick={() => copyToClipboard(package_.hashtags.join(" "), "hashtags")}
                className="ml-auto p-1.5 rounded hover:bg-zinc-800 transition-colors"
              >
                {copiedField === "hashtags" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-600" />}
              </button>
            </div>
          ),
        },
        {
          key: "batch",
          label: "Batch Automation Prompt",
          icon: Sparkles,
          content: (
            <div className="relative">
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">{package_.batchPrompt}</pre>
              <button
                onClick={() => copyToClipboard(package_.batchPrompt, "batch")}
                className="absolute top-0 right-0 p-1.5 rounded hover:bg-zinc-800 transition-colors"
              >
                {copiedField === "batch" ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-600" />}
              </button>
            </div>
          ),
        },
        {
          key: "repurpose",
          label: "Repurposing Ideas",
          icon: Share2,
          content: (
            <div className="space-y-1.5">
              {package_.repurposingIdeas.map((idea, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5">↳</span>
                  <span className="text-zinc-300">{idea}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]
    : [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h1 className="text-lg font-semibold text-white">Content Agent</h1>
              <p className="text-xs text-zinc-500">SPYRAL AI Content Creator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedSessions.length > 0 && (
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
              >
                <FileText className="h-4 w-4" />
                Sessions ({savedSessions.length})
              </button>
            )}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/60 hover:border-zinc-700 transition-all text-sm"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </div>

      {/* Sessions Panel */}
      {showSessions && savedSessions.length > 0 && (
        <div className="border-b border-zinc-800 bg-zinc-900/30 px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wider">Saved Content Sessions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {savedSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadSavedContentSession(session)}
                  className="w-full text-left p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors"
                >
                  <p className="text-sm font-medium text-white truncate">{session.topic}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-2xl",
              msg.role === "user" ? "ml-auto" : ""
            )}
          >
            {msg.role === "agent" && (
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                <span className="text-sm">✨</span>
              </div>
            )}
            <div
              className={cn(
                "rounded-xl px-4 py-3 text-sm",
                msg.role === "agent"
                  ? "bg-zinc-900/60 border border-zinc-800 text-zinc-300"
                  : "bg-purple-500/10 border border-purple-500/20 text-zinc-200"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Content Package */}
      {package_ && (
        <div className="border-t border-zinc-800 px-6 py-4 overflow-y-auto max-h-[50vh]">
          <div className="max-w-3xl mx-auto space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isOpen = expandedSections[section.key] ?? (section.key === "brief" || section.key === "pillars" || section.key === "hooks");
              return (
                <div key={section.key} className="rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-zinc-500" />
                      <span>{section.label}</span>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      {section.content}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Generation actions */}
            <div className="pt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider mr-1">Generate:</span>
                <button
                  onClick={() => setShowProviderModal("image")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs hover:bg-purple-500/20 transition-colors"
                >
                  <Image className="h-3.5 w-3.5" />
                  Images
                </button>
                <button
                  onClick={() => setShowProviderModal("video")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs hover:bg-amber-500/20 transition-colors"
                >
                  <Film className="h-3.5 w-3.5" />
                  Videos
                </button>
                <button
                  onClick={() => setShowProviderModal("voice")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs hover:bg-emerald-500/20 transition-colors"
                >
                  <Music className="h-3.5 w-3.5" />
                  Voice
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const text = sections.map(s => `${s.label}\n${s.content?.props?.children || ''}`).join('\n\n');
                    copyToClipboard(text, "export-all");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Prompt Package
                </button>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(package_, null, 2), "export-json")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON
                </button>
                {copiedField === "export-all" && <span className="text-xs text-green-400">Copied!</span>}
                {copiedField === "export-json" && <span className="text-xs text-green-400">Copied!</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider Manager Modal */}
      {showProviderModal && package_ && (
        <ProviderManager
          type={showProviderModal}
          prompt={JSON.stringify(package_, null, 2)}
          onClose={() => setShowProviderModal(null)}
        />
      )}

      {/* Thinking indicator */}
      {isThinking && (
        <div className="border-t border-zinc-800 px-6 py-3">
          <div className="max-w-3xl mx-auto">
            <ThinkingIndicator isThinking={isThinking} />
          </div>
        </div>
      )}

      {/* Input area */}
      {!isThinking && (
        <div className="border-t border-zinc-800 px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What would you like to create today?"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-zinc-700 transition-colors"
              rows={1}
            />
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isThinking}
              className="shrink-0 h-10 w-10 rounded-xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
