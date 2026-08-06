import { getRayfinClient } from "@/lib/rayfin-client";

const BASE64_CHUNK_SIZE = 3000;

export interface SaveSnapshotInput {
    cameraId: number;
    receivedAtUtc: string;
    sourceTopic: string;
    controlTopic: string;
    contentType: string;
    imagePayloadLength: number;
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
    contentType: string;
    imagePayloadLength: number;
    imagePayloadBase64: string;
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

function cleanBase64(base64: string): string {
    return extractPayload(base64).replace(/\s/g, "");
}

function splitBase64IntoChunks(base64Payload: string): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < base64Payload.length; i += BASE64_CHUNK_SIZE) {
        chunks.push(base64Payload.slice(i, i + BASE64_CHUNK_SIZE));
    }
    return chunks;
}

export async function saveSnapshot(input: SaveSnapshotInput): Promise<void> {
    const client = getRayfinClient();
    const payload = cleanBase64(input.imagePayloadBase64);
    const chunks = splitBase64IntoChunks(payload);

    const createdEntry = await client.data.SavedSnapshotEntry.create({
        cameraId: input.cameraId,
        receivedAtUtc: new Date(input.receivedAtUtc),
        sourceTopic: input.sourceTopic || null,
        controlTopic: input.controlTopic || null,
        contentType: input.contentType,
        imagePayloadLength: input.imagePayloadLength,
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

export async function listSavedSnapshots(userId: string): Promise<SavedSnapshotRecord[]> {
    const client = getRayfinClient();
    const entries = await client.data.SavedSnapshotEntry
        .select([
            "id",
            "cameraId",
            "receivedAtUtc",
            "sourceTopic",
            "controlTopic",
            "contentType",
            "imagePayloadLength",
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
            const chunks = await client.data.SavedSnapshotChunk
                .select(["chunkIndex", "chunkBase64"])
                .where({
                    user_id: { eq: userId },
                    savedSnapshotEntry_id: { eq: entry.id },
                })
                .orderBy({ chunkIndex: "asc" })
                .execute();

            const imagePayloadBase64 = chunks.map((chunk) => chunk.chunkBase64 ?? "").join("");

            return {
                id: entry.id,
                cameraId: Number(entry.cameraId),
                receivedAtUtc: String(entry.receivedAtUtc),
                sourceTopic: String(entry.sourceTopic ?? ""),
                controlTopic: String(entry.controlTopic ?? ""),
                contentType: String(entry.contentType ?? "image/jpeg"),
                imagePayloadLength: Number(entry.imagePayloadLength ?? 0),
                imagePayloadBase64,
                note: String(entry.note ?? ""),
                addedByName: String(entry.addedByName ?? ""),
                addedByEmail: entry.addedByEmail ? String(entry.addedByEmail) : undefined,
                addedAt: String(entry.addedAt),
            } satisfies SavedSnapshotRecord;
        }),
    );

    return snapshots;
}
