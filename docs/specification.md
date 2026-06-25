---
title: Agent Profiles Specification
description: The v1 file and resource format for Agent Profile packs.
---

# Agent Profiles Specification

This specification defines the v1 format for Agent Profile packs.

An Agent Profile tells an agent harness how to run with a model it has already
selected. The profile can set portable behavior, such as the system prompt and
thinking level, and it can carry harness-specific settings in domain-named
sections.

## Profile Pack Structure

An Agent Profile pack is a folder with one required `profile.yaml` file.
Referenced files must stay inside the same folder.

```text
qwen3-6-35b-a3b-profile-v1/
├── profile.yaml
├── prompts/
│   └── system.md
└── README.md
```

Only `profile.yaml` is required. `prompts/` and `README.md` are examples of
useful supporting files.

The pack folder is the trust boundary. A profile may reference files in its own
pack, but it must not reference files outside the pack.

## Minimal Example

```yaml
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata:
  namespace: openclaw
  name: qwen3-6-35b-a3b-profile-v1
spec:
  common:
    systemPrompt:
      file:
        path: ./prompts/system.md
    thinkingLevel: high
```

## Full Example

```yaml
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata:
  namespace: openclaw
  name: qwen3-6-35b-a3b-lean-profile-v1
extends: openclaw/full-profile-v1
spec:
  common:
    systemPrompt:
      file:
        path: ./prompts/system.md
    thinkingLevel: high
  openclaw.ai:
    toolProfile: lean
    contextPosture: constrained
```

## Object Model

A profile pack is a folder.

The folder contains one required `profile.yaml` file. That file contains one
`AgentProfile` resource. The resource has metadata for identity and `spec` for
behavior.

The runtime should not use the raw folder during a model request. A loader
reads the profile, resolves inheritance and file references, validates the
result, and passes a resolved profile snapshot to the harness.

## `profile.yaml`

`profile.yaml` must contain one YAML document.

That document must be an `AgentProfile` resource.

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `apiVersion` | Yes | string | Resource API version. Must be `agentprofiles.io/v1`. |
| `kind` | Yes | string | Resource type. Must be `AgentProfile`. |
| `metadata` | Yes | object | Resource identity. |
| `extends` | No | string | Parent profile id. |
| `spec` | Yes | object | Profile behavior. |

The resource must be JSON-compatible. YAML anchors, custom tags, and executable
YAML features are not part of the format.

## `metadata`

`metadata` identifies the profile.

```yaml
metadata:
  namespace: openclaw
  name: qwen3-6-35b-a3b-profile-v1
```

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `namespace` | Yes | string | Owner or registry namespace. |
| `name` | Yes | string | Profile name inside the namespace. |

The profile id is `metadata.namespace/metadata.name`.

Names should be stable and lowercase. Use hyphens between words or model name
parts. Do not put provider credentials, endpoint names, or local machine names
in profile identity.

## `extends`

`extends` names a parent profile.

```yaml
extends: openclaw/full-profile-v1
```

The value must be a profile id. A loader resolves the parent before runtime
use. Missing parents and inheritance cycles are validation errors.

A child profile may override fields from its parent. Field merge behavior must
be defined per field. Generic deep merge is not part of the v1 format.

For v1, `systemPrompt` is replaced as a whole when a child sets it.

## `spec`

`spec` contains profile behavior.

```yaml
spec:
  common:
    systemPrompt:
      file:
        path: ./prompts/system.md
    thinkingLevel: high
  openclaw.ai:
    toolProfile: lean
```

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `common` | Yes | object | Portable fields that other harnesses may understand. |
| domain-named sections | No | object | Harness-owned fields, such as `openclaw.ai`. |
| `settings` | No | object | Profile-owned settings validated by a closed schema. |

Unknown fields under `spec.common` are validation errors. Unknown domain-named
sections may be ignored by implementations that do not own or understand them,
unless that implementation chooses a stricter policy.

The format does not include a generic `extra` map.

## `spec.common`

`spec.common` contains portable profile fields.

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `systemPrompt` | No | object | Stable system prompt source for this profile. |
| `thinkingLevel` | No | string | Portable default thinking level. |

If `spec.common` is empty, the harness uses its own defaults for portable
behavior.

### `systemPrompt`

`systemPrompt` chooses the stable system prompt text for the profile.

It must use exactly one source type: `text` or `file`.

Inline text:

```yaml
systemPrompt:
  text: |
    You are a coding agent.
```

File source:

```yaml
systemPrompt:
  file:
    path: ./prompts/system.md
```

With a digest:

```yaml
systemPrompt:
  file:
    path: ./prompts/system.md
    digest: sha256:2f8a...
```

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `text` | No | string | Inline prompt text. |
| `file.path` | Yes, when `file` is used | string | Relative path to a prompt file in the pack. |
| `file.digest` | No | string | Content digest for the referenced file. |

`file.path` is relative to `profile.yaml`. Absolute paths are invalid. Paths
that escape the profile pack are invalid.

If `file.digest` is present, the loader must verify the referenced file content.
A digest mismatch is a validation error.

### `thinkingLevel`

`thinkingLevel` sets a portable default thinking level.

```yaml
thinkingLevel: high
```

Allowed values:

| Value | Meaning |
| --- | --- |
| `off` | Disable thinking when the driver supports that. |
| `minimal` | Use the smallest available thinking budget. |
| `low` | Use a low thinking budget. |
| `medium` | Use a medium thinking budget. |
| `high` | Use a high thinking budget. |
| `xhigh` | Use an extra-high thinking budget. |

The selected model driver remains responsible for provider support and request
validation. If a driver cannot use the requested value, it must apply a named
fallback or reject the profile according to its own capability policy.

## Domain-Named Sections

Domain-named sections live under `spec`.

```yaml
spec:
  common:
    thinkingLevel: high
  openclaw.ai:
    toolProfile: lean
```

`spec.common` is portable. A domain-named section is owned by the project that
controls that domain.

Use domain sections for behavior that is specific to one harness or project.
Do not put harness-specific values in `spec.common`.

## `spec.openclaw.ai`

`spec.openclaw.ai` is the OpenClaw-owned section.

Other harnesses may ignore it.

| Field | Required | Type | Meaning |
| --- | --- | --- | --- |
| `toolProfile` | No | string | OpenClaw tool behavior profile. |
| `contextPosture` | No | string | Diagnostic compactness intent. |
| `thinkingLevel` | No | string | OpenClaw-only thinking level. |

### `toolProfile`

```yaml
openclaw.ai:
  toolProfile: lean
```

Allowed values:

| Value | Meaning |
| --- | --- |
| `lean` | Apply OpenClaw's Lean tool behavior. |

If `toolProfile` is omitted, OpenClaw uses its normal tool behavior.

### `contextPosture`

```yaml
openclaw.ai:
  contextPosture: constrained
```

Allowed values:

| Value | Meaning |
| --- | --- |
| `constrained` | Record that the profile is meant for constrained context use. |

`contextPosture` is diagnostic in v1. It is not a context-window override.

### `thinkingLevel`

```yaml
openclaw.ai:
  thinkingLevel: adaptive
```

Allowed values:

| Value | Meaning |
| --- | --- |
| `adaptive` | Let OpenClaw select a model-appropriate thinking level. |
| `max` | Use OpenClaw's maximum thinking level when supported. |

These values are OpenClaw-specific. Portable thinking values belong in
`spec.common.thinkingLevel`.

## `spec.settings`

`spec.settings` is optional.

It is for settings that are owned by the selected profile and validated by that
profile's closed settings schema.

```yaml
spec:
  settings: {}
```

Do not use `settings` as a generic configuration bag. A setting is valid only
when the profile schema defines it.

Provider credentials, HTTP request options, cache controls, server launch
arguments, and driver payload fragments do not belong in `settings`.

## File References

Profile file references are resolved from `profile.yaml`.

Rules:

- paths must be relative;
- paths must stay inside the profile pack;
- missing referenced files are validation errors;
- digest mismatches are validation errors;
- referenced files are read before runtime use;
- referenced files must not be fetched during a model request.

Valid:

```yaml
systemPrompt:
  file:
    path: ./prompts/system.md
```

Invalid:

```yaml
systemPrompt:
  file:
    path: ../shared/system.md
```

## Resolution

A loader resolves an Agent Profile before runtime use.

The resolution flow is:

1. Parse `profile.yaml`.
2. Validate `apiVersion`, `kind`, `metadata`, and `spec`.
3. Resolve `extends`, if present.
4. Reject missing parents and cycles.
5. Resolve file references.
6. Verify digests, if present.
7. Apply field-specific inheritance rules.
8. Produce one resolved profile snapshot.

The harness consumes the resolved snapshot. It should not read from the profile
pack during a model request.

## Validation

A v1 validator must reject:

- missing `profile.yaml`;
- invalid YAML;
- multiple YAML documents in one `profile.yaml`;
- unsupported `apiVersion`;
- unsupported `kind`;
- missing `metadata.namespace`;
- missing `metadata.name`;
- missing `spec`;
- unknown fields under `spec.common`;
- invalid `thinkingLevel` values;
- invalid OpenClaw section values;
- parent profiles that cannot be resolved;
- inheritance cycles;
- referenced files that do not exist;
- referenced file paths that escape the profile pack;
- digest mismatches;
- generic `extra` maps.

Future validators may also check signatures, registry provenance, and package
lock data. Those are distribution concerns and are not required by the v1 pack
format.

## Boundaries

Agent Profiles do not replace model selection.

A harness selects or resolves the model first. It then selects the best
available Agent Profile for that resolved model.

Agent Profiles also do not contain:

- provider credentials;
- endpoint URLs;
- HTTP headers;
- provider request fragments;
- arbitrary tool allow or deny lists;
- server launch arguments;
- KV cache controls;
- model artifact files;
- executable hooks.

Those concerns stay with the systems that already own them: model identity,
provider drivers, secret storage, serving presets, and harness configuration.

## Runtime Expectations

Profiles may be built into a harness, shipped with a model, installed from a
registry, or mirrored inside an enterprise network.

The distribution mechanism can vary. The runtime rule is the same: profiles are
loaded, resolved, and validated before use. A model request must not trigger a
remote fetch for profile content.

## Future Work

The v1 pack format defines the local profile artifact.

Future work may define:

- registry metadata;
- signatures;
- lockfiles;
- package publishing flows;
- dependency resolution across registries;
- richer profile settings schemas;
- reference validators for TypeScript and Python packages.

Those features should build on the same local pack contract: one required
`profile.yaml`, referenced files inside the pack, and a resolved snapshot before
runtime use.
