import type { ColumnMetadataMap } from "@/lib/to-data-table";
import query from "./latest-snapshots.dax?raw";
import payloadBySecondTemplate from "./snapshot-payload-by-second.dax?raw";
import recentEventsTemplate from "./recent-events.dax?raw";

const connection = "barcelonaModel";

export const columnMetadata: ColumnMetadataMap = {
    "Kusto Query Result[cameraId]": { name: "cameraId", displayName: "Camera ID" },
    "[receivedAtUtc]": { name: "receivedAtUtc", displayName: "Received (UTC)" },
    "[sourceTopic]": { name: "sourceTopic", displayName: "Source Topic" },
    "[controlTopic]": { name: "controlTopic", displayName: "Control Topic" },
    "[peakToPeakDisplacementThreshold]": { name: "peakToPeakDisplacementThreshold", displayName: "Peak-to-Peak Displacement Threshold" },
    "[peakToPeakDisplacement]": { name: "peakToPeakDisplacement", displayName: "Peak-to-Peak Displacement" },
    "[contentType]": { name: "contentType", displayName: "Content Type" },
    "[imagePayloadLength]": { name: "imagePayloadLength", displayName: "Image Payload Length", format: "0" },
    "[ChunkIndex]": { name: "ChunkIndex", displayName: "Chunk Index", format: "0" },
    "[ChunkBase64]": { name: "ChunkBase64", displayName: "Chunk Base64" },
};

export function latestSnapshots() {
    return { connection, query, columnMetadata };
}

interface SnapshotPayloadQueryParams {
    cameraId: number;
    receivedAtUtc: string;
}

export function snapshotPayloadBySecond(params: SnapshotPayloadQueryParams): string {
    const match = params.receivedAtUtc.match(
        /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/,
    );

    if (!match) {
        throw new Error(`Invalid snapshot timestamp: ${params.receivedAtUtc}`);
    }

    const [, year, month, day, hour, minute, second] = match;

    return payloadBySecondTemplate
        .replaceAll("__YEAR__", year)
        .replaceAll("__MONTH__", String(Number(month)))
        .replaceAll("__DAY__", String(Number(day)))
        .replaceAll("__HOUR__", String(Number(hour)))
        .replaceAll("__MINUTE__", String(Number(minute)))
        .replaceAll("__SECOND__", String(Number(second)))
        .replaceAll("__CAMERA_ID__", String(params.cameraId));
}

function toDaxDateTimeLiteral(date: Date): string {
    const iso = date.toISOString();
    return `dt"${iso.slice(0, 19)}"`;
}

export function recentEventsLast24Hours(cameraId: number): string {
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

    return recentEventsTemplate
    .replaceAll("__CAMERA_ID__", String(cameraId))
        .replaceAll("__START_TS__", toDaxDateTimeLiteral(start))
        .replaceAll("__END_TS__", toDaxDateTimeLiteral(end));
}
