# dSheets × Swarm — demo links

**Latest demo: `fd8bf78a…`** — the key-memory build, 2026-08-18, from `feat/swarm-storage` (PR 2, stacked on PR 1
`feat/storage-agnostic-collab-services`): pure-Swarm serverless persistence
— sheet snapshots AES-256-GCM encrypted on Swarm, a feed per sheet as the
mutable "latest" pointer, feed history as version history. Carries the three
fixes from the first Freedom field test (ddoc boot screen ported into
`index.html`; restore deferred under an unconsented provider instead of
erroring with "Origin not authorized"; restore screen shown instead of the
editor, not beside it) plus the findings from the second and third:
opening the bare app URL reopens the browser's last sheet instead of
minting a fresh blank one, and saves are now pushed to the network before
they count (`swarm-deferred-upload: false` on snapshots AND feed updates) —
the sample sheet had opened blank in Freedom because its chunks, uploaded
deferred, had never left the writer's node, which is also the only node
Brave was reading. And from the fourth test: a sheet whose keys came in the
link now treats "feed not found" as a retrieval failure — retried with the
restore screen and an explanation — instead of silently rendering a blank
grid. Freedom's blank opens are now fully explained, twice over. Cold: its
embedded ant node answers "Single Owner Chunk not found" in its first
seconds and serves the same chunks once warm — the restore budget now spans
minutes (8 attempts, widening to 30s). Hot AND cold: Freedom sometimes
delivers the page WITHOUT the URL fragment the address bar displays, so the
sheet's keys never arrive and the app used to degrade it silently into a
provider-owned empty sheet. Now a link's keys are remembered per sheet id
(a fragment-less revisit reconstructs them and rewrites the URL), the Grant
prompt is suppressed for link-keyed sheets (reads need no permission — it
appears only where publishing is genuinely on offer), saves are held until
the restore has merged so a reader can never bury a feed's content, and a
link-keyed sheet never seeds a default empty Sheet1. The sample feed itself
was inspected end to end: all 6 versions intact — versioning works. Two
Freedom-side issues to file: fragment delivery must be reliable, and a
fresh node's "not found" is indistinguishable from truly absent content.

Verification state: **verified end to end in both browsers, 2026-08-18.**
Brave renders the sample over the node API. Freedom was driven headlessly
over the DevTools protocol against the real provider path (inside the
webview, `window.swarm` injected, read-only, no grant prompt): the SOC
reads failed while the embedded ant node warmed up, the retry budget
outwaited it, and at t+40s the restore merged and the sample rendered.
The fragment-drop hypothesis was falsified by the minimal repro (green
everywhere); the one Freedom-side issue that remains real is ant answering
"Single Owner Chunk not found" during warm-up for content it serves fine
once warm — indistinguishable from truly absent content, so clients must
guess how long to disbelieve it. Separately, a non-fatal dsheets package
error surfaced in both runs and deserves its own look:
`ySheetArrayToPlain after ydoc observe failed TypeError: Cannot assign to
read only property 'ps'`.** All 73 Swarm
unit tests pass live (encrypted save/load/version round-trips, wrong-key
rejection, stamps endpoints); a headless end-to-end drove the demo's exact
persistence path (two saves onto a feed, a fresh reader restoring from the
share-link keys, a CRDT merge preserving an unsaved local edit). Field notes so far: Freedom on
`95f42ca5…` found the white first load, the "Origin not authorized" restore
failure and the mispositioned restore panel (all fixed in `382e9f55…`, defer
confirmed working in Freedom); Freedom also showed its own "Content not
ready yet" page when the *browser's* fetch of the app timed out at a cold
node — that happens before any app code runs, so only Freedom's own Try
Again can help there (same cold-node class as solardev-xyz/ant#78).

## Open the demo

Served entirely from Swarm — app code and, once you edit, sheet snapshots
and version history all come off the network:

```
http://localhost:1633/bzz/fd8bf78a9416a38fbd1681e8075bdf214368214d9087b190820329412b0fa6b0/
```

For a Swarm-aware browser (Freedom), the same reference as a `bzz://` URL:

```
bzz://fd8bf78a9416a38fbd1681e8075bdf214368214d9087b190820329412b0fa6b0/
```

Previous builds — still deployed, still read the same sheet feeds:

```
f961d2d3cfa5e619b85e07ad20a9cf150a0f807183b6965f2cbe779026083cc0   patient-restore build; keys still lived only in the URL fragment
615fa2c9e8ca0d2de8429c1e54a7a2ae5b15fc487f88372432bc3bc0d3e2cfa7   expect-content build; retry budget (~45s) shorter than a cold node's warm-up
03c532ddf0450c8ae08d78d42f445fff8d56a24450babfd03bd6f25310a5a9d2   debug build (console logging + __swarmDebug), same short budget
a228d34dfbb6533e961a50d4e3830dbd80d9e400fed7dfabb3605b4746ddef4d   synchronous-saves build; link-opened sheet rendered blank when a cold node missed its feed
64c0d7cb256b4ef062e690b5f217847625a3da2c8fa1723ca31f7cfd6df99237   last-sheet-reopen build; saves stayed on the local node (deferred)
382e9f553956d67d74b39c02f50fa1123393813615c1d7f8dad0171b46b24bda   boot-retry build; bare URL minted a new blank sheet
95f42ca58ec6bba4641c9248b7fccc7f84a21f34bd1e0d45db73a70bcceb8ad3   first upload, no boot retry / provider defer
```

The reference is network-global: anyone running a Bee node opens that same
path on *their* node and gets the app, because the API URL the app talks to
is localhost-relative to each viewer.

Local dev server alternative (from `demo/`, with `VITE_BEE_API_URL` in
`demo/.env`): `npm run dev` → http://localhost:5000/

## Sample sheet (start here)

A written-up sheet — explaining what is stored where and what happens when
you edit it — AES-256-GCM encrypted on Swarm, published 2026-08-18. The
dsheets counterpart of ddoc's `sample-mswwageg`:

```
http://localhost:1633/bzz/fd8bf78a9416a38fbd1681e8075bdf214368214d9087b190820329412b0fa6b0/?sheet=dsheet-sample-swarm#skey=0xf31588db3bdea51731755f73f06d5c9f20538d2e86a164c60fb4bb32fc2ca15a:%2B5P%2BQ%2Bti%2BvR%2B1SFY5j6jxt9zcgQfLar4Faaj4fPSA7M%3D
```

For a Swarm-aware browser (Freedom), the same sheet as a `bzz://` URL:

```
bzz://fd8bf78a9416a38fbd1681e8075bdf214368214d9087b190820329412b0fa6b0/?sheet=dsheet-sample-swarm#skey=0xf31588db3bdea51731755f73f06d5c9f20538d2e86a164c60fb4bb32fc2ca15a:%2B5P%2BQ%2Bti%2BvR%2B1SFY5j6jxt9zcgQfLar4Faaj4fPSA7M%3D
```

**The link carries write access** over the node API — the fragment holds the
feed signing key and the decryption key — so anyone you send it to can edit
the sample; their edits become version 1, 2, … while version 0 stays exactly
as published. In a provider browser it opens read-only (the browser signs
only as itself).

| Part | Reference |
| --- | --- |
| Sheet snapshot (v0) | `c8ccc39d3500b1a2523080e5d61da15a8d8a350bb6bbb8e2340bf276949438a6` |
| Sheet id / feed topic | `dsheet-sample-swarm` → `dsheet/v1/dsheet-sample-swarm` |
| Feed owner | `0xf31588db…`'s address (key in the fragment) |

Authored headlessly with the editor's own Y.Doc schema (`plainSheetToYMap`
field set, fortune-sheet celldata), round-tripped through the package's
`ySheetArrayToPlain` before publishing, then read back decrypted from the
feed. **Renders correctly in Brave** (2026-08-18). The first Freedom open
was blank — the deferred-upload propagation bug above, since fixed and the
chunks re-pushed — so Freedom is the remaining render check.

## URL shapes to try

A complete sheet URL looks like this (same anatomy as ddoc's sample link —
`?doc=` there, `?sheet=` here):

```
http://localhost:1633/bzz/fd8bf78a…a6b0/?sheet=<sheet-id>#skey=<owner-key>:<doc-key>
```

You never type those parts: the app generates the sheet id and both keys on
first open and writes them into the address bar itself (ddoc's `resolveKeys`
mechanism, ported unchanged). The sample link above is the
populated form; a *plain* app link mints (or reopens) a sheet and fills the
rest in itself. The address bar is
therefore always the complete link to the sheet you are looking at; the
Share button copies it. In a provider browser the fragment is `#dkey=<doc-key>`
instead: the feed belongs to the browser's own identity, so no owner key
travels in the link.

| URL | What it exercises |
| --- | --- |
| `…/bzz/fd8bf78a…/` | Last sheet reopens (or a fresh one on first visit) |
| `…/bzz/fd8bf78a…/` in a private window | Fresh sheet: new id in `?sheet=`, new keys in `#skey=` |
| Same URL again (same browser) | Restore: boot overlay, then the sheet back from Swarm merged with IndexedDB |
| Same URL in a private window | Shared read: restores from the feed with no local state at all |
| Same URL, Bee node stopped | Diagnostics bar (node down), edits held; restart the node and they flush |
| `#skey=` fragment stripped | The sheet is unreadable — proves snapshots are ciphertext |

`?sheet=<id>` names the sheet; `#skey=<owner-key>:<doc-key>` carries the
feed signing key and the AES decryption key. **Treat the fragment as a
secret** — over the node API it grants read *and* write (single-writer
still means one feed key; whoever holds it is "the writer"). In a provider
browser a link from elsewhere is read-only: the browser signs only as
itself and cannot advance someone else's feed.

## Freedom fragment-delivery repro

Minimal isolation of the suspected Freedom bug (a page receiving
`location.hash` empty while the address bar shows the fragment): one
self-contained page (`demo/fragment-repro.html`) that reports the URL its
JavaScript actually received and logs every load across the error-page
bounce. Open it as:

```
bzz://bdcb78f6a306e7633e98708b6d6b6b8edd139b57cdfa96f205800aa596a8be81/?q=1#test=hello
```

Green "FRAGMENT RECEIVED" = correct. Red "NO FRAGMENT RECEIVED" with the
fragment still in the address bar — typically after the cold-start
"Content not ready yet" page's Try Again — is the bug, isolated from
dsheets, React and Swarm reads entirely (query params survive; the
fragment is never sent to any server). This is the repro to attach to the
Freedom/ant issue.

## What this postage batch has paid for (dsheets' share)

Batch `c931c8a5ee8def22…` is shared with the ddoc demo (its ledger lives in
fileverse-ddoc's SWARM-DEMO-LINK.md). dsheets additions:

| Content | Reference |
| --- | --- |
| Demo site, key-memory build (2026-08-18) | `fd8bf78a9416a38fbd1681e8075bdf214368214d9087b190820329412b0fa6b0` |
| Demo site, patient-restore build (2026-08-18) | `f961d2d3cfa5e619b85e07ad20a9cf150a0f807183b6965f2cbe779026083cc0` — superseded: a fragment dropped by the browser silently degraded a link-opened sheet into an empty provider-owned one |
| Demo site, expect-content + debug builds (2026-08-18) | `615fa2c9e8ca0d2de8429c1e54a7a2ae5b15fc487f88372432bc3bc0d3e2cfa7`, `03c532ddf0450c8ae08d78d42f445fff8d56a24450babfd03bd6f25310a5a9d2` — superseded: retry budget ended before a cold ant node could serve chunks it provably had |
| Demo site, synchronous-saves build (2026-08-18) | `a228d34dfbb6533e961a50d4e3830dbd80d9e400fed7dfabb3605b4746ddef4d` — superseded: "feed not found" on a link-opened sheet rendered a silent blank grid instead of retrying and explaining |
| Demo site, last-sheet-reopen build (2026-08-18) | `64c0d7cb256b4ef062e690b5f217847625a3da2c8fa1723ca31f7cfd6df99237` — superseded: saves (snapshots + feed updates) uploaded deferred, so a viewer on another node — a Swarm-aware browser included — found nothing |
| Demo site, boot-retry build (2026-08-18) | `382e9f553956d67d74b39c02f50fa1123393813615c1d7f8dad0171b46b24bda` — superseded: opening the bare app URL minted a fresh blank sheet, read as data loss |
| Demo site, first upload (2026-08-18) | `95f42ca58ec6bba4641c9248b7fccc7f84a21f34bd1e0d45db73a70bcceb8ad3` — superseded: white screen on a cold Freedom load (no boot retry), provider restore errored instead of deferring, restore panel rendered beside a live editor |
| Fragment repro page (2026-08-18) | `bdcb78f6a306e7633e98708b6d6b6b8edd139b57cdfa96f205800aa596a8be81` |
| Sample sheet v0 (2026-08-18) | `c8ccc39d3500b1a2523080e5d61da15a8d8a350bb6bbb8e2340bf276949438a6` + its feed chunk |
| Test uploads from the live suites (2026-08-18) | random payloads + e2e sheet feeds, not referenced anywhere |

Site upload is ~15 MB (single app chunk — the vendor/app chunk split ddoc
has was not ported yet, so every rebuild re-uploads nearly everything;
content addressing still dedupes unchanged files). Uploaded synchronously
(`swarm-deferred-upload: false`) and confirmed with `/stewardship`
(`isRetrievable: true`); every eager asset then fetched back byte-exact,
including the 5.7 MB main chunk and the 2.7 MB lazy template chunk.
Utilization was 75% with ~18.7 days TTL after these uploads.

## Code

- Branch: https://github.com/petfold/fileverse-dsheets/tree/feat/swarm-storage
- PR 1 branch: https://github.com/petfold/fileverse-dsheets/tree/feat/storage-agnostic-collab-services
- Diff vs upstream (what the PR will show):
  https://github.com/fileverse/fileverse-dsheets/compare/main...petfold:fileverse-dsheets:feat/swarm-storage
- The ddoc counterpart this mirrors:
  https://github.com/petfold/fileverse-ddoc/tree/feat/swarm-storage

## Redeploying

From `demo/`, with a Bee node that has a usable postage batch:

```bash
./deploy-swarm.sh          # prints the new /bzz/<reference>/ URL
```

(Ported from the ddoc demo; same synchronous upload + stewardship check.)
