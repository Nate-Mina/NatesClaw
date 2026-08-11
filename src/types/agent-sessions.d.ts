// Declares extension points for agent session type augmentation.
export type NatesclawAgentSessionSkillSourceAugmentation = never;

declare module "natesclaw/plugin-sdk/agent-sessions" {
  interface Skill {
    // Natesclaw relies on the source identifier returned by skill loaders.
    source: string;
  }
}
