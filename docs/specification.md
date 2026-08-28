---
title: Agent Profiles Specification
description: The v1 file and resource format for Agent Profile packs.
---

# Agent Profiles Specification

This specification defines the v1 format for Agent Profile packs.

An Agent Profile tells an agent harness how to run with a model it has already
selected. The profile can set portable behavior, such as the system prompt and
thinking level, and it can carry harness-specific behavior in domain-named
sections.

## Profile Pack Structure

An Agent Profile pack is a folder with one required `profile.yaml` file.
Referenced files must stay inside the same folder.

```text
acme-1-30b/
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
  namespace: acme
  name: acme-1-30b
spec:
  common:
    systemPrompt:
      file:
        path: ./prompts/system.md
    thinkingLevel: high
```

## Base Profile Example

```yaml
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata:
  namespace: acme
  name: base
spec:
  common:
    systemPrompt:
      file:
        path: ./prompts/system.md
    thinkingLevel: high
```

## Object Model

A profile pack is a folder.

The folder contains one required `profile.yaml` file. That file contains one
`AgentProfile` resource. The resource has metadata for identity and `spec` for
behavior.

The runtime should not use the raw folder during a model request. A loader reads
the profile, resolves inheritance and file references, validates the result, and
passes a resolved profile snapshot to the harness.

## Materialized Registry

A materialized registry contains validated profile resources and automatic
selection bindings. It is loaded before a model request and remains immutable
for that request.

```json
{
  "schemaVersion": 1,
  "profiles": [],
  "bindings": [
    {
      "selector": {
        "modelSizeClass": "small"
      },
      "profileId": "acme/small"
    }
  ]
}
```

| Field           | Required | Type   | Meaning                               |
| --------------- | -------- | ------ | ------------------------------------- |
| `schemaVersion` | Yes      | number | Registry schema version. Must be `1`. |
| `profiles`      | Yes      | array  | Available `AgentProfile` resources.   |
| `bindings`      | Yes      | array  | Model selectors mapped to profiles.   |

A binding has one selector and one `profileId`. A selector must use exactly one
of these shapes:

```json
{ "artifactDigest": "sha256:0123abcd" }
```

```json
{ "canonicalModelId": "acme/model-30b" }
```

```json
{
  "providerId": "acme",
  "canonicalModelFamilyId": "acme/model"
}
```

```json
{ "modelSizeClass": "medium" }
```

Automatic selection uses this order:

1. Exact model artifact digest.
2. Exact canonical model id.
3. Provider-scoped canonical model family.
4. Trusted model-size class.
5. The harness fallback profile.

An explicit harness or agent selection takes precedence over registry bindings.
A registry with more than one match at the same precedence level is invalid.
Bindings that name missing profiles are invalid.

Model-size classes use total parameter count:

| Class    | Total parameters                            |
| -------- | ------------------------------------------- |
| `tiny`   | At most 1 billion                           |
| `small`  | More than 1 billion and at most 20 billion  |
| `medium` | More than 20 billion and at most 50 billion |
| `large`  | More than 50 billion                        |

A size selector may use only trusted structured metadata. A model name that
looks like it contains a parameter count is not selection evidence. Mixture-of-
experts models use total parameters in v1.

## `profile.yaml`

`profile.yaml` must contain one YAML document.

That document must be an `AgentProfile` resource.

| Field        | Required | Type   | Meaning                                              |
| ------------ | -------- | ------ | ---------------------------------------------------- |
| `apiVersion` | Yes      | string | Resource API version. Must be `agentprofiles.io/v1`. |
| `kind`       | Yes      | string | Resource type. Must be `AgentProfile`.               |
| `metadata`   | Yes      | object | Resource identity.                                   |
| `extends`    | No       | string | Parent profile id.                                   |
| `spec`       | Yes      | object | Profile behavior.                                    |

The resource must be JSON-compatible. YAML anchors, custom tags, and executable
YAML features are not part of the format.

## `metadata`

`metadata` identifies the profile.

```yaml
metadata:
  namespace: acme
  name: acme-1-30b
```

| Field       | Required | Type   | Meaning                            |
| ----------- | -------- | ------ | ---------------------------------- |
| `namespace` | Yes      | string | Owner or registry namespace.       |
| `name`      | Yes      | string | Profile name inside the namespace. |

The profile id is `metadata.namespace/metadata.name`.

Names should be stable and lowercase. Use hyphens between words or model name
parts. Do not put provider credentials, endpoint names, or local machine names
in profile identity.

## `extends`

`extends` names a parent profile.

```yaml
extends: acme/base
```

The value must be a profile id. A loader resolves the parent before runtime use.
Missing parents and inheritance cycles are validation errors.

A child profile may override fields from its parent. Field merge behavior must
be defined per field. Generic deep merge is not part of the v1 format.

For v1, `systemPrompt` is replaced as a whole when a child sets it.
`thinkingLevel` uses scalar replacement. An omitted portable field inherits its
parent value. A portable field set by the child replaces the parent value.

Domain-named sections are opaque to the core format. The project that owns a
domain section owns all field semantics, including validation and inheritance
defaults. A core loader preserves profile ancestry and the raw domain-section
values so the owning consumer can resolve them. The core does not merge fields
inside a domain section.

## `spec`

`spec` contains profile behavior.

```yaml
spec:
  common:
    systemPrompt:
      file:
        path: ./prompts/system.md
    thinkingLevel: high
  example.com:
    mode: compact
```

| Field                 | Required | Type   | Meaning                                              |
| --------------------- | -------- | ------ | ---------------------------------------------------- |
| `common`              | Yes      | object | Portable fields that other harnesses may understand. |
| domain-named sections | No       | object | Opaque fields owned by the named project.            |

Unknown fields under `spec.common` are validation errors. The core validates a
domain-named section only as a JSON object and preserves its contents. A
consumer may ignore sections that it does not own or understand.

The format does not include a generic `extra` map.

## `spec.common`

`spec.common` contains portable profile fields.

| Field           | Required | Type   | Meaning                                       |
| --------------- | -------- | ------ | --------------------------------------------- |
| `systemPrompt`  | No       | object | Stable system prompt source for this profile. |
| `thinkingLevel` | No       | string | Portable default thinking level.              |

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

| Field       | Required                 | Type   | Meaning                                     |
| ----------- | ------------------------ | ------ | ------------------------------------------- |
| `text`      | No                       | string | Inline prompt text.                         |
| `file.path` | Yes, when `file` is used | string | Relative path to a prompt file in the pack. |

`file.path` is relative to `profile.yaml`. Absolute paths are invalid. Paths
that escape the profile pack are invalid.

Per-file digests are not part of v1. A future package digest or signature can
cover the complete profile pack, including referenced prompt files.

### `thinkingLevel`

`thinkingLevel` sets a portable default thinking level.

```yaml
thinkingLevel: high
```

Allowed values:

| Value     | Meaning                                         |
| --------- | ----------------------------------------------- |
| `off`     | Disable thinking when the driver supports that. |
| `minimal` | Use the smallest available thinking budget.     |
| `low`     | Use a low thinking budget.                      |
| `medium`  | Use a medium thinking budget.                   |
| `high`    | Use a high thinking budget.                     |
| `xhigh`   | Use an extra-high thinking budget.              |

The selected model driver remains responsible for provider support and request
validation. If a driver cannot use the requested value, it must apply a named
fallback or reject the profile according to its own capability policy.

## Domain-Named Sections

Domain-named sections live under `spec`.

```yaml
spec:
  common:
    thinkingLevel: high
  example.com:
    mode: compact
```

`spec.common` is portable. A domain-named section is owned by the project that
controls that domain. Core types and schemas do not list fields for a specific
consumer.

Use domain sections for behavior that is specific to one harness or project. Do
not put harness-specific values in `spec.common`. The owning project validates
the section, defines defaults, resolves inheritance, and maps the result to
runtime behavior.

A core implementation treats each domain section as an opaque JSON object. It
must not apply a generic deep merge. It preserves the ordered profile ancestry
and raw section values for the owning consumer. Consumer adapters stay in the
consumer repository and are not part of the core package.

## File References

Profile file references are resolved from `profile.yaml`.

Rules:

- paths must be relative;
- paths must stay inside the profile pack;
- missing referenced files are validation errors;
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
6. Apply field-specific inheritance rules.
7. Produce one resolved profile snapshot.

The harness consumes the resolved snapshot. It should not read from the profile
pack during a model request.

## Validation

The machine-readable v1 schemas are
[`agent-profile.schema.json`](https://github.com/agentprofiles/agentprofiles/blob/main/schemas/v1/agent-profile.schema.json)
and
[`registry.schema.json`](https://github.com/agentprofiles/agentprofiles/blob/main/schemas/v1/registry.schema.json).
Shared valid, invalid, and resolved examples live under
[`fixtures/v1`](https://github.com/agentprofiles/agentprofiles/tree/main/fixtures/v1).
Reference implementations must pass these fixtures before release.

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
- domain-named sections that are not JSON objects;
- parent profiles that cannot be resolved;
- inheritance cycles;
- referenced files that do not exist;
- referenced file paths that escape the profile pack;
- generic `extra` maps;
- duplicate profile ids in one registry;
- registry bindings with zero or multiple selector kinds;
- registry bindings that name missing profiles;
- ambiguous registry bindings at the same precedence level.

Future validators may also check package digests, signatures, registry
provenance, and package lock data. Those are distribution concerns and are not
required by the v1 pack format.

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
- whole-pack digests and signatures;
- lockfiles;
- package publishing flows;
- dependency resolution across registries;
- reference validators for TypeScript and Python packages.

Those features should build on the same local pack contract: one required
`profile.yaml`, referenced files inside the pack, and a resolved snapshot before
runtime use.
