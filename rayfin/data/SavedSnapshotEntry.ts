import { entity, authenticated, int, date, text, decimal } from "@microsoft/rayfin-core";

@entity()
@authenticated("*", {
    policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class SavedSnapshotEntry {
    @int()
    cameraId!: number;

    @date()
    receivedAtUtc!: Date;

    @text({ optional: true, max: 300 })
    sourceTopic?: string;

    @text({ optional: true, max: 300 })
    controlTopic?: string;

    @text({ optional: true, max: 500 })
    universalNamespace?: string;

    @text({ max: 100 })
    contentType!: string;

    @int()
    imagePayloadLength!: number;

    @decimal({ optional: true })
    peakToPeakDisplacementThreshold?: number;

    @decimal({ optional: true })
    peakToPeakDisplacement?: number;

    @text({ optional: true, max: 2000 })
    note?: string;

    @text({ max: 200 })
    addedByName!: string;

    @text({ optional: true, max: 320 })
    addedByEmail?: string;

    @date()
    addedAt!: Date;

    @text({ max: 200 })
    user_id!: string;
}
