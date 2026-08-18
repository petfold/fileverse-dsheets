# dSheets × Swarm — demo links

**Latest demo: `95f42ca5…`** — built 2026-08-18 from commit `43063cd`, head
of `feat/swarm-storage` (PR 2, stacked on PR 1
`feat/storage-agnostic-collab-services`): the first dsheets build with
pure-Swarm, serverless persistence — sheet snapshots AES-256-GCM encrypted
on Swarm, a feed per sheet as the mutable "latest" pointer, feed history as
version history.

Verification state: **package path verified against a live Bee 2.8.1 node,
UI not yet browser-verified.** All 73 Swarm unit tests pass live (encrypted
save/load/version round-trips, wrong-key rejection, stamps endpoints), and a
headless end-to-end drove the demo's exact persistence path — two saves onto
a feed, a fresh reader restoring from the share-link keys, a CRDT merge
preserving an unsaved local edit, version 0 predating edit 2. The React
layer (boot overlay, diagnostics bar, share flow) still needs a first pass
in a real browser; whatever that finds becomes the next build here.

## Open the demo

Served entirely from Swarm — app code and, once you edit, sheet snapshots
and version history all come off the network:

```
http://localhost:1633/bzz/95f42ca58ec6bba4641c9248b7fccc7f84a21f34bd1e0d45db73a70bcceb8ad3/
```

For a Swarm-aware browser (Freedom), the same reference as a `bzz://` URL:

```
bzz://95f42ca58ec6bba4641c9248b7fccc7f84a21f34bd1e0d45db73a70bcceb8ad3/
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
| `…/bzz/95f42ca5…/` | Fresh sheet: new id in `?sheet=`, new keys in `#skey=` |
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
| Demo site, first upload (2026-08-18) | `95f42ca58ec6bba4641c9248b7fccc7f84a21f34bd1e0d45db73a70bcceb8ad3` |
| Test uploads from the live suites (2026-08-18) | random payloads + e2e sheet feeds, not referenced anywhere |

Site upload is ~15 MB (single app chunk — the vendor/app chunk split ddoc
has was not ported yet, so every rebuild re-uploads nearly everything;
content addressing still dedupes unchanged files). Uploaded synchronously
(`swarm-deferred-upload: false`) and confirmed with `/stewardship`
(`isRetrievable: true`); every eager asset then fetched back byte-exact,
including the 5.7 MB main chunk and the 2.7 MB lazy template chunk.
Utilization was 75% with ~18.7 days TTL after this upload.

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
