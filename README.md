# Agent Profiles

Agent Profiles is an open format and reference TypeScript library for
customizing agent harnesses for specific AI models. It validates portable
profile resources while keeping model identity, provider transport, credentials,
and serving settings in their existing owners.

A profile can select a stable system prompt and a portable thinking level. A
domain-named section can carry behavior owned by one harness:

```yaml
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata:
  namespace: acme
  name: compact
extends: acme/base
spec:
  common:
    systemPrompt:
      file:
        path: ./prompts/system.md
    thinkingLevel: low
  example.com:
    mode: compact
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
  namespace: acme
  name: compact
spec:
  common:
    thinkingLevel: low
  example.com:
    mode: compact
`);

console.log(profile.metadata.name);
```

The core checks that a domain-named section is a JSON object and otherwise
preserves it unchanged. The consumer that owns the domain validates its fields
and defines its defaults and inheritance rules.

The package also exports registry parsing, object validation, TypeScript types,
and the v1 JSON Schemas. It does not load profile packs, read referenced files,
resolve inheritance, or select bindings at runtime. Harness integrations own
those operations.

See the [Agent Profiles specification](docs/specification.md) for the complete
format.

## License

[MIT](LICENSE)
