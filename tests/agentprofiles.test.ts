import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  AgentProfilesError,
  parseAgentProfileRegistryYaml,
  parseAgentProfileYaml,
  validateAgentProfile,
  validateAgentProfileRegistry,
} from "../src/index.js";

const fixtureRoot = fileURLToPath(new URL("../fixtures/v1/", import.meta.url));

function readFixture(path: string): string {
  return readFileSync(join(fixtureRoot, path), "utf8");
}

describe("Agent Profile YAML", () => {
  for (const filename of readdirSync(join(fixtureRoot, "valid"))) {
    it(`accepts ${filename}`, () => {
      const profile = parseAgentProfileYaml(readFixture(`valid/${filename}`));
      expect(profile.apiVersion).toBe("agentprofiles.io/v1");
    });
  }

  for (const filename of readdirSync(join(fixtureRoot, "invalid"))) {
    it(`rejects ${filename}`, () => {
      expect(() =>
        parseAgentProfileYaml(readFixture(`invalid/${filename}`)),
      ).toThrow(AgentProfilesError);
    });
  }

  it("rejects multiple YAML documents", () => {
    const profile = readFixture("valid/small.yaml");
    expect(() => parseAgentProfileYaml(`${profile}\n---\n${profile}`)).toThrow(
      "Expected exactly one YAML document",
    );
  });

  it("rejects YAML anchors", () => {
    const source = `
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata: &identity
  namespace: openclaw
  name: anchored
spec:
  common: {}
`;
    expect(() => parseAgentProfileYaml(source)).toThrow(
      "YAML anchors are not supported",
    );
  });

  it("rejects duplicate YAML keys", () => {
    const source = `
apiVersion: agentprofiles.io/v1
apiVersion: agentprofiles.io/v1
kind: AgentProfile
metadata:
  namespace: openclaw
  name: duplicate
spec:
  common: {}
`;
    expect(() => parseAgentProfileYaml(source)).toThrow(
      "Invalid Agent Profile YAML",
    );
  });

  it("reports YAML parser errors", () => {
    try {
      parseAgentProfileYaml("metadata: [");
      throw new Error("expected parsing to fail");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AgentProfilesError);
      if (error instanceof AgentProfilesError) {
        expect(error.message).toBe("Invalid Agent Profile YAML");
        expect(error.issues[0]?.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("schema validation", () => {
  it("returns a typed profile after validation", () => {
    const profile = validateAgentProfile({
      apiVersion: "agentprofiles.io/v1",
      kind: "AgentProfile",
      metadata: { namespace: "openclaw", name: "base" },
      spec: { common: {} },
    });
    expect(profile.metadata.name).toBe("base");
  });

  it("reports profile validation issues", () => {
    try {
      validateAgentProfile({});
      throw new Error("expected validation to fail");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AgentProfilesError);
      if (error instanceof AgentProfilesError) {
        expect(error.issues.length).toBeGreaterThan(0);
      }
    }
  });

  it("accepts the registry fixture", () => {
    const registry = validateAgentProfileRegistry(
      JSON.parse(readFixture("resolved/registry.json")) as unknown,
    );
    expect(registry.bindings).toHaveLength(2);
  });

  it("parses a YAML registry", () => {
    const registry = parseAgentProfileRegistryYaml(
      readFixture("resolved/registry.json"),
    );
    expect(registry.schemaVersion).toBe(1);
  });

  it("rejects a registry with a compound selector", () => {
    const registry: unknown = {
      schemaVersion: 1,
      profiles: [],
      bindings: [
        {
          selector: {
            canonicalModelId: "acme/model",
            modelSizeClass: "small",
          },
          profileId: "openclaw/small",
        },
      ],
    };
    expect(() => validateAgentProfileRegistry(registry)).toThrow(
      AgentProfilesError,
    );
  });
});
