import "./remote-skills.js";

type RemoteNodeSkillsTestApi = {
  resetRemoteNodeSkillsForTests(): void;
};

function getTestApi(): RemoteNodeSkillsTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("natesclaw.remoteNodeSkillsTestApi")
  ] as RemoteNodeSkillsTestApi;
}

export function resetRemoteNodeSkillsForTests(): void {
  getTestApi().resetRemoteNodeSkillsForTests();
}
