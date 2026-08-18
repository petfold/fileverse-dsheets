# dSheets × Swarm — demo links

**Latest demo: `64c0d7cb…`** — the last-sheet-reopen build, 2026-08-18, from `feat/swarm-storage` (PR 2, stacked on PR 1
`feat/storage-agnostic-collab-services`): pure-Swarm serverless persistence
— sheet snapshots AES-256-GCM encrypted on Swarm, a feed per sheet as the
mutable "latest" pointer, feed history as version history. Carries the three
fixes from the first Freedom field test (ddoc boot screen ported into
`index.html`; restore deferred under an unconsented provider instead of
erroring with "Origin not authorized"; restore screen shown instead of the
editor, not beside it) plus the finding from the second: opening the bare
app URL now reopens the browser's last sheet instead of minting a fresh
blank one — what looked like data loss in Brave was a new sheet id, the
old sheet intact under its own `?sheet=` URL.

Verification state: **package path verified against a live Bee 2.8.1 node;
UI verified in Brave; Freedom verified deferring correctly on `382e9f55…`
(editor open, grant offered non-blocking); grant-and-flush and this build's
last-sheet reopen still to confirm in the field.** All 73 Swarm
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
http://localhost:1633/bzz/64c0d7cb256b4ef062e690b5f217847625a3da2c8fa1723ca31f7cfd6df99237/
```

For a Swarm-aware browser (Freedom), the same reference as a `bzz://` URL:

```
bzz://64c0d7cb256b4ef062e690b5f217847625a3da2c8fa1723ca31f7cfd6df99237/
```

Previous builds — still deployed, still read the same sheet feeds:

```
382e9f553956d67d74b39c02f50fa1123393813615c1d7f8dad0171b46b24bda   boot-retry build; bare URL minted a new blank sheet
95f42ca58ec6bba4641c9248b7fccc7f84a21f34bd1e0d45db73a70bcceb8ad3   first upload, no boot retry / provider defer
```

The reference is network-global: anyone running a Bee node opens that same
path on *their* node and gets the app, because the API URL the app talks to
is localhost-relative to each viewer.

Local dev server alternative (from `demo/`, with `VITE_BEE_API_URL` in
`demo/.env`): `npm run dev` → http://localhost:5000/

## URL shapes to try

The app writes both parts of a sheet's identity into the address bar as you
use it, so "the URL you are looking at" is always the link to that sheet:

| URL | What it exercises |
| --- | --- |
| `…/bzz/64c0d7cb…/` | Last sheet reopens (or a fresh one on first visit) |
| `…/bzz/64c0d7cb…/` in a private window | Fresh sheet: new id in `?sheet=`, new keys in `#skey=` |
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

No sample sheet is published yet — a valid sheet snapshot needs the real
editor to author it, so the first browser-verified session should save one
and record its link here, the way the ddoc file carries `sample-mswwageg`.

## What this postage batch has paid for (dsheets' share)

Batch `c931c8a5ee8def22…` is shared with the ddoc demo (its ledger lives in
fileverse-ddoc's SWARM-DEMO-LINK.md). dsheets additions:

| Content | Reference |
| --- | --- |
| Demo site, last-sheet-reopen build (2026-08-18) | `64c0d7cb256b4ef062e690b5f217847625a3da2c8fa1723ca31f7cfd6df99237` |
| Demo site, boot-retry build (2026-08-18) | `382e9f553956d67d74b39c02f50fa1123393813615c1d7f8dad0171b46b24bda` — superseded: opening the bare app URL minted a fresh blank sheet, read as data loss |
| Demo site, first upload (2026-08-18) | `95f42ca58ec6bba4641c9248b7fccc7f84a21f34bd1e0d45db73a70bcceb8ad3` — superseded: white screen on a cold Freedom load (no boot retry), provider restore errored instead of deferring, restore panel rendered beside a live editor |
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
