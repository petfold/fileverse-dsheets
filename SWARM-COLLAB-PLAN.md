# dSheets on swarm-collaborative-docs: plan (proposal, 2026-10-09)

The shared plan, its reasons and its open decisions live in swarmtyp: `../swarmtyp/docs/plan.md`, section "Alongside swarmtyp". The encryption design is draft 17 in `../swarmtyp/docs/upstream/swarm-collaborative-docs.md`. This file holds what is specific to dSheets.

**Where dSheets stands.** Sheets can live on Swarm already (this fork's `src/swarm/swarm-document-storage.ts` and the demo's `swarm-sheet`/`swarm-store`: AES-256-GCM snapshots, a feed per sheet as the latest pointer, feed history as version history). Upstream, fileverse/fileverse-dsheets#429 was rebased on 2026-10-09 and narrowed to the smart-contract ABI reference, because `main`'s host-seeds model already took storage I/O out of the sync engine; #430 (comment markers stop refreshing when a cell object is frozen) is open. Live editing still goes through Fileverse's Socket.IO server: `src/sync-local` (`SyncManager`, `SocketClient` with UCAN auth, `collabStateMachine`), described in `docs/RTC_FLOW.md`, with every update ECIES-encrypted to the room's `roomKey`.

**What changes in the fork.**
- A `SwarmSyncManager` behind `useSyncManager`, chosen by a collaboration prop: it opens a `SwarmDoc` session (SwarmRtc transport), and the workbook binding (`editor-workbook-sync`, `use-editor-data` with its remote-apply guard) runs on `swarmDoc.doc` unchanged.
- Presence: `use-collab-awareness.tsx` turns Awareness states (`userId`, `sheetId`, `cell { r, c }`, `color`, `username`) into Fortune `addPresences`. Feed a local Awareness from the library's presence events. A cell is not a text range, so this too needs the free-form presence payload proposed for swarm-collaborative-docs.
- Comments and other features that rely on Fileverse's server need a look in F0: what stays in the Yjs document works unchanged; anything stored server-side needs a Swarm home or is dropped from the fork.
- Links and encryption as for dDoc: the library's invite in the fragment, and the library's encryption option (draft 17) in place of ECIES to `roomKey`.

**Steps here.** F0: a spike in the demo, two browsers editing one sheet through the Swarm Desktop node, presence through the Awareness bridge, snapshot sizes measured (a large sheet makes a large snapshot, and through Freedom each 4 KB costs a provider call). F1: `SwarmSyncManager` behind the existing interface. F2 encryption, F3 Freedom, as in the shared plan.

**Licence and naming.** AGPL-3.0, as upstream; every deployment links its source; not presented as a Fileverse product.
