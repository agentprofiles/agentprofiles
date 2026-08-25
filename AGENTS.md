# AGENTS.md

These instructions apply to this repository.

- Run `make check` before finishing a change.
- Keep TypeScript strict and do not use explicit `any`.
- Validate unknown profile data before converting it to domain types.
- Add or update tests and conformance fixtures for every behavior change.
- Keep portable schema, parsing, and resolution behavior independent from any
  harness implementation.
- Keep OpenClaw behavior, provider drivers, authentication, and serving settings
  outside the shared library.
- Do not add a dependency unless it removes real parsing or validation
  complexity.
- Do not publish placeholder packages.
- Follow the Slophammer agent entrypoint when changing quality gates:
  <https://github.com/osolmaz/slophammer/blob/main/docs/AGENT_ENTRYPOINT.md>.
