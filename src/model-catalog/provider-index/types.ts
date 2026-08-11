// Provider-index types describe install hints, auth choices, and preview catalogs for discoverable providers.
import type { ModelCatalogProvider } from "@natesclaw/model-catalog-core/model-catalog-types";

// Normalized provider-index schema. It describes providers discoverable before
// plugin install, including install hints, auth choices, and preview catalogs.
export type NatesclawProviderIndexPluginInstall = {
  clawhubSpec?: string;
  npmSpec?: string;
  defaultChoice?: "clawhub" | "npm";
  minHostVersion?: string;
  expectedIntegrity?: string;
};

export type NatesclawProviderIndexPlugin = {
  id: string;
  package?: string;
  source?: string;
  install?: NatesclawProviderIndexPluginInstall;
};

export type NatesclawProviderIndexProviderAuthChoice = {
  method: string;
  choiceId: string;
  choiceLabel: string;
  choiceHint?: string;
  assistantPriority?: number;
  assistantVisibility?: "visible" | "manual-only";
  groupId?: string;
  groupLabel?: string;
  groupHint?: string;
  optionKey?: string;
  cliFlag?: string;
  cliOption?: string;
  cliDescription?: string;
  onboardingScopes?: readonly ("text-inference" | "image-generation" | "music-generation")[];
};

export type NatesclawProviderIndexProvider = {
  id: string;
  name: string;
  plugin: NatesclawProviderIndexPlugin;
  docs?: string;
  categories?: readonly string[];
  authChoices?: readonly NatesclawProviderIndexProviderAuthChoice[];
  previewCatalog?: ModelCatalogProvider;
};

export type NatesclawProviderIndex = {
  version: number;
  providers: Readonly<Record<string, NatesclawProviderIndexProvider>>;
};
