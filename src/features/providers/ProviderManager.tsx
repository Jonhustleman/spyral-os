"use client";

import { useState } from "react";
import { X, Image, Film, Music, Copy, Check, ExternalLink, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Provider Registry ─────────────────────────────────────────────────────

export type ProviderType = "image" | "video" | "voice";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  url: string;
  tier: "free" | "community" | "connected";
  description: string;
  requiresKey: boolean;
}

const PROVIDERS: Provider[] = [
  // Image
  { id: "pollinations", name: "Pollinations", type: "image", url: "https://pollinations.ai", tier: "free", description: "Free AI image generation", requiresKey: false },
  { id: "huggingface-img", name: "HuggingFace", type: "image", url: "https://huggingface.co/spaces", tier: "free", description: "Community image models", requiresKey: false },
  { id: "replicate", name: "Replicate", type: "image", url: "https://replicate.com", tier: "free", description: "Open-source models", requiresKey: true },
  // Video
  { id: "huggingface-vid", name: "HuggingFace Spaces", type: "video", url: "https://huggingface.co/spaces", tier: "free", description: "Community video models", requiresKey: false },
  { id: "ltx", name: "LTX Studio", type: "video", url: "https://ltx.studio", tier: "community", description: "AI video generation", requiresKey: false },
  { id: "wan", name: "Wan", type: "video", url: "https://wan.video", tier: "community", description: "Video generation platform", requiresKey: false },
  // Voice
  { id: "kokoro", name: "Kokoro", type: "voice", url: "https://kokoro.ai", tier: "free", description: "Free voice synthesis", requiresKey: false },
  { id: "piper", name: "Piper", type: "voice", url: "https://github.com/rhasspy/piper", tier: "free", description: "Offline voice synthesis", requiresKey: false },
];

// ─── Component ─────────────────────────────────────────────────────────────

interface ProviderManagerProps {
  type: ProviderType;
  prompt: string;
  onClose: () => void;
}

export function ProviderManager({ type, prompt, onClose }: ProviderManagerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

  const filtered = PROVIDERS.filter((p) => p.type === type);
  const freeProviders = filtered.filter((p) => p.tier === "free");
  const communityProviders = filtered.filter((p) => p.tier === "community");
  const connectedProviders = filtered.filter((p) => p.tier === "connected");

  const copyPrompt = async (providerId: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(providerId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const typeLabel = type === "image" ? "Image" : type === "video" ? "Video" : "Voice";
  const TypeIcon = type === "image" ? Image : type === "video" ? Film : Music;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
              <TypeIcon className="h-4 w-4 text-zinc-300" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Generate {typeLabel}</h3>
              <p className="text-xs text-zinc-500">Choose a provider</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Free Providers */}
          <div>
            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Free Providers</h4>
            <div className="space-y-2">
              {freeProviders.map((provider) => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  isExpanded={expandedProvider === provider.id}
                  onToggle={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                  onCopy={() => copyPrompt(provider.id)}
                  copied={copiedId === provider.id}
                />
              ))}
              {freeProviders.length === 0 && (
                <p className="text-xs text-zinc-600 py-2">No free providers available</p>
              )}
            </div>
          </div>

          {/* Community Providers */}
          {communityProviders.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Community</h4>
              <div className="space-y-2">
                {communityProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    isExpanded={expandedProvider === provider.id}
                    onToggle={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                    onCopy={() => copyPrompt(provider.id)}
                    copied={copiedId === provider.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Connected Providers */}
          {connectedProviders.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Connected</h4>
              <div className="space-y-2">
                {connectedProviders.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    isExpanded={expandedProvider === provider.id}
                    onToggle={() => setExpandedProvider(expandedProvider === provider.id ? null : provider.id)}
                    onCopy={() => copyPrompt(provider.id)}
                    copied={copiedId === provider.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Export Prompt */}
          <div className="border-t border-zinc-800 pt-4">
            <button
              onClick={() => {
                const fullPrompt = `${typeLabel} generation prompt:\n\n${prompt}\n\n---\nOpen in browser to generate directly.`;
                copyPrompt("export");
              }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-zinc-300">Export Prompt Package</span>
              </div>
              {copiedId === "export" ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-zinc-500" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Provider Card ─────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  isExpanded,
  onToggle,
  onCopy,
  copied,
}: {
  provider: Provider;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-zinc-800 flex items-center justify-center">
            <Globe className="h-3 w-3 text-zinc-400" />
          </div>
          <div>
            <span className="text-sm font-medium text-white">{provider.name}</span>
            <span className="text-xs text-zinc-500 ml-2">{provider.description}</span>
          </div>
        </div>
        {!provider.requiresKey && (
          <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">Free</span>
        )}
      </button>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-zinc-500">{provider.description}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5 text-green-400" /> Copied</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy Prompt</>
              )}
            </button>
            <a
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 text-zinc-300 text-xs hover:bg-zinc-700 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>
          {provider.requiresKey && (
            <p className="text-xs text-amber-500">Requires API key — connect in Settings</p>
          )}
        </div>
      )}
    </div>
  );
}
