export class AgentProfilesError extends Error {
  readonly issues: readonly string[];

  constructor(message: string, issues: readonly string[] = []) {
    super(message);
    this.name = "AgentProfilesError";
    this.issues = issues;
  }
}
