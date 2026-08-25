import { isNode, parseAllDocuments, visit } from "yaml";

import { AgentProfilesError } from "./errors.js";
import type { AgentProfileRegistry, AgentProfileResource } from "./types.js";
import {
  validateAgentProfile,
  validateAgentProfileRegistry,
} from "./validate.js";

export function parseAgentProfileYaml(source: string): AgentProfileResource {
  return validateAgentProfile(parseSingleYamlDocument(source));
}

export function parseAgentProfileRegistryYaml(
  source: string,
): AgentProfileRegistry {
  return validateAgentProfileRegistry(parseSingleYamlDocument(source));
}

function parseSingleYamlDocument(source: string): unknown {
  const documents = parseAllDocuments(source);
  const document = documents.shift();

  if (!document || documents.length > 0) {
    throw new AgentProfilesError("Expected exactly one YAML document");
  }

  const parserIssues = [...document.errors, ...document.warnings].map(
    (issue) => issue.message,
  );
  if (parserIssues.length > 0) {
    throw new AgentProfilesError("Invalid Agent Profile YAML", parserIssues);
  }

  visit(document, (_key, node) => {
    if (isNode(node) && node.anchor) {
      throw new AgentProfilesError("YAML anchors are not supported");
    }
  });

  return document.toJS({ maxAliasCount: 0 }) as unknown;
}
