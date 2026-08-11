import Foundation
import NatesclawChatUI
import NatesclawKit
import NatesclawProtocol
import OSLog

struct IOSGatewayChatTransport: NatesclawChatTransport {
    static let logger = Logger(subsystem: "ai.natesclawfoundation.app", category: "ios.chat.transport")
    private let gateway: GatewayNodeSession
    private let widgetGateway: GatewayNodeSession?
    private let globalAgentId: String?
    private let outboxGatewayID: String?
    private let sessionMutationRequest: (@Sendable (NatesclawChatGatewayRequest) async throws -> Data)?
    private let mediaArtifactLoader: IOSMediaArtifactLoader?

    var outboxRequiresSessionRoutingContract: Bool {
        true
    }

    init(
        gateway: GatewayNodeSession,
        widgetGateway: GatewayNodeSession? = nil,
        globalAgentId: String? = nil,
        outboxGatewayID: String? = nil,
        sessionMutationRequest: (@Sendable (NatesclawChatGatewayRequest) async throws -> Data)? = nil,
        mediaArtifactLoader: IOSMediaArtifactLoader? = nil)
    {
        self.gateway = gateway
        self.widgetGateway = widgetGateway
        let normalized = globalAgentId?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        self.globalAgentId = normalized?.isEmpty == false ? normalized : nil
        let normalizedGatewayID = outboxGatewayID?.trimmingCharacters(in: .whitespacesAndNewlines)
        self.outboxGatewayID = normalizedGatewayID?.isEmpty == false ? normalizedGatewayID : nil
        self.sessionMutationRequest = sessionMutationRequest
        self.mediaArtifactLoader = mediaArtifactLoader
    }

    func acquireOutboxRouteLease() async -> NatesclawChatTransportRouteLeaseResult {
        guard let outboxGatewayID,
              let route = await gateway.currentRoute(ifGatewayID: outboxGatewayID)
        else { return .unavailable(reason: nil) }
        guard let supportsRoutingContract = await gateway.supportsServerCapability(
            .chatSendRoutingContract,
            ifCurrentRoute: route)
        else { return .unavailable(reason: nil) }
        guard supportsRoutingContract else {
            return .unavailable(
                reason: NatesclawChatTransportUpgradeMessage.routingContract,
                allowsLiveSend: true)
        }
        let transport = self
        guard let routingContract = try? await transport.sessionRoutingContract(ifCurrentRoute: route)
        else { return .unavailable(reason: nil) }
        return .available(NatesclawChatTransportRouteLease(
            sendTargetedMessage: { sessionKey, agentID, message, thinking, idempotencyKey, attachments in
                try await transport.sendMessage(
                    sessionKey: sessionKey,
                    agentID: agentID,
                    expectedSessionRoutingContract: routingContract,
                    message: message,
                    thinking: thinking,
                    idempotencyKey: idempotencyKey,
                    attachments: attachments,
                    ifCurrentRoute: route,
                    distinguishPreDispatchRouteChange: true)
            },
            requestTargetedHistory: { sessionKey, agentID in
                try await transport.requestHistory(
                    sessionKey: sessionKey,
                    agentID: agentID,
                    ifCurrentRoute: route)
            },
            sessionRoutingContract: routingContract))
    }

    func acquireSwarmRouteLease() async -> NatesclawChatSwarmRouteLease? {
        guard let route = await self.currentSessionMutationRoute() else { return nil }
        let transport = self
        return NatesclawChatSwarmRouteLease(
            isEnabled: { sessionKey in
                try await transport.isSwarmEnabled(sessionKey: sessionKey, ifCurrentRoute: route)
            },
            listChildSessions: { parentKey in
                try await transport.listChildSessions(parentKey: parentKey, ifCurrentRoute: route)
            })
    }

    func acquireSessionSettingsRouteLease() async -> NatesclawChatSessionSettingsRouteLease? {
        let route = await currentSessionMutationRoute()
        guard let route else { return nil }
        let transport = self
        return NatesclawChatSessionSettingsRouteLease { sessionKey, agentID, patch in
            try await transport.patchSessionSettings(
                sessionKey: sessionKey,
                agentID: agentID,
                patch: patch,
                ifCurrentRoute: route)
        }
    }

    func acquireSessionMutationRouteLease() async -> NatesclawChatSessionMutationRouteLease? {
        guard let route = await currentSessionMutationRoute() else { return nil }
        let transport = self
        return NatesclawChatSessionMutationRouteLease(
            patchSession: { key, label, category, pinned, archived, unread in
                let target = transport.sessionTarget(for: key)
                let request = NatesclawChatGatewayRequests.patchSession(
                    sessionKey: target.sessionKey,
                    agentID: target.agentID,
                    label: label,
                    category: category,
                    pinned: pinned,
                    archived: archived,
                    unread: unread)
                _ = try await transport.requestSessionMutation(request, ifCurrentRoute: route)
            },
            deleteSession: { key in
                let target = transport.sessionTarget(for: key)
                let request = NatesclawChatGatewayRequests.deleteSession(
                    sessionKey: target.sessionKey,
                    agentID: target.agentID)
                _ = try await transport.requestSessionMutation(request, ifCurrentRoute: route)
            })
    }

    func acquireSessionGroupsRouteLease() async -> NatesclawChatSessionGroupsRouteLease? {
        guard let route = await currentSessionMutationRoute() else { return nil }
        let transport = self
        return Self.makeSessionGroupsRouteLease { request in
            try await transport.requestSessionMutation(request, ifCurrentRoute: route)
        }
    }

    func acquireNewSessionRouteLease() async -> NatesclawChatNewSessionRouteLease? {
        guard let route = await currentSessionMutationRoute() else { return nil }
        let transport = self
        let request: @Sendable (NatesclawChatGatewayRequest) async throws -> Data = { request in
            try await transport.requestSessionMutation(request, ifCurrentRoute: route)
        }
        return NatesclawChatNewSessionRouteLease(
            listAgents: {
                let data = try await request(NatesclawChatGatewayRequests.agentsList())
                let result = try JSONDecoder().decode(AgentsListResult.self, from: data)
                return NatesclawChatAgentsListResponse(
                    defaultId: result.defaultid,
                    agents: result.agents.filter(\.isSelectableAgent).map {
                        NatesclawChatAgentChoice(
                            id: $0.id,
                            name: $0.name,
                            workspaceGit: $0.workspacegit)
                    })
            },
            createSession: { key, label, agentID, parentSessionKey, worktree, worktreeBaseRef in
                let createRequest = transport.createSessionRequest(
                    key: key,
                    label: label,
                    agentID: agentID,
                    parentSessionKey: parentSessionKey,
                    worktree: worktree,
                    worktreeBaseRef: worktreeBaseRef)
                let data = try await request(createRequest)
                return try JSONDecoder().decode(NatesclawChatCreateSessionResponse.self, from: data)
            })
    }

    private func currentSessionMutationRoute() async -> GatewayNodeSessionRoute? {
        if let outboxGatewayID {
            return await self.gateway.currentRoute(ifGatewayID: outboxGatewayID)
        }
        return await self.gateway.currentRoute()
    }

    private func sessionRoutingContract(
        ifCurrentRoute route: GatewayNodeSessionRoute) async throws -> String
    {
        let data = try await gateway.request(
            NatesclawChatGatewayRequests.agentsList(),
            ifCurrentRoute: route)
        return try NatesclawChatGatewayPayloadCodec.decodeSessionRoutingIdentity(data).contract
    }

    typealias SessionTarget = NatesclawChatSessionTarget

    static func sessionTarget(
        for rawSessionKey: String,
        selectedAgentID: String?,
        overrideAgentID: String? = nil) -> SessionTarget
    {
        NatesclawChatSessionTarget.resolve(
            rawSessionKey,
            selectedAgentID: selectedAgentID,
            overrideAgentID: overrideAgentID,
            policy: .scopeBareKeysToSelectedAgent)
    }

    private func sessionTarget(
        for sessionKey: String,
        overrideAgentID: String? = nil) -> SessionTarget
    {
        Self.sessionTarget(
            for: sessionKey,
            selectedAgentID: self.globalAgentId,
            overrideAgentID: overrideAgentID)
    }

    private func requestSessionMutation(_ request: NatesclawChatGatewayRequest) async throws -> Data {
        if let sessionMutationRequest {
            return try await sessionMutationRequest(request)
        }
        return try await self.gateway.request(request)
    }

    private func requestSessionMutation(
        _ request: NatesclawChatGatewayRequest,
        ifCurrentRoute route: GatewayNodeSessionRoute) async throws -> Data
    {
        try await self.gateway.request(
            request,
            ifCurrentRoute: route,
            distinguishPreDispatchRouteChange: true)
    }

    static func makeSessionGroupsRouteLease(
        request: @escaping @Sendable (NatesclawChatGatewayRequest) async throws -> Data)
        -> NatesclawChatSessionGroupsRouteLease
    {
        NatesclawChatSessionGroupsRouteLease(
            listGroups: {
                let data = try await request(NatesclawChatGatewayRequests.sessionGroupsList())
                return try JSONDecoder().decode(NatesclawChatSessionGroupsResponse.self, from: data)
            },
            putGroups: { names in
                let data = try await request(NatesclawChatGatewayRequests.sessionGroupsPut(names: names))
                return try JSONDecoder().decode(NatesclawChatSessionGroupsMutationResponse.self, from: data)
            },
            renameGroup: { name, to in
                let data = try await request(NatesclawChatGatewayRequests.sessionGroupsRename(name: name, to: to))
                return try JSONDecoder().decode(NatesclawChatSessionGroupsMutationResponse.self, from: data)
            },
            deleteGroup: { name in
                let data = try await request(NatesclawChatGatewayRequests.sessionGroupsDelete(name: name))
                return try JSONDecoder().decode(NatesclawChatSessionGroupsMutationResponse.self, from: data)
            })
    }

    func createSession(
        key: String,
        label: String?,
        parentSessionKey: String?,
        worktree: Bool?) async throws -> NatesclawChatCreateSessionResponse
    {
        try await self.createSession(
            key: key,
            label: label,
            agentID: nil,
            parentSessionKey: parentSessionKey,
            worktree: worktree,
            worktreeBaseRef: nil)
    }

    func createSession(
        key: String,
        label: String?,
        agentID: String?,
        parentSessionKey: String?,
        worktree: Bool?,
        worktreeBaseRef: String?) async throws -> NatesclawChatCreateSessionResponse
    {
        let request = self.createSessionRequest(
            key: key,
            label: label,
            agentID: agentID,
            parentSessionKey: parentSessionKey,
            worktree: worktree,
            worktreeBaseRef: worktreeBaseRef)
        let res = try await requestSessionMutation(request)
        return try JSONDecoder().decode(NatesclawChatCreateSessionResponse.self, from: res)
    }

    private func createSessionRequest(
        key: String,
        label: String?,
        agentID: String?,
        parentSessionKey: String?,
        worktree: Bool?,
        worktreeBaseRef: String?) -> NatesclawChatGatewayRequest
    {
        let target = self.sessionTarget(for: key, overrideAgentID: agentID)
        let parentTarget = parentSessionKey.map { self.sessionTarget(for: $0) }
        let explicitAgentID = agentID?
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased()
        return NatesclawChatGatewayRequests.createSession(
            key: target.sessionKey,
            agentID: explicitAgentID?.isEmpty == false
                ? explicitAgentID
                : target.agentID ?? parentTarget?.agentID,
            label: label,
            parentSessionKey: parentTarget?.sessionKey,
            worktree: worktree,
            worktreeBaseRef: worktreeBaseRef)
    }

    func abortRun(sessionKey: String, runId: String) async throws {
        let target = self.sessionTarget(for: sessionKey)
        let request = NatesclawChatGatewayRequests.abortRun(
            sessionKey: target.sessionKey,
            agentID: target.agentID,
            runID: runId)
        _ = try await self.gateway.request(request)
    }

    func listSessions(
        limit: Int?,
        search: String?,
        archived: Bool) async throws -> NatesclawChatSessionsListResponse
    {
        let request = NatesclawChatGatewayRequests.sessionsList(
            limit: limit,
            search: search,
            archived: archived)
        let res = try await gateway.request(request)
        return try JSONDecoder().decode(NatesclawChatSessionsListResponse.self, from: res)
    }

    func listChildSessions(parentKey: String) async throws -> [NatesclawChatSessionEntry] {
        try await self.listChildSessions(parentKey: parentKey, ifCurrentRoute: nil)
    }

    private func listChildSessions(
        parentKey: String,
        ifCurrentRoute route: GatewayNodeSessionRoute?) async throws -> [NatesclawChatSessionEntry]
    {
        try await NatesclawChatChildSessionPager.collect { offset in
            let request = NatesclawChatGatewayRequests.sessionsList(
                limit: 10000,
                search: nil,
                archived: false,
                includeGlobal: false,
                spawnedBy: parentKey,
                offset: offset,
                configuredAgentsOnly: true)
            let data = try await gateway.request(request, ifCurrentRoute: route)
            return try JSONDecoder().decode(NatesclawChatSessionsListResponse.self, from: data)
        }
    }

    func listModels() async throws -> [NatesclawChatModelChoice] {
        let response = try await gateway.request(NatesclawChatGatewayRequests.modelsList())
        return try NatesclawChatGatewayPayloadCodec.decodeModelChoices(response)
    }

    func isSwarmEnabled(sessionKey: String) async throws -> Bool {
        try await self.isSwarmEnabled(sessionKey: sessionKey, ifCurrentRoute: nil)
    }

    private func isSwarmEnabled(
        sessionKey: String,
        ifCurrentRoute route: GatewayNodeSessionRoute?) async throws -> Bool
    {
        let request = NatesclawChatGatewayRequests.chatMetadata(
            sessionKey: sessionKey,
            fallbackAgentID: self.globalAgentId)
        let response = try await gateway.request(request, ifCurrentRoute: route)
        return try JSONDecoder().decode(NatesclawChatMetadataCapabilities.self, from: response).swarmEnabled
    }

    func setSessionModel(sessionKey: String, model: String?) async throws {
        _ = try await self.patchSessionModel(sessionKey: sessionKey, agentID: nil, model: model)
    }

    func patchSessionModel(
        sessionKey: String,
        agentID: String?,
        model: String?) async throws -> NatesclawChatModelPatchResult?
    {
        try await self.patchSessionSettings(
            sessionKey: sessionKey,
            agentID: agentID,
            patch: NatesclawChatSessionSettingsPatch(model: .some(model)))
    }

    func patchSessionSettings(
        sessionKey: String,
        agentID: String?,
        patch: NatesclawChatSessionSettingsPatch) async throws -> NatesclawChatModelPatchResult?
    {
        try await self.patchSessionSettings(
            sessionKey: sessionKey,
            agentID: agentID,
            patch: patch,
            ifCurrentRoute: nil)
    }

    private func patchSessionSettings(
        sessionKey: String,
        agentID: String?,
        patch: NatesclawChatSessionSettingsPatch,
        ifCurrentRoute expectedRoute: GatewayNodeSessionRoute?) async throws -> NatesclawChatModelPatchResult?
    {
        let target = self.sessionTarget(for: sessionKey, overrideAgentID: agentID)
        let request = NatesclawChatGatewayRequests.patchSessionSettings(
            sessionKey: target.sessionKey,
            agentID: target.agentID,
            model: patch.model,
            thinkingLevel: patch.thinkingLevel,
            fastMode: patch.fastMode,
            verboseLevel: patch.verboseLevel)
        let response = if let expectedRoute {
            try await self.gateway.request(
                request,
                ifCurrentRoute: expectedRoute,
                distinguishPreDispatchRouteChange: true)
        } else {
            try await self.requestSessionMutation(request)
        }
        return try Self.decodeModelPatchResult(response)
    }

    static func decodeModelPatchResult(_ data: Data) throws -> NatesclawChatModelPatchResult {
        try JSONDecoder().decode(NatesclawChatModelPatchResult.self, from: data)
    }

    func setSessionThinking(sessionKey: String, thinkingLevel: String) async throws {
        let target = self.sessionTarget(for: sessionKey)
        _ = try await self.patchSessionSettings(
            sessionKey: target.sessionKey,
            agentID: target.agentID,
            patch: NatesclawChatSessionSettingsPatch(thinkingLevel: .some(thinkingLevel)))
    }

    func patchSession(
        key: String,
        label: String?? = nil,
        category: String?? = nil,
        pinned: Bool? = nil,
        archived: Bool? = nil,
        unread: Bool? = nil) async throws
    {
        let target = self.sessionTarget(for: key)
        let request = NatesclawChatGatewayRequests.patchSession(
            sessionKey: target.sessionKey,
            agentID: target.agentID,
            label: label,
            category: category,
            pinned: pinned,
            archived: archived,
            unread: unread)
        _ = try await self.requestSessionMutation(request)
    }

    func deleteSession(key: String) async throws {
        let target = self.sessionTarget(for: key)
        let request = NatesclawChatGatewayRequests.deleteSession(
            sessionKey: target.sessionKey,
            agentID: target.agentID)
        _ = try await self.requestSessionMutation(request)
    }

    func forkSession(parentKey: String) async throws -> String {
        let target = self.sessionTarget(for: parentKey)
        let childAgentID = target.agentID ?? NatesclawChatSessionKey.agentID(from: target.sessionKey)
        let request = NatesclawChatGatewayRequests.forkSession(
            parentSessionKey: target.sessionKey,
            agentID: childAgentID)
        let response = try await requestSessionMutation(request)
        return try JSONDecoder().decode(NatesclawChatCreateSessionResponse.self, from: response).key
    }

    func rewindSession(
        sessionKey: String,
        entryId: String) async throws -> NatesclawChatRewindResponse
    {
        let target = self.sessionTarget(for: sessionKey)
        let request = NatesclawChatGatewayRequests.rewindSession(
            sessionKey: target.sessionKey,
            agentID: target.agentID,
            entryId: entryId)
        let response = try await requestSessionMutation(request)
        return try JSONDecoder().decode(NatesclawChatRewindResponse.self, from: response)
    }

    func forkSessionAtMessage(
        sessionKey: String,
        entryId: String) async throws -> NatesclawChatForkAtMessageResponse
    {
        let target = self.sessionTarget(for: sessionKey)
        let request = NatesclawChatGatewayRequests.forkAtMessage(
            sessionKey: target.sessionKey,
            agentID: target.agentID,
            entryId: entryId)
        let response = try await requestSessionMutation(request)
        return try JSONDecoder().decode(NatesclawChatForkAtMessageResponse.self, from: response)
    }

    func listSessionBranches(
        sessionKey: String,
        agentID: String?) async throws -> NatesclawChatSessionBranchesResponse
    {
        let target = self.sessionTarget(for: sessionKey, overrideAgentID: agentID)
        let request = NatesclawChatGatewayRequests.listSessionBranches(
            sessionKey: target.sessionKey,
            agentID: target.agentID)
        let response = try await gateway.request(request)
        return try JSONDecoder().decode(NatesclawChatSessionBranchesResponse.self, from: response)
    }

    func switchSessionBranch(sessionKey: String, agentID: String?, leafEntryId: String) async throws {
        let target = self.sessionTarget(for: sessionKey)
        let request = NatesclawChatGatewayRequests.switchSessionBranch(
            sessionKey: target.sessionKey,
            agentID: agentID ?? target.agentID,
            leafEntryId: leafEntryId)
        _ = try await self.requestSessionMutation(request)
    }

    func setActiveSessionKey(_ sessionKey: String) async throws {
        let target = self.sessionTarget(for: sessionKey)
        let request = NatesclawChatGatewayRequests.subscribeSessionMessages(
            sessionKey: target.sessionKey,
            agentID: target.agentID)
        _ = try await self.gateway.request(request)
    }

    func resetSession(sessionKey: String) async throws {
        let target = self.sessionTarget(for: sessionKey)
        let request = NatesclawChatGatewayRequests.resetSession(
            sessionKey: target.sessionKey,
            agentID: target.agentID)
        _ = try await self.gateway.request(request)
    }

    func compactSession(sessionKey: String) async throws {
        let target = self.sessionTarget(for: sessionKey)
        let request = NatesclawChatGatewayRequests.compactSession(
            sessionKey: target.sessionKey,
            agentID: target.agentID)
        let response = try await gateway.request(request)
        try NatesclawSessionsCompactResponse.requireSuccess(from: response)
    }

    func requestHistory(sessionKey: String) async throws -> NatesclawChatHistoryPayload {
        try await self.requestHistory(sessionKey: sessionKey, agentID: nil, ifCurrentRoute: nil)
    }

    func resolveInlineWidgetResource(
        path: String,
        replacing failedResource: NatesclawChatWidgetResource?) async -> NatesclawChatWidgetResource?
    {
        let gateway = self.gateway
        let widgetGateway = self.widgetGateway
        return await NatesclawChatWidgetURLResolver.resolveResource(
            target: path,
            replacing: failedResource,
            currentSurfaceRoutes: {
                let node = await widgetGateway?.currentCanvasHostRoute()
                let operatorSurface = await gateway.currentCanvasHostRoute()
                return (node: node, operatorSurface: operatorSurface)
            },
            // Prefer the device's node route; operator rotation covers clients
            // whose node role is unavailable or intentionally disabled.
            refreshNodeSurfaceRoute: { observed in
                await widgetGateway?.refreshCanvasHostRoute(replacing: observed?.url)
            },
            refreshOperatorSurfaceRoute: { observed in
                await gateway.refreshCanvasHostRoute(replacing: observed?.url)
            })
    }

    func loadMediaArtifact(
        sessionKey: String,
        artifactId: String,
        kind: NatesclawChatMediaKind,
        playback: NatesclawChatPlaybackMode?) async throws -> NatesclawChatLoadedMedia?
    {
        guard kind.acceptsManagedArtifactID(artifactId),
              let mediaArtifactLoader,
              let route = await gateway.currentRoute(),
              let gatewayID = await gateway.currentGatewayID(ifCurrentRoute: route)
        else { return nil }
        let target = self.sessionTarget(for: sessionKey)
        let request = NatesclawChatGatewayRequests.artifactDownload(
            sessionKey: target.sessionKey,
            agentID: target.agentID,
            artifactId: artifactId)
        let data = try await gateway.request(request, ifCurrentRoute: route)
        let response = try JSONDecoder().decode(ArtifactsDownloadResult.self, from: data)
        guard await self.gateway.currentRoute() == route else { throw CancellationError() }
        let loaded = try await mediaArtifactLoader.load(
            response: response,
            kind: kind,
            playback: playback,
            expectedGatewayID: gatewayID)
        guard await self.gateway.currentRoute() == route else { throw CancellationError() }
        return loaded
    }

    func resolveInlineWidgetURL(path: String, replacing failedURL: URL?) async -> URL? {
        await self.resolveInlineWidgetResource(
            path: path,
            replacing: failedURL.map { NatesclawChatWidgetResource(url: $0) })?.url
    }

    func requestHistory(
        sessionKey: String,
        agentID: String? = nil,
        ifCurrentRoute expectedRoute: GatewayNodeSessionRoute?) async throws -> NatesclawChatHistoryPayload
    {
        let target = self.sessionTarget(for: sessionKey, overrideAgentID: agentID)
        let request = NatesclawChatGatewayRequests.history(
            sessionKey: target.sessionKey,
            agentID: target.agentID)
        let res = try await gateway.request(
            request,
            ifCurrentRoute: expectedRoute)
        return try JSONDecoder().decode(NatesclawChatHistoryPayload.self, from: res)
    }

    var supportsSlashCommandCatalog: Bool {
        true
    }

    func listCommands(sessionKey: String) async throws -> [NatesclawChatCommandChoice] {
        let request = NatesclawChatGatewayRequests.commandsList(
            sessionKey: sessionKey,
            fallbackAgentID: self.globalAgentId)
        let res = try await gateway.request(request)
        let decoded = try JSONDecoder().decode(CommandsListResult.self, from: res)
        return decoded.commands.map(NatesclawChatGatewayPayloadCodec.commandChoice)
    }

    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [NatesclawChatAttachmentPayload]) async throws -> NatesclawChatSendResponse
    {
        try await self.sendMessage(
            sessionKey: sessionKey,
            agentID: nil,
            message: message,
            thinking: thinking,
            idempotencyKey: idempotencyKey,
            attachments: attachments,
            ifCurrentRoute: nil)
    }

    func sendMessage(
        sessionKey: String,
        agentID: String?,
        expectedSessionRoutingContract: String?,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [NatesclawChatAttachmentPayload]) async throws -> NatesclawChatSendResponse
    {
        let route: GatewayNodeSessionRoute? = if let outboxGatewayID {
            await self.gateway.currentRoute(ifGatewayID: outboxGatewayID)
        } else {
            await self.gateway.currentRoute()
        }
        guard let route,
              let supportsRoutingContract = await gateway.supportsServerCapability(
                  .chatSendRoutingContract,
                  ifCurrentRoute: route)
        else { throw NatesclawChatTransportSendError.notDispatched }
        // Durable replay requires the atomic server guard and is blocked in
        // acquireOutboxRouteLease. Keep ordinary live chat compatible with
        // older gateways by retaining the captured route but omitting the
        // unsupported request field.
        let guardedContract = NatesclawChatSessionRoutingContract.expectedValue(
            expectedSessionRoutingContract,
            serverSupportsGuard: supportsRoutingContract)
        return try await self.sendMessage(
            sessionKey: sessionKey,
            agentID: agentID,
            expectedSessionRoutingContract: guardedContract,
            message: message,
            thinking: thinking,
            idempotencyKey: idempotencyKey,
            attachments: attachments,
            ifCurrentRoute: route,
            distinguishPreDispatchRouteChange: true)
    }

    func sendMessage(
        sessionKey: String,
        agentID: String? = nil,
        expectedSessionRoutingContract: String? = nil,
        message: String,
        thinking: String?,
        idempotencyKey: String,
        attachments: [NatesclawChatAttachmentPayload],
        ifCurrentRoute expectedRoute: GatewayNodeSessionRoute?,
        distinguishPreDispatchRouteChange: Bool = false) async throws -> NatesclawChatSendResponse
    {
        let target = self.sessionTarget(for: sessionKey, overrideAgentID: agentID)
        let startLogMessage =
            "chat.send start sessionKey=\(target.sessionKey) "
                + "len=\(message.count) attachments=\(attachments.count)"
        Self.logger.info(
            "\(startLogMessage, privacy: .public)")
        GatewayDiagnostics.log(startLogMessage)
        let request = NatesclawChatGatewayRequests.sendMessage(
            sessionKey: target.sessionKey,
            agentID: target.agentID,
            expectedSessionRoutingContract: expectedSessionRoutingContract,
            message: message,
            thinking: thinking,
            idempotencyKey: idempotencyKey,
            attachments: attachments)
        do {
            let res = try await gateway.request(
                request,
                ifCurrentRoute: expectedRoute,
                distinguishPreDispatchRouteChange: distinguishPreDispatchRouteChange)
            let decoded = try JSONDecoder().decode(NatesclawChatSendResponse.self, from: res)
            Self.logger.info("chat.send ok runId=\(decoded.runId, privacy: .public)")
            GatewayDiagnostics.log("chat.send ok runId=\(decoded.runId) status=\(decoded.status)")
            return decoded
        } catch is GatewayNodeSessionRequestError {
            Self.logger.info("chat.send skipped because the captured route changed before dispatch")
            GatewayDiagnostics.log("chat.send skipped before dispatch: route changed")
            throw NatesclawChatTransportSendError.notDispatched
        } catch {
            Self.logger.error("chat.send failed \(error.localizedDescription, privacy: .public)")
            GatewayDiagnostics.log("chat.send failed error=\(error.localizedDescription)")
            throw error
        }
    }

    func waitForRunCompletion(
        runId rawRunId: String,
        timeoutMs: Int) async -> NatesclawChatRunObservation
    {
        let route = await gateway.currentRoute()
        return await self.waitForRunCompletion(
            runId: rawRunId,
            timeoutMs: timeoutMs,
            ifCurrentRoute: route)
    }

    func waitForRunCompletion(
        runId rawRunId: String,
        timeoutMs: Int,
        ifCurrentRoute expectedRoute: GatewayNodeSessionRoute?) async -> NatesclawChatRunObservation
    {
        let runId = rawRunId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !runId.isEmpty, let expectedRoute else { return .unavailable }

        do {
            let request = NatesclawChatGatewayRequests.agentWait(runID: runId, timeoutMs: timeoutMs)
            GatewayDiagnostics.log("agent.wait start runId=\(runId)")
            let res = try await gateway.request(
                request,
                ifCurrentRoute: expectedRoute)
            let observation = try NatesclawChatGatewayPayloadCodec.decodeAgentWaitObservation(res)
            GatewayDiagnostics.log("agent.wait completed runId=\(runId) observation=\(observation)")
            return observation
        } catch {
            Self.logger.warning("agent.wait failed \(error.localizedDescription, privacy: .public)")
            GatewayDiagnostics.log("agent.wait failed runId=\(runId) error=\(error.localizedDescription)")
            return .unavailable
        }
    }

    func requestHealth(timeoutMs: Int) async throws -> Bool {
        let res = try await gateway.request(NatesclawChatGatewayRequests.health(timeoutMs: timeoutMs))
        return (try? JSONDecoder().decode(NatesclawGatewayHealthOK.self, from: res))?.ok ?? true
    }

    func listQuestions() async throws -> [QuestionRecord] {
        let data = try await gateway.request(NatesclawChatGatewayRequests.questionList())
        return try JSONDecoder().decode(QuestionListResult.self, from: data).questions
    }

    func listTasks(sessionKey: String, agentID: String?) async throws -> [TaskSummary] {
        let data = try await gateway.request(NatesclawChatGatewayRequests.tasksList(
            sessionKey: sessionKey,
            agentID: agentID))
        return try JSONDecoder().decode(TasksListResult.self, from: data).tasks
    }

    func getQuestion(id: String) async throws -> QuestionRecord {
        let data = try await gateway.request(NatesclawChatGatewayRequests.questionGet(id: id))
        return try JSONDecoder().decode(QuestionGetResult.self, from: data).question
    }

    func resolveQuestion(id: String, answers: [String: [String]]) async throws {
        _ = try await self.gateway.request(NatesclawChatGatewayRequests.resolveQuestion(id: id, answers: answers))
    }

    func cancelQuestion(id: String) async throws {
        _ = try await self.gateway.request(NatesclawChatGatewayRequests.cancelQuestion(id: id))
    }

    func events() -> AsyncStream<NatesclawChatTransportEvent> {
        AsyncStream { continuation in
            let task = Task {
                let stream = await self.gateway.subscribeServerEvents()
                for await evt in stream {
                    if Task.isCancelled {
                        return
                    }
                    if let mapped = NatesclawChatGatewayPayloadCodec.event(from: evt) {
                        continuation.yield(mapped)
                    }
                }
            }

            continuation.onTermination = { @Sendable _ in
                task.cancel()
            }
        }
    }
}
