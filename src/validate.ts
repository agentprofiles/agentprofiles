import {
  Ajv2020,
  type ErrorObject,
  type ValidateFunction,
} from "ajv/dist/2020.js";

import agentProfileSchema from "../schemas/v1/agent-profile.schema.json" with { type: "json" };
import registrySchema from "../schemas/v1/registry.schema.json" with { type: "json" };
import { AgentProfilesError } from "./errors.js";
import type { AgentProfileRegistry, AgentProfileResource } from "./types.js";

const ajv = new Ajv2020({
  allErrors: true,
  allowMatchingProperties: true,
  strict: true,
});

ajv.addSchema(agentProfileSchema);
ajv.addSchema(registrySchema);

const profileValidator = requireValidator(
  "https://agentprofiles.io/schemas/v1/agent-profile.schema.json",
);
const registryValidator = requireValidator(
  "https://agentprofiles.io/schemas/v1/registry.schema.json",
);

export { agentProfileSchema, registrySchema };

export function validateAgentProfile(value: unknown): AgentProfileResource {
  validate(profileValidator, value, "Invalid Agent Profile");
  return value as AgentProfileResource;
}

export function validateAgentProfileRegistry(
  value: unknown,
): AgentProfileRegistry {
  validate(registryValidator, value, "Invalid Agent Profile registry");
  return value as AgentProfileRegistry;
}

function requireValidator(schemaId: string): ValidateFunction {
  const validator = ajv.getSchema(schemaId);
  if (!validator) {
    throw new AgentProfilesError(`Missing bundled schema: ${schemaId}`);
  }
  return validator;
}

function validate(
  validator: ValidateFunction,
  value: unknown,
  message: string,
): asserts value {
  if (!validator(value)) {
    throw new AgentProfilesError(message, formatErrors(validator.errors));
  }
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  return (errors ?? []).map((error) => {
    const path = error.instancePath || "/";
    return `${path} ${error.message ?? "is invalid"}`;
  });
}
