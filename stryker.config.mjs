export default {
  coverageAnalysis: "perTest",
  mutate: ["src/parse.ts"],
  reporters: ["clear-text", "progress"],
  testRunner: "vitest",
  thresholds: {
    break: 85,
    high: 100,
    low: 85,
  },
};
