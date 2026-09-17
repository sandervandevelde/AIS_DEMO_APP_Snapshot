import { getRayfinClient } from "@/lib/rayfin-client";

const BASE64_CHUNK_SIZE = 3000;
const MAX_PARALLEL_SAVED_CHUNK_QUERIES = 2;

async function mapWithConcurrency<T, TResult>(
    items: T[],
    mapper: (item: T) => Promise<TResult>,
    concurrency: number,
): Promise<TResult[]> {
    const results: TResult[] = [];
    let nextIndex = 0;

    async function worker(): Promise<void> {
        while (nextIndex < items.length) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            results[currentIndex] = await mapper(items[currentIndex]);
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
    return results;
}

export interface SaveSnapshotInput {
    cameraId: number;
    receivedAtUtc: string;
    sourceTopic: string;
    controlTopic: string;
    universalNamespace: string;
    contentType: string;
    imagePayloadLength: number;
    peakToPeakDisplacementThreshold: number | null;
    peakToPeakDisplacement: number | null;
    imagePayloadBase64: string;
    note: string;
    addedByName: string;
    addedByEmail?: string;
    userId: string;
}

export interface SavedSnapshotRecord {
    id: string;
    cameraId: number;
    receivedAtUtc: string;
    sourceTopic: string;
    controlTopic: string;
    universalNamespace: string;
    contentType: string;
    imagePayloadLength: number;
    peakToPeakDisplacementThreshold: number | null;
    peakToPeakDisplacement: number | null;
    imagePayloadBase64: string;
    payloadError?: string;
    note: string;
    addedByName: string;
    addedByEmail?: string;
    addedAt: string;
}

function extractPayload(base64: string): string {
    const trimmed = base64.trim();
    if (trimmed.startsWith("data:")) {
        return trimmed.split(",", 2)[1] ?? "";
    }
    return trimmed;
}

export function cleanBase64(base64: string): string {
    return extractPayload(base64).replace(/\s/g, "");
}

export function splitBase64IntoChunks(base64Payload: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < base64Payload.length; i += BASE64_CHUNK_SIZE) {
        chunks.push(base64Payload.slice(i, i + BASE64_CHUNK_SIZE));
    }
    return chunks;
}

function decodedByteLength(base64Payload: string): number {
    const binary = atob(base64Payload);
    return binary.length;
}

function expectedSavedChunkCount(imagePayloadLength: number): number {
    const base64Length = Math.ceil(imagePayloadLength / 3) * 4;
    return Math.ceil(base64Length / BASE64_CHUNK_SIZE);
}

export interface SavedSnapshotChunkRecord {
    chunkIndex: number;
    chunkBase64: string;
}

export function reassembleSnapshotChunks(
    chunks: SavedSnapshotChunkRecord[],
    expectedImagePayloadLength: number,
): string {
    const orderedChunks = [...chunks].sort((first, second) => first.chunkIndex - second.chunkIndex);

    orderedChunks.forEach((chunk, expectedIndex) => {
        if (chunk.chunkIndex !== expectedIndex) {
            throw new Error("Saved snapshot chunks are incomplete or out of order.");
        }
    });

    const payload = orderedChunks.map((chunk) => cleanBase64(chunk.chunkBase64)).join("");
    if (!payload) {
        throw new Error("Saved snapshot payload is empty.");
    }

    let actualLength: number;
    try {
        actualLength = decodedByteLength(payload);
    } catch {
        throw new Error("Saved snapshot payload is not valid Base64.");
    }

    if (actualLength !== expectedImagePayloadLength) {
        throw new Error(
            `Saved snapshot payload length mismatch: expected ${expectedImagePayloadLength} bytes, received ${actualLength}.`,
        );
    }

    return payload;
}

export async function saveSnapshot(input: SaveSnapshotInput): Promise<void> {
    const client = getRayfinClient();
    const payload = cleanBase64(input.imagePayloadBase64);
    const chunks = splitBase64IntoChunks(payload);

    let actualImagePayloadLength: number;
    try {
        actualImagePayloadLength = decodedByteLength(payload);
    } catch {
        throw new Error("Cannot save snapshot because its payload is not valid Base64.");
    }

    if (actualImagePayloadLength !== input.imagePayloadLength) {
        throw new Error(
            `Cannot save snapshot because its payload length does not match: expected ${input.imagePayloadLength} bytes, received ${actualImagePayloadLength}.`,
        );
    }

    const createdEntry = await client.data.SavedSnapshotEntry.create({
        cameraId: input.cameraId,
        receivedAtUtc: new Date(input.receivedAtUtc),
        sourceTopic: input.sourceTopic || null,
        controlTopic: input.controlTopic || null,
        universalNamespace: input.universalNamespace || null,
        contentType: input.contentType,
        imagePayloadLength: input.imagePayloadLength,
        peakToPeakDisplacementThreshold: input.peakToPeakDisplacementThreshold,
        peakToPeakDisplacement: input.peakToPeakDisplacement,
        note: input.note || null,
        addedByName: input.addedByName,
        addedByEmail: input.addedByEmail || null,
        addedAt: new Date(),
        user_id: input.userId,
    });

    await Promise.all(
        chunks.map((chunkBase64, chunkIndex) => {
            return client.data.SavedSnapshotChunk.create({
                savedSnapshotEntry_id: createdEntry.id,
                chunkIndex,
                chunkBase64,
                user_id: input.userId,
            });
        }),
    );
}

export async function deleteSavedSnapshot(snapshotId: string, userId: string): Promise<void> {
    const client = getRayfinClient();

    const chunks = await client.data.SavedSnapshotChunk
        .select(["id"])
        .where({
            user_id: { eq: userId },
            savedSnapshotEntry_id: { eq: snapshotId },
        })
        .execute();

    await Promise.all(chunks.map((chunk) => client.data.SavedSnapshotChunk.delete({ id: chunk.id })));

    await client.data.SavedSnapshotEntry.delete({ id: snapshotId });

    try {
        const [remainingEntries, remainingChunks] = await Promise.all([
            client.data.SavedSnapshotEntry
                .select(["id"])
                .where({ user_id: { eq: userId } })
                .execute(),
            client.data.SavedSnapshotChunk
                .select(["id", "savedSnapshotEntry_id"])
                .where({ user_id: { eq: userId } })
                .execute(),
        ]);

        const remainingEntryIds = new Set(remainingEntries.map((entry) => String(entry.id)));
        const orphanedChunks = remainingChunks.filter(
            (chunk) => !remainingEntryIds.has(String(chunk.savedSnapshotEntry_id)),
        );

        await Promise.all(
            orphanedChunks.map((chunk) => client.data.SavedSnapshotChunk.delete({ id: chunk.id })),
        );
    } catch {
        // Orphan cleanup is best-effort after the requested record has been deleted.
    }
}

export async function listSavedSnapshots(userId: string): Promise<SavedSnapshotRecord[]> {
    const client = getRayfinClient();
    const entries = await client.data.SavedSnapshotEntry
        .select([
            "id",
            "cameraId",
            "receivedAtUtc",
            "sourceTopic",
            "controlTopic",
            "universalNamespace",
            "contentType",
            "imagePayloadLength",
            "peakToPeakDisplacementThreshold",
            "peakToPeakDisplacement",
            "note",
            "addedByName",
            "addedByEmail",
            "addedAt",
        ])
        .where({ user_id: { eq: userId } })
        .orderBy({ addedAt: "desc" })
        .execute();

    const snapshots = await Promise.all(
        entries.map(async (entry) => {
            const expectedChunkCount = expectedSavedChunkCount(Number(entry.imagePayloadLength ?? 0));
            const chunks = await mapWithConcurrency(
                Array.from({ length: expectedChunkCount }, (_, chunkIndex) => chunkIndex),
                async (chunkIndex) => {
                    const matchingChunks = await client.data.SavedSnapshotChunk
                        .select(["chunkIndex", "chunkBase64"])
                        .where({
                            user_id: { eq: userId },
                            savedSnapshotEntry_id: { eq: entry.id },
                            chunkIndex: { eq: chunkIndex },
                        })
                        .execute();

                    return matchingChunks[0] ?? {
                        chunkIndex,
                        chunkBase64: "",
                    };
                },
                MAX_PARALLEL_SAVED_CHUNK_QUERIES,
            );

            let imagePayloadBase64 = "";
            let payloadError: string | undefined;

            try {
                imagePayloadBase64 = reassembleSnapshotChunks(
                    chunks.map((chunk) => ({
                        chunkIndex: Number(chunk.chunkIndex),
                        chunkBase64: String(chunk.chunkBase64 ?? ""),
                    })),
                    Number(entry.imagePayloadLength ?? 0),
                );
            } catch (err) {
                payloadError = err instanceof Error ? err.message : String(err);
            }

            return {
                id: entry.id,
                cameraId: Number(entry.cameraId),
                receivedAtUtc: String(entry.receivedAtUtc),
                sourceTopic: String(entry.sourceTopic ?? ""),
                controlTopic: String(entry.controlTopic ?? ""),
                universalNamespace: String(entry.universalNamespace ?? entry.controlTopic ?? ""),
                contentType: String(entry.contentType ?? "image/jpeg"),
                imagePayloadLength: Number(entry.imagePayloadLength ?? 0),
                peakToPeakDisplacementThreshold: entry.peakToPeakDisplacementThreshold == null
                    ? null
                    : Number(entry.peakToPeakDisplacementThreshold),
                peakToPeakDisplacement: entry.peakToPeakDisplacement == null
                    ? null
                    : Number(entry.peakToPeakDisplacement),
                imagePayloadBase64,
                payloadError,
                note: String(entry.note ?? ""),
                addedByName: String(entry.addedByName ?? ""),
                addedByEmail: entry.addedByEmail ? String(entry.addedByEmail) : undefined,
                addedAt: String(entry.addedAt),
            } satisfies SavedSnapshotRecord;
        }),
    );

    return snapshots;
}
