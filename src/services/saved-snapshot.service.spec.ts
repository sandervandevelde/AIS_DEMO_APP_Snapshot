import { describe, expect, it, vi } from "vitest";

const {
    mockChunkDelete,
    mockEntryDelete,
    mockChunkExecute,
    mockEntrySelectExecute,
    mockAllChunkExecute,
    mockGetRayfinClient,
} = vi.hoisted(() => {
    const mockChunkDelete = vi.fn();
    const mockEntryDelete = vi.fn();
    const mockChunkExecute = vi.fn();
    const mockEntrySelectExecute = vi.fn();
    const mockAllChunkExecute = vi.fn();
    const mockGetRayfinClient = vi.fn(() => ({
        data: {
            SavedSnapshotChunk: {
                delete: mockChunkDelete,
                select: (fields: string[]) => ({
                    where: () => ({
                        execute: fields.length === 1
                            ? mockChunkExecute
                            : mockAllChunkExecute,
                    }),
                }),
            },
            SavedSnapshotEntry: {
                delete: mockEntryDelete,
                select: () => ({
                    where: () => ({ execute: mockEntrySelectExecute }),
                }),
            },
        },
    }));

    return {
        mockChunkDelete,
        mockEntryDelete,
        mockChunkExecute,
        mockEntrySelectExecute,
        mockAllChunkExecute,
        mockGetRayfinClient,
    };
});

vi.mock("@/lib/rayfin-client", () => ({
    getRayfinClient: mockGetRayfinClient,
}));

import {
    cleanBase64,
    deleteSavedSnapshot,
    reassembleSnapshotChunks,
    splitBase64IntoChunks,
} from "@/services/saved-snapshot.service";

describe("saved snapshot payloads", () => {
    it("preserves the normalized bytes from a data URL", () => {
        const payload = "aGVsbG8=";

        expect(cleanBase64(`data:image/png;base64,${payload}`)).toBe(payload);
    });

    it("reassembles ordered chunks without changing their payload", () => {
        const payload = "aGVsbG8gd29ybGQ=";
        const chunks = splitBase64IntoChunks(payload);

        expect(reassembleSnapshotChunks(
            chunks
                .map((chunkBase64, chunkIndex) => ({ chunkIndex, chunkBase64 }))
                .reverse(),
            11,
        )).toBe(payload);
    });

    it("rejects missing chunks and byte-length mismatches", () => {
        expect(() => reassembleSnapshotChunks([
            { chunkIndex: 1, chunkBase64: "bG8=" },
        ], 2)).toThrow("incomplete or out of order");

        expect(() => reassembleSnapshotChunks([
            { chunkIndex: 0, chunkBase64: "aGVsbG8=" },
        ], 4)).toThrow("length mismatch");
    });

    it("deletes chunks before the saved snapshot entry for the current user", async () => {
        const calls: string[] = [];
        mockChunkExecute.mockResolvedValue([
            { id: "chunk-1" },
            { id: "chunk-2" },
        ]);
        mockEntrySelectExecute.mockResolvedValue([{ id: "snapshot-2" }]);
        mockAllChunkExecute.mockResolvedValue([
            { id: "orphan-1", savedSnapshotEntry_id: "deleted-snapshot" },
            { id: "valid-1", savedSnapshotEntry_id: "snapshot-2" },
        ]);
        mockChunkDelete.mockImplementation(async () => calls.push("chunks"));
        mockEntryDelete.mockImplementation(async () => calls.push("entry"));

        await deleteSavedSnapshot("snapshot-1", "user-1");

        expect(mockChunkDelete).toHaveBeenNthCalledWith(1, { id: "chunk-1" });
        expect(mockChunkDelete).toHaveBeenNthCalledWith(2, { id: "chunk-2" });
        expect(mockChunkDelete).toHaveBeenNthCalledWith(3, { id: "orphan-1" });
        expect(mockChunkDelete).not.toHaveBeenCalledWith({ id: "valid-1" });
        expect(mockEntryDelete).toHaveBeenCalledWith({ id: "snapshot-1" });
        expect(calls).toHaveLength(4);
        expect(calls).toEqual(["chunks", "chunks", "entry", "chunks"]);
    });

    it("identifies a length mismatch without preventing deletion", () => {
        expect(() => reassembleSnapshotChunks([
            { chunkIndex: 0, chunkBase64: "aGVsbG8=" },
        ], 250183)).toThrow("expected 250183 bytes, received 5");
    });
});
