# Agent Profiles

Agent Profiles is an open format and reference library for customizing agent
harnesses for specific AI models. It validates portable profile resources while
keeping model identity, provider transport, credentials, and serving settings in
their existing owners.

A profile can select a stable system prompt, a portable thinking level, and
harness-specific behavior:

```yaml
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata:
  namespace: openclaw
  name: small
extends: openclaw/base
spec:
  common:
    systemPrompt:
      file:
        path: ./prompts/system.md
    thinkingLevel: low
  openclaw.ai:
    toolProfile: lean
```

The TypeScript package is not published yet. The repository contains the v1 JSON
Schemas, conformance fixtures, and the first parser and validator. See the
[Agent Profiles specification](docs/specification.md) for the complete format.
