import { entity, authenticated, uuid, int, text } from "@microsoft/rayfin-core";

@entity()
@authenticated("*", {
    policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class SavedSnapshotChunk {
    @uuid()
    savedSnapshotEntry_id!: string;

    @int()
    chunkIndex!: number;

    @text({ max: 3000 })
    chunkBase64!: string;

    @text({ max: 200 })
    user_id!: string;
}
