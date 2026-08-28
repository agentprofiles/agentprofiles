# Agent Profiles

Agent Profiles is an open format and reference TypeScript library for
customizing agent harnesses for specific AI models. It validates portable
profile resources while keeping model identity, provider transport, credentials,
and serving settings in their existing owners.

A profile can select a stable system prompt, a portable thinking level, context
serialization, and harness-specific behavior:

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
    contextSerialization: lean
  openclaw.ai:
    toolProfile: lean
```

## Install

```sh
npm install agentprofiles
```

## Use

The parser accepts one YAML document and returns a validated, typed profile. It
rejects invalid schemas, duplicate keys, YAML anchors, and multiple documents.

```ts
import { parseAgentProfileYaml } from "agentprofiles";

const profile = parseAgentProfileYaml(`
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata:
  namespace: openclaw
  name: small
spec:
  common:
    thinkingLevel: low
    contextSerialization: lean
`);

console.log(profile.metadata.name);
```

The package also exports registry parsing, object validation, TypeScript types,
and the v1 JSON Schemas. It does not load profile packs, read referenced files,
resolve inheritance, or select bindings at runtime. Harness integrations own
those operations.

See the [Agent Profiles specification](docs/specification.md) for the complete
format.

## License

[MIT](LICENSE)
