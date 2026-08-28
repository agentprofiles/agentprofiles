export type AgentProfileThinkingLevel =
  "off" | "minimal" | "low" | "medium" | "high" | "xhigh";

export type AgentProfileContextSerialization = "default" | "lean";

export type AgentProfileSystemPrompt =
  Readonly<{ text: string }> | Readonly<{ file: Readonly<{ path: string }> }>;

export type AgentProfileCommon = Readonly<{
  systemPrompt?: AgentProfileSystemPrompt;
  thinkingLevel?: AgentProfileThinkingLevel;
  contextSerialization?: AgentProfileContextSerialization;
}>;

export type OpenClawAgentProfileSpec = Readonly<{
  toolProfile?: "lean";
}>;

export type AgentProfileSpec = Readonly<
  {
    common: AgentProfileCommon;
    "openclaw.ai"?: OpenClawAgentProfileSpec;
  } & Record<string, unknown>
>;

export type AgentProfileResource = Readonly<{
  apiVersion: "agentprofiles.io/v1";
  kind: "AgentProfile";
  metadata: Readonly<{
    namespace: string;
    name: string;
  }>;
  extends?: string;
  spec: AgentProfileSpec;
}>;

export type ModelSizeClass = "tiny" | "small" | "medium" | "large";

export type AgentProfileBindingSelector =
  | Readonly<{ artifactDigest: string }>
  | Readonly<{ canonicalModelId: string }>
  | Readonly<{ providerId: string; canonicalModelFamilyId: string }>
  | Readonly<{ modelSizeClass: ModelSizeClass }>;

export type AgentProfileBinding = Readonly<{
  selector: AgentProfileBindingSelector;
  profileId: string;
}>;

export type AgentProfileRegistry = Readonly<{
  schemaVersion: 1;
  profiles: readonly AgentProfileResource[];
  bindings: readonly AgentProfileBinding[];
}>;
