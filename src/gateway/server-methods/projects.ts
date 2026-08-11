import path from "node:path";
import {
  ErrorCodes,
  GatewayErrorDetailCodes,
  errorShape,
  validateProjectsAddParams,
  validateProjectsListParams,
  validateProjectsRegisterParams,
  validateProjectsRemoveParams,
  validateProjectsSearchRemoteParams,
} from "../../../packages/gateway-protocol/src/index.js";
import { listRegistryWorktrees } from "../../agents/worktrees/registry.js";
import { loadCombinedSessionStoreForGateway } from "../../config/sessions.js";
import { formatErrorMessage } from "../../infra/errors.js";
import { isPathInside } from "../../infra/path-guards.js";
import { ProjectCloneError } from "../../projects/project-clone-runtime.js";
import {
  deleteClonedProjectCheckout,
  materializeProjectClone,
} from "../../projects/project-clone.js";
import {
  listProjectRegistry,
  ProjectCheckoutError,
  registerProjectRegistry,
  removeProjectRegistry,
  resolveProjectRegistry,
} from "../../projects/project-registry.js";
import { githubApiToken } from "../control-ui-github-api.js";
import { WRITE_SCOPE, authorizeOperatorScopesForRequiredScope } from "../method-scopes.js";
import { searchRemoteProjects } from "../project-github-search.js";
import type { GatewayRequestHandlers } from "./types.js";
import { assertValidParams } from "./validation.js";

export const projectsHandlers: GatewayRequestHandlers = {
  "projects.list": ({ params, respond, context, client }) => {
    if (!assertValidParams(params, validateProjectsListParams, "projects.list", respond)) {
      return;
    }
    const projects = listProjectRegistry(context.getRuntimeConfig());
    const scopes = Array.isArray(client?.connect.scopes) ? client.connect.scopes : [];
    if (authorizeOperatorScopesForRequiredScope(WRITE_SCOPE, scopes).allowed) {
      respond(true, { projects }, undefined);
      return;
    }
    // Project identity is read-safe; host paths and origins are placement
    // details reserved for clients that can create sessions.
    respond(
      true,
      {
        projects: projects.map((project) =>
          project.agentId
            ? {
                id: project.id,
                displayName: project.displayName,
                source: project.source,
                agentId: project.agentId,
              }
            : {
                id: project.id,
                displayName: project.displayName,
                source: project.source,
              },
        ),
      },
      undefined,
    );
  },
  "projects.register": async ({ params, respond }) => {
    if (!assertValidParams(params, validateProjectsRegisterParams, "projects.register", respond)) {
      return;
    }
    try {
      respond(
        true,
        await registerProjectRegistry({ path: params.path, name: params.name }),
        undefined,
      );
    } catch (error) {
      respond(
        false,
        undefined,
        errorShape(
          error instanceof ProjectCheckoutError
            ? ErrorCodes.INVALID_REQUEST
            : ErrorCodes.UNAVAILABLE,
          formatErrorMessage(error),
        ),
      );
    }
  },
  "projects.add": async ({ params, respond, context, signal }) => {
    if (!assertValidParams(params, validateProjectsAddParams, "projects.add", respond)) {
      return;
    }
    try {
      respond(
        true,
        await materializeProjectClone(
          { cfg: context.getRuntimeConfig(), gitUrl: params.gitUrl, name: params.name },
          { signal, token: githubApiToken() },
        ),
        undefined,
      );
    } catch (error) {
      if (error instanceof ProjectCloneError) {
        respond(
          false,
          undefined,
          errorShape(
            error.failure === "invalid_url" ? ErrorCodes.INVALID_REQUEST : ErrorCodes.UNAVAILABLE,
            error.message,
            {
              details: {
                code: GatewayErrorDetailCodes.PROJECT_CLONE_FAILED,
                cause: error.failure,
              },
              retryable: error.failure === "network" || error.failure === "clone_failed",
            },
          ),
        );
        return;
      }
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, formatErrorMessage(error)));
    }
  },
  "projects.searchRemote": async ({ params, respond }) => {
    if (
      !assertValidParams(
        params,
        validateProjectsSearchRemoteParams,
        "projects.searchRemote",
        respond,
      )
    ) {
      return;
    }
    try {
      respond(true, await searchRemoteProjects(params.query), undefined);
    } catch {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.UNAVAILABLE, "GitHub project search is unavailable. Retry shortly.", {
          retryable: true,
        }),
      );
    }
  },
  "projects.remove": async ({ params, respond, context }) => {
    if (!assertValidParams(params, validateProjectsRemoveParams, "projects.remove", respond)) {
      return;
    }
    const project = resolveProjectRegistry(context.getRuntimeConfig(), params.id);
    if (!project || project.source === "workspace") {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, `unknown project id: ${params.id}`),
      );
      return;
    }
    if (params.deleteCheckout) {
      if (project.source !== "cloned") {
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            "Only projects cloned by the Gateway can delete their checkout.",
          ),
        );
        return;
      }
      const normalizedRoot = path.resolve(project.repoRoot);
      const worktreeReference = listRegistryWorktrees(process.env).find(
        (worktree) => !worktree.removedAt && path.resolve(worktree.repoRoot) === normalizedRoot,
      );
      const sessionReference = Object.entries(
        loadCombinedSessionStoreForGateway(context.getRuntimeConfig(), { projection: "list" })
          .store,
      ).find(([, entry]) => {
        if (entry.archivedAt) {
          return false;
        }
        const sessionRoot = entry.worktree?.repoRoot;
        if (sessionRoot && path.resolve(sessionRoot) === normalizedRoot) {
          return true;
        }
        const cwd = entry.spawnedCwd;
        return Boolean(
          cwd &&
          (path.resolve(cwd) === normalizedRoot || isPathInside(normalizedRoot, path.resolve(cwd))),
        );
      });
      if (worktreeReference || sessionReference) {
        const reference = worktreeReference
          ? `managed worktree ${worktreeReference.name}`
          : `session ${sessionReference?.[0]}`;
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            `Project checkout is still referenced by ${reference}. Remove that reference before deleting the checkout.`,
          ),
        );
        return;
      }
      try {
        await deleteClonedProjectCheckout(project);
      } catch (error) {
        respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, formatErrorMessage(error)));
        return;
      }
    }
    if (!removeProjectRegistry(params.id)) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, `unknown project id: ${params.id}`),
      );
      return;
    }
    respond(true, { removed: true }, undefined);
  },
};
