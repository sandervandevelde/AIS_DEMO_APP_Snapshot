import type { SavedSnapshotEntry } from "./SavedSnapshotEntry.js";
import type { SavedSnapshotChunk } from "./SavedSnapshotChunk.js";
import type { AppProposalEntry } from "./AppProposalEntry.js";

export type AppSchema = {
    SavedSnapshotEntry: SavedSnapshotEntry;
    SavedSnapshotChunk: SavedSnapshotChunk;
    AppProposalEntry: AppProposalEntry;
};
