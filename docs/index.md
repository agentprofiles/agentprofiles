---
title: Agent Profiles Overview
description: An open and portable format for customizing agent harnesses for specific AI models.
---

# Agent Profiles Overview

An open and portable format for customizing agent harnesses for specific AI models.

## What are Agent Profiles?

Agent Profiles are an open, versioned format for defining how an AI agent
harness should run with a resolved model.

They let a harness choose the right runtime profile for a model: which tools to
expose, which system prompt to load, which thinking level to use, and which
harness-specific settings to apply.

The profile is tied to the model, but it stays separate from provider auth,
HTTP request details, cache controls, and server tuning.

```yaml
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata:
  namespace: openclaw
  name: qwen3-6-35b-a3b-profile-v1
spec:
  common:
    toolExposure: standard-v1
    systemPrompt:
      file:
        path: ./prompts/qwen3-6-35b-a3b.md
    thinkingLevel: high
```

After a user chooses a model, the harness resolves which model it is going to
run and then finds the best available Agent Profile for it.

That profile may come with the model, be built into the harness, or be found in
an Agent Profile registry. The format does not require one specific discovery or
download mechanism.

The profile tells the harness how to run the agent with that model.

Profiles can describe shared behavior that many harnesses may understand, and
they can also include domain-named sections for harness-specific behavior. For
example, `spec.common` can hold portable fields, while `spec.openclaw.ai` can
hold OpenClaw-owned settings.

## Why Agent Profiles?

Model behavior is increasingly model-family-specific, provider-specific, and
deployment-specific. Keeping those decisions in scattered code paths makes them
hard to review, test, distribute, and explain.

Agent Profiles give teams a concrete artifact that is:

- **Portable**: the same profile shape can be used across compatible harnesses.
- **Versioned**: behavior changes can be reviewed, pinned, and rolled back.
- **Layerable**: a base profile can be reused and overridden for a model
  family, exact model, enterprise deployment, or unreleased model.
- **Inspectable**: operators can see which profile was selected and why.
- **Local at runtime**: installed profiles are resolved and validated before
  use, not fetched during a model request.

## How do Agent Profiles work?

The runtime flow is explicit:

1. Resolve model identity and trusted metadata.
2. Select an Agent Profile through explicit config or registry bindings.
3. Load the profile folder and validate the resolved profile.
4. Apply the profile's harness behavior.
5. Let the model driver enforce provider capabilities and request shape.

## Profile shape

All behavior fields live under `spec`. The `common` section is the
harness-agnostic part. Domain-named sections such as `openclaw.ai` are owned by
the corresponding harness or project and can grow independently without
changing the common schema.

The phase-one common fields are `toolExposure`, `systemPrompt`, and
`thinkingLevel`. Projects can add their own fields under their own
domain-named section.

`thinkingLevel` uses the portable Pi level set: `off`, `minimal`, `low`,
`medium`, `high`, and `xhigh`.

`systemPrompt` can either contain inline text or point at a prompt file in the
same profile pack:

```yaml
systemPrompt:
  text: |
    You are a coding agent.
```

```yaml
systemPrompt:
  file:
    path: ./prompts/qwen3-6-35b-a3b.md
```

A profile pack is a folder with a required `profile.yaml` file. Any files
referenced by the profile must stay inside that folder.

```text
qwen3-6-35b-a3b-profile-v1/
├── profile.yaml
├── prompts/
│   └── system.md
└── README.md
```

## What profiles do not do

Agent Profiles do not replace model selection or provider drivers. They do not
carry credentials, arbitrary tool allow or deny lists, endpoint data, transport
headers, provider request fragments, server launch arguments, cache controls, or
generic `extra` maps.

Those concerns stay with the systems that already own them: model identity,
drivers, secret storage, and serving presets.

## Open development

Agent Profiles are being shaped in public. The current work is focused on the
core resource model, reference profiles, and TypeScript and Python packages for
future consumers.

## Get started

<div class="link-grid">
  <a class="profile-card" href="https://github.com/openclaw/rfcs/pull/18">
    <strong>RFC discussion</strong>
    <span>Track the active design discussion and proposed implementation phases.</span>
  </a>
  <a class="profile-card" href="https://github.com/agentprofiles/agentprofiles">
    <strong>Repository</strong>
    <span>Follow the docs, packages, and future reference artifacts.</span>
  </a>
</div>
