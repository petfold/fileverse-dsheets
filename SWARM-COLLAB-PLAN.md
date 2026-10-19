# Swarm in dSheets: plan (revised 2026-10-19)

The shared plan, its reasons and its open decisions live in swarmtyp: `../swarmtyp/docs/plan.md`, section "Alongside swarmtyp", and decision D-29 in `../swarmtyp/docs/decisions.md`. The encryption design is draft 17 in `../swarmtyp/docs/upstream/swarm-collaborative-docs.md`. This file holds what is specific to dSheets.

In short: offer Swarm to Fileverse upstream in two stages, storage first, then live editing, each built and offered finished; fork only if Fileverse declines. The 2026-10-09 version of this file proposed a fork from the start.

**Where dSheets stands.** Sheets can live on Swarm already (this branch's `src/swarm/swarm-document-storage.ts` and the demo's `swarm-sheet`/`swarm-store`: AES-256-GCM snapshots, a feed per sheet as the latest pointer, feed history as version history). Upstream, fileverse/fileverse-dsheets#429 was narrowed to the smart-contract ABI reference (`abiRef`, `resolveAbi`), merged 2026-10-09 and released in `@fileverse-dev/dsheet` 4.1.19. Its other half typed the sync engine's `commitToStorage` and `fetchFromStorage` hooks, which upstream had removed in #425 (2026-09-03); the demo here only passes them as `undefined`. #430 (comment markers stop refreshing when a cell object is frozen) is open with no response. The Swarm modules' own pull request has not been opened. This branch sits on 4.1.0; upstream is at 4.1.21. Live editing still goes through Fileverse's Socket.IO server: `src/sync-local` (`SyncManager`, `socketClient` with UCAN auth, `collabStateMachine`), described in `docs/RTC_FLOW.md`, with every update ECIES-encrypted to the room's `roomKey`.

**Stage 1 here: the Swarm modules as a pull request.**
- Move onto 4.1.21. Drop the branch's first commit (`8824069`): its ABI half is upstream as `6e800b8`, and its sync-engine half types hooks upstream no longer has. `src/swarm/` imports nothing from outside itself, so it carries over as it is; remove the two `undefined` hooks from the demo's collaboration config.
- Rebuild the Swarm demo on upstream's current demo and port the Swarm parts (`storage/swarm-sheet.ts`, `storage/swarm-store.ts` and the Swarm parts of `App.tsx`). The Freedom repro pages (`demo/storage-repro.html`, `demo/fragment-repro.html`), the debug commit and the deployment notes (`SWARM-DEMO-LINK.md`) stay out of the pull request, as does this plan.
- This module is nearly identical to dDoc's `package/utils/swarm-*`. Whether they become one shared module is our call, made before the pull request opens.

**Stage 2 here: live editing over Swarm.**
- A `SwarmSyncManager` behind `useSyncManager`, chosen by a collaboration prop: it opens a `SwarmDoc` session (SwarmRtc transport), and the workbook binding (`editor-workbook-sync`, `use-editor-data` with its remote-apply guard) runs on `swarmDoc.doc` unchanged.
- Presence: `use-collab-awareness.tsx` turns Awareness states (`userId`, `sheetId`, `cell { r, c }`, `color`, `username`) into Fortune `addPresences`. Feed a local Awareness from the library's presence events. A cell is not a text range, so this too needs the free-form presence payload proposed for swarm-collaborative-docs.
- Comments and other features that rely on Fileverse's server need a look in F0: what stays in the Yjs document works unchanged; anything stored server-side needs a Swarm home, or is left out.
- Links and encryption as for dDoc: the library's invite in the fragment, and the library's encryption option (draft 17) in place of ECIES to `roomKey`.
- Steps: F0, a spike in the demo, two browsers editing one sheet through the Swarm Desktop node, presence through the Awareness bridge, snapshot sizes measured (a large sheet makes a large snapshot, and through Freedom each 4 KB costs a provider call). F1, `SwarmSyncManager` behind the existing interface. F2 encryption, F3 Freedom, F4 offer it to Fileverse, as in the shared plan.

**Stage 3, only if Fileverse declines:** this branch becomes the fork, with the sync layer as its own difference, plus the storage modules if stage 1 was declined too.

**Licence and naming.** Code offered upstream goes in under Fileverse's AGPL-3.0. If we fork: AGPL-3.0, every deployment links its source, and it is not presented as a Fileverse product.
