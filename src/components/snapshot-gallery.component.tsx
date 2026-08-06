import { useEffect, useMemo, useState } from "react";
import type { QueryTable } from "@microsoft/fabric-app-data";

import { getFabricClient } from "@/lib/fabric-client";
import { useSemanticModelQuery } from "@/hooks/use-semantic-model-query";
import { useAuth } from "@/hooks/auth.context";
import { latestSnapshots, recentEventsLast24Hours, snapshotPayloadBySecond } from "@/queries";
import {
    listSavedSnapshots,
    saveSnapshot,
    type SavedSnapshotRecord,
} from "@/services/saved-snapshot.service";

interface SnapshotRow {
    cameraId: string;
    receivedAtUtc: string;
    sourceTopic: string;
    controlTopic: string;
    contentType: string;
    peakToPeakDisplacementThreshold: number | null;
    peakToPeakDisplacement: number | null;
    imagePayloadLength: number;
    chunkCount: number;
    imagePayloadBase64: string;
    encodedPayloadLength: number;
    decodedPayloadLength: number | null;
    payloadLengthMatches: boolean;
}

type TimeZoneOption = {
    value: string;
    label: string;
};

const TIME_ZONE_OPTIONS: TimeZoneOption[] = [
    { value: "Europe/Amsterdam", label: "CET" },
    { value: "UTC", label: "UTC" },
    { value: "Europe/London", label: "UK" },
    { value: "America/New_York", label: "ET" },
    { value: "America/Chicago", label: "CT" },
    { value: "America/Denver", label: "MT" },
    { value: "America/Los_Angeles", label: "PT" },
    { value: "Asia/Singapore", label: "SGT" },
    { value: "Asia/Tokyo", label: "JST" },
];

const DEFAULT_TIME_ZONE = "Europe/Amsterdam";
const TIME_ZONE_PREFERENCE_KEY = "snapshot-gallery-time-zone";

function formatSnapshotAge(receivedAtUtc: string, nowMs: number): string {
    const snapshotDate = parseModelUtcTimestamp(receivedAtUtc);
    if (!snapshotDate) {
        return "unknown";
    }

    const snapshotMs = snapshotDate.getTime();
    const elapsedSeconds = Math.max(0, Math.floor((nowMs - snapshotMs) / 1000));
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (hours > 0) {
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatDisplacement(value: number | null): string {
    if (value == null) return "-";
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function toBarPercent(value: number | null, scaleMax: number): number {
    if (value == null || scaleMax <= 0) return 0;
    return Math.max(0, Math.min(100, (value / scaleMax) * 100));
}

function normalizeSearchText(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

function buildSavedSnapshotSearchText(item: SavedSnapshotRecord): string {
    return [
        item.id,
        item.cameraId,
        item.receivedAtUtc,
        item.sourceTopic,
        item.controlTopic,
        item.contentType,
        item.imagePayloadLength,
        item.imagePayloadBase64,
        item.note,
        item.addedByName,
        item.addedByEmail ?? "",
        item.addedAt,
    ].map(normalizeSearchText).join(" ");
}

interface SnapshotMetadataRow {
    cameraId: number;
    receivedAtUtc: string;
}

interface SnapshotImageProps {
    base64: string;
    contentType: string;
    alt: string;
    className?: string;
}

type SnapshotPayloadRow = Omit<
    SnapshotRow,
    "encodedPayloadLength" | "decodedPayloadLength" | "payloadLengthMatches"
>;

export type GalleryViewMode = "live" | "saved";

interface SnapshotGalleryProps {
    viewMode: GalleryViewMode;
}

interface SnapshotChunkRow {
    row: unknown[];
    chunkIndex: number;
}

interface RecentEventRow {
    cameraId: string;
    receivedAtUtc: string;
    peakToPeakDisplacementThreshold: number | null;
    peakToPeakDisplacement: number | null;
}

const REFRESH_INTERVAL_MS = 10000;
const REFRESH_INTERVAL_OPTIONS_SECONDS = Array.from({ length: 12 }, (_, index) => (index + 1) * 5);
const DISPLACEMENT_VISUALS_PREFERENCE_KEY = "snapshot-gallery-show-displacement-visuals";

function normalizeColumnName(name: string): string {
    const bracketMatch = name.match(/\[([^\]]+)\]$/);
    if (bracketMatch) {
        return bracketMatch[1].trim().toLowerCase();
    }

    return name.replace(/[\[\]\"']/g, "").trim().toLowerCase();
}

function parseModelUtcTimestamp(timestamp: string): Date | null {
    const normalized = timestamp.endsWith("Z") ? timestamp : `${timestamp}Z`;
    const date = new Date(normalized);

    return Number.isNaN(date.getTime()) ? null : date;
}

function getColumnIndex(columns: QueryTable["columns"], expected: string): number {
    const normalizedExpected = expected.trim().toLowerCase();

    return columns.findIndex((column) => normalizeColumnName(column.name) === normalizedExpected);
}

function toSnapshotMetadataRows(table: QueryTable): SnapshotMetadataRow[] {
    const cameraIdIndex = getColumnIndex(table.columns, "cameraId");
    const receivedAtUtcIndex = getColumnIndex(table.columns, "receivedAtUtc");
    if (
        cameraIdIndex === -1
        || receivedAtUtcIndex === -1
    ) {
        return [];
    }

    return table.rows
        .map((row) => {
            const cameraId = Number(row[cameraIdIndex]);
            if (Number.isNaN(cameraId)) return null;

            return {
                cameraId,
                receivedAtUtc: String(row[receivedAtUtcIndex] ?? ""),
            };
        })
        .filter((row): row is SnapshotMetadataRow => row !== null);
}

function toRecentEventRows(table: QueryTable): RecentEventRow[] {
    const cameraIdIndex = getColumnIndex(table.columns, "cameraId");
    const receivedAtUtcIndex = getColumnIndex(table.columns, "receivedAtUtc");
    const peakToPeakDisplacementThresholdIndex = getColumnIndex(table.columns, "peakToPeakDisplacementThreshold");
    const peakToPeakDisplacementIndex = getColumnIndex(table.columns, "peakToPeakDisplacement");

    if (
        cameraIdIndex === -1
        || receivedAtUtcIndex === -1
        || peakToPeakDisplacementThresholdIndex === -1
        || peakToPeakDisplacementIndex === -1
    ) {
        return [];
    }

    const dedupedRows = new Map<string, RecentEventRow>();

    table.rows.forEach((row) => {
        const cameraId = Number(row[cameraIdIndex]);
        if (Number.isNaN(cameraId)) return;

        const eventRow = {
            cameraId: String(cameraId),
            receivedAtUtc: String(row[receivedAtUtcIndex] ?? ""),
            peakToPeakDisplacementThreshold: asNumberOrNull(row[peakToPeakDisplacementThresholdIndex]),
            peakToPeakDisplacement: asNumberOrNull(row[peakToPeakDisplacementIndex]),
        } satisfies RecentEventRow;

        dedupedRows.set(
            `${eventRow.cameraId}|${eventRow.receivedAtUtc}|${eventRow.peakToPeakDisplacementThreshold ?? ""}|${eventRow.peakToPeakDisplacement ?? ""}`,
            eventRow,
        );
    });

    return [...dedupedRows.values()].sort((first, second) => {
            if (first.cameraId !== second.cameraId) {
                return Number(first.cameraId) - Number(second.cameraId);
            }

            return first.receivedAtUtc.localeCompare(second.receivedAtUtc);
        });
}

function asNumberOrNull(value: unknown): number | null {
    if (value == null) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
}

function toPayloadRow(table: QueryTable): SnapshotPayloadRow | null {
    const cameraIdIndex = getColumnIndex(table.columns, "cameraId");
    const receivedAtUtcIndex = getColumnIndex(table.columns, "receivedAtUtc");
    const sourceTopicIndex = getColumnIndex(table.columns, "sourceTopic");
    const controlTopicIndex = getColumnIndex(table.columns, "controlTopic");
    const contentTypeIndex = getColumnIndex(table.columns, "contentType");
    const peakToPeakDisplacementThresholdIndex = getColumnIndex(table.columns, "peakToPeakDisplacementThreshold");
    const peakToPeakDisplacementIndex = getColumnIndex(table.columns, "peakToPeakDisplacement");
    const imagePayloadLengthIndex = getColumnIndex(table.columns, "imagePayloadLength");
    const chunkIndexIndex = getColumnIndex(table.columns, "ChunkIndex");
    const chunkBase64Index = getColumnIndex(table.columns, "ChunkBase64");

    if (
        cameraIdIndex === -1
        || receivedAtUtcIndex === -1
        || sourceTopicIndex === -1
        || controlTopicIndex === -1
        || contentTypeIndex === -1
        || peakToPeakDisplacementThresholdIndex === -1
        || peakToPeakDisplacementIndex === -1
        || imagePayloadLengthIndex === -1
        || chunkIndexIndex === -1
        || chunkBase64Index === -1
    ) {
        return null;
    }

    const chunkRows: SnapshotChunkRow[] = table.rows
        .map((row) => {
            const chunkIndex = Number(row[chunkIndexIndex]);
            if (Number.isNaN(chunkIndex)) return null;

            const chunkBase64 = String(row[chunkBase64Index] ?? "").trim();
            if (!chunkBase64) return null;

            return { row, chunkIndex };
        })
        .filter((entry): entry is SnapshotChunkRow => entry !== null)
        .sort((first, second) => first.chunkIndex - second.chunkIndex);

    if (chunkRows.length === 0) return null;

    const firstRow = chunkRows[0].row;
    const imagePayloadBase64 = chunkRows
        .map(({ row }) => String(row[chunkBase64Index] ?? "").trim())
        .join("");

    if (!imagePayloadBase64) return null;

    return {
        cameraId: String(firstRow[cameraIdIndex] ?? "Unknown"),
        receivedAtUtc: String(firstRow[receivedAtUtcIndex] ?? ""),
        sourceTopic: String(firstRow[sourceTopicIndex] ?? ""),
        controlTopic: String(firstRow[controlTopicIndex] ?? ""),
        contentType: String(firstRow[contentTypeIndex] ?? "image/jpeg"),
        peakToPeakDisplacementThreshold: asNumberOrNull(firstRow[peakToPeakDisplacementThresholdIndex]),
        peakToPeakDisplacement: asNumberOrNull(firstRow[peakToPeakDisplacementIndex]),
        imagePayloadLength: Number(firstRow[imagePayloadLengthIndex] ?? 0),
        chunkCount: chunkRows.length,
        imagePayloadBase64,
    };
}

function extractPayload(base64: string): string {
    const trimmed = base64.trim();
    if (trimmed.startsWith("data:")) {
        const payload = trimmed.split(",", 2)[1] ?? "";
        return payload;
    }

    return trimmed;
}

function cleanBase64(base64: string): string {
    return extractPayload(base64).replace(/\s/g, "");
}

function resolveImageContentType(contentType: string): string {
    const normalized = contentType.trim().toLowerCase();
    return normalized.startsWith("image/") ? contentType : "image/jpeg";
}

function decodeBase64Bytes(base64: string): Uint8Array | null {
    try {
        const cleanPayload = cleanBase64(base64);
        if (!cleanPayload) {
            return null;
        }

        const binary = atob(cleanPayload);
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }

        return bytes;
    } catch {
        return null;
    }
}

function toDataUrl(base64: string, contentType: string): string | null {
    const cleanPayload = cleanBase64(base64);
    if (!cleanPayload) {
        return null;
    }

    const imageContentType = resolveImageContentType(contentType || "image/jpeg");
    return `data:${imageContentType};base64,${cleanPayload}`;
}

function formatDateTime(value: string | Date, timeZone: string): string {
    const date = typeof value === "string"
        ? parseModelUtcTimestamp(value)
        : value;

    if (!date) {
        return typeof value === "string" ? value : "unknown";
    }

    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone,
    });
}

function SnapshotImage({ base64, contentType, alt, className }: SnapshotImageProps) {
    const imageUrl = useMemo(() => toDataUrl(base64, contentType), [base64, contentType]);

    if (!imageUrl) {
        return (
            <div className="flex h-[280px] w-full items-center justify-center bg-muted text-200 text-muted-foreground">
                Unable to decode snapshot image
            </div>
        );
    }

    return (
        <img
            src={imageUrl}
            alt={alt}
            className={className ?? "h-[280px] w-full bg-muted object-contain"}
        />
    );
}

function payloadLooksTruncated(row: SnapshotRow): boolean {
    return !row.payloadLengthMatches;
}

function downloadSnapshotImage(row: {
    cameraId: string | number;
    receivedAtUtc: string;
    contentType: string;
    imagePayloadBase64: string;
}): string | null {
    const bytes = decodeBase64Bytes(row.imagePayloadBase64);
    if (!bytes) {
        return "Unable to decode image payload for download.";
    }

    const contentType = resolveImageContentType(row.contentType);
    const extension = contentType.includes("png")
        ? "png"
        : contentType.includes("webp")
            ? "webp"
            : contentType.includes("gif")
                ? "gif"
                : "jpg";

    const arrayBuffer = new ArrayBuffer(bytes.length);
    new Uint8Array(arrayBuffer).set(bytes);
    const blob = new Blob([arrayBuffer], { type: contentType });
    const objectUrl = URL.createObjectURL(blob);
    const fileName = `camera-${row.cameraId}-${row.receivedAtUtc.replace(/[:.]/g, "-")}.${extension}`;

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
    return null;
}

export function SnapshotGallery({ viewMode }: SnapshotGalleryProps) {
    const { session } = useAuth();
    const { connection, query } = latestSnapshots();
    const [lastRefreshUtc, setLastRefreshUtc] = useState<Date | null>(null);
    const [rows, setRows] = useState<SnapshotRow[]>([]);
    const [payloadError, setPayloadError] = useState<string | null>(null);
    const [frozenCameraIds, setFrozenCameraIds] = useState<Record<string, boolean>>({});
    const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState<number>(10);
    const refreshIntervalMs = refreshIntervalSeconds * 1000;
    const [nextRefreshAt, setNextRefreshAt] = useState<number>(() => Date.now() + REFRESH_INTERVAL_MS);
    const [secondsUntilRefresh, setSecondsUntilRefresh] = useState<number>(Math.ceil(REFRESH_INTERVAL_MS / 1000));
    const [selectedRow, setSelectedRow] = useState<SnapshotRow | null>(null);
    const [saveNote, setSaveNote] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [savedSnapshots, setSavedSnapshots] = useState<SavedSnapshotRecord[]>([]);
    const [savedError, setSavedError] = useState<string | null>(null);
    const [isSavedLoading, setIsSavedLoading] = useState(false);
    const [savedLogSearch, setSavedLogSearch] = useState("");
    const [savedLogCameraFilter, setSavedLogCameraFilter] = useState<string>("all");
    const [panelNowMs, setPanelNowMs] = useState<number>(() => Date.now());
    const [latestFreshRowsByCamera, setLatestFreshRowsByCamera] = useState<Record<string, SnapshotRow>>({});
    const [frozenBaselineByCamera, setFrozenBaselineByCamera] = useState<Record<string, string>>({});
    const [pendingFrozenUpdates, setPendingFrozenUpdates] = useState<Record<string, boolean>>({});
    const [recentEventsByCamera, setRecentEventsByCamera] = useState<Record<string, RecentEventRow[]>>({});
    const [recentEventsError, setRecentEventsError] = useState<string | null>(null);
    const [timeZone, setTimeZone] = useState<string>(() => {
        if (typeof window === "undefined") return DEFAULT_TIME_ZONE;

        return window.localStorage.getItem(TIME_ZONE_PREFERENCE_KEY) ?? DEFAULT_TIME_ZONE;
    });
    const [showDisplacementVisuals, setShowDisplacementVisuals] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;

        const savedPreference = window.localStorage.getItem(DISPLACEMENT_VISUALS_PREFERENCE_KEY);
        return savedPreference == null ? false : savedPreference === "true";
    });

    const { data, isLoading, error, refetch } = useSemanticModelQuery({
        connection,
        query,
        bypassCache: true,
    });

    async function triggerRefresh() {
        setNextRefreshAt(Date.now() + refreshIntervalMs);
        setSecondsUntilRefresh(refreshIntervalSeconds);
        await refetch();
    }

    useEffect(() => {
        setNextRefreshAt(Date.now() + refreshIntervalMs);
        setSecondsUntilRefresh(refreshIntervalSeconds);
    }, [refreshIntervalMs, refreshIntervalSeconds]);

    useEffect(() => {
        if (data?.status === "success") {
            setLastRefreshUtc(new Date());
        }
    }, [data]);

    useEffect(() => {
        window.localStorage.setItem(DISPLACEMENT_VISUALS_PREFERENCE_KEY, String(showDisplacementVisuals));
    }, [showDisplacementVisuals]);

    useEffect(() => {
        window.localStorage.setItem(TIME_ZONE_PREFERENCE_KEY, timeZone);
    }, [timeZone]);

    useEffect(() => {
        const timerId = window.setInterval(() => {
            void triggerRefresh();
        }, refreshIntervalMs);

        return () => window.clearInterval(timerId);
    }, [refetch, refreshIntervalMs]);

    useEffect(() => {
        const countdownId = window.setInterval(() => {
            const remainingMs = Math.max(0, nextRefreshAt - Date.now());
            setSecondsUntilRefresh(Math.ceil(remainingMs / 1000));
        }, 250);

        return () => window.clearInterval(countdownId);
    }, [nextRefreshAt]);

    useEffect(() => {
        const ageTickerId = window.setInterval(() => {
            setPanelNowMs(Date.now());
        }, 1000);

        return () => window.clearInterval(ageTickerId);
    }, []);

    const metadataRows = useMemo(() => {
        if (data?.status !== "success") return [];
        return toSnapshotMetadataRows(data.table);
    }, [data]);

    useEffect(() => {
        let cancelled = false;

        async function loadPayloads() {
            if (metadataRows.length === 0) {
                setRows((currentRows) => currentRows.filter((row) => frozenCameraIds[row.cameraId]));
                setLatestFreshRowsByCamera({});
                setPendingFrozenUpdates({});
                setRecentEventsByCamera({});
                return;
            }

            setPayloadError(null);

            const payloadResults = await Promise.all(
                metadataRows.map(async (metadata) => {
                    const payloadQuery = snapshotPayloadBySecond({
                        cameraId: metadata.cameraId,
                        receivedAtUtc: metadata.receivedAtUtc,
                    });

                    const payloadResult = await getFabricClient()
                        .semanticModel(connection)
                        .query(payloadQuery, { bypassCache: true });

                    if (payloadResult.status !== "success") {
                        throw new Error(payloadResult.error.message);
                    }

                    const payloadRow = toPayloadRow(payloadResult.table);
                    if (!payloadRow) return null;

                    const normalizedPayload = cleanBase64(payloadRow.imagePayloadBase64);
                    const decodedBytes = decodeBase64Bytes(payloadRow.imagePayloadBase64);

                    return {
                        ...payloadRow,
                        encodedPayloadLength: normalizedPayload.length,
                        decodedPayloadLength: decodedBytes?.length ?? null,
                        payloadLengthMatches: decodedBytes?.length === payloadRow.imagePayloadLength,
                    };
                }),
            );

            if (cancelled) return;

            const freshRows = payloadResults.filter((row): row is SnapshotRow => row !== null);

            try {
                const uniqueCameraIds = Array.from(new Set(metadataRows.map((row) => row.cameraId)));

                const recentEventResults = await Promise.allSettled(
                    uniqueCameraIds.map(async (cameraId) => {
                        const recentEventsResult = await getFabricClient()
                            .semanticModel(connection)
                            .query(recentEventsLast24Hours(cameraId), { bypassCache: true });

                        if (recentEventsResult.status !== "success") {
                            throw new Error(`Camera ${cameraId}: ${recentEventsResult.error.message}`);
                        }

                        return toRecentEventRows(recentEventsResult.table);
                    }),
                );

                const groupedByCamera: Record<string, RecentEventRow[]> = {};
                const recentEventErrors: string[] = [];

                for (const result of recentEventResults) {
                    if (result.status === "rejected") {
                        const reasonText = result.reason instanceof Error
                            ? result.reason.message
                            : String(result.reason);
                        recentEventErrors.push(reasonText);
                        continue;
                    }

                    for (const eventRow of result.value) {
                        if (!groupedByCamera[eventRow.cameraId]) {
                            groupedByCamera[eventRow.cameraId] = [];
                        }

                        groupedByCamera[eventRow.cameraId].push(eventRow);
                    }
                }

                setRecentEventsByCamera(groupedByCamera);
                setRecentEventsError(recentEventErrors.length > 0 ? recentEventErrors.join(" | ") : null);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                setRecentEventsError(message);
                setRecentEventsByCamera({});
            }

            const latestByCamera: Record<string, SnapshotRow> = {};
            for (const row of freshRows) {
                latestByCamera[row.cameraId] = row;
            }
            setLatestFreshRowsByCamera(latestByCamera);

            const nextPendingFrozenUpdates: Record<string, boolean> = {};
            for (const row of freshRows) {
                if (!frozenCameraIds[row.cameraId]) continue;

                const baselineTimestamp = frozenBaselineByCamera[row.cameraId];
                if (baselineTimestamp && row.receivedAtUtc !== baselineTimestamp) {
                    nextPendingFrozenUpdates[row.cameraId] = true;
                }
            }
            setPendingFrozenUpdates(nextPendingFrozenUpdates);

            setRows((currentRows) => {
                const frozenRows = currentRows.filter((row) => frozenCameraIds[row.cameraId]);
                const nextFreshRows = freshRows.filter((row) => !frozenCameraIds[row.cameraId]);
                const mergedRows = [...nextFreshRows];

                for (const frozenRow of frozenRows) {
                    const existingIndex = mergedRows.findIndex((row) => row.cameraId === frozenRow.cameraId);
                    if (existingIndex === -1) {
                        mergedRows.push(frozenRow);
                    } else {
                        mergedRows[existingIndex] = frozenRow;
                    }
                }

                return mergedRows.sort((first, second) => {
                    return Number(first.cameraId) - Number(second.cameraId);
                });
            });
        }

        void loadPayloads().catch((err) => {
            if (!cancelled) {
                const message = err instanceof Error ? err.message : String(err);
                setPayloadError(message);
                setRows([]);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [connection, frozenBaselineByCamera, frozenCameraIds, metadataRows]);

    const selectedTimeZoneLabel = TIME_ZONE_OPTIONS.find((option) => option.value === timeZone)?.label ?? timeZone;

    const statusText = lastRefreshUtc
        ? `Last refresh: ${formatDateTime(lastRefreshUtc, timeZone)} ${selectedTimeZoneLabel}`
        : "Waiting for first successful refresh";

    const visibleRows = useMemo(() => {
        return [...rows].sort((first, second) => Number(first.cameraId) - Number(second.cameraId));
    }, [rows]);

    function buildTimelineScaleMax(cameraEvents: RecentEventRow[]): number {
        const values = cameraEvents.flatMap((eventRow) => [
            eventRow.peakToPeakDisplacementThreshold ?? 0,
            eventRow.peakToPeakDisplacement ?? 0,
        ]);

        return Math.max(1, ...values);
    }

    interface DisplacementHistogramBin {
        label: string;
        count: number;
    }

    function buildDisplacementHistogramBins(cameraEvents: RecentEventRow[]): DisplacementHistogramBin[] {
        const counts = new Map<number, number>();

        for (const eventRow of cameraEvents) {
            if (eventRow.peakToPeakDisplacement == null || !Number.isFinite(eventRow.peakToPeakDisplacement)) {
                continue;
            }

            const roundedDisplacement = Math.round(eventRow.peakToPeakDisplacement);
            counts.set(roundedDisplacement, (counts.get(roundedDisplacement) ?? 0) + 1);
        }

        return Array.from(counts.entries())
            .sort((first, second) => first[0] - second[0])
            .map(([value, count]) => ({
                label: String(value),
                count,
            }));
    }

    function buildTimelineDotStyle(
        eventRow: RecentEventRow,
        cameraEvents: RecentEventRow[],
        eventIndex: number,
        scaleMax: number,
    ) {
        const eventTimeMs = Date.parse(eventRow.receivedAtUtc);
        const startMs = panelNowMs - 24 * 60 * 60 * 1000;
        const leftPercent = Number.isFinite(eventTimeMs)
            ? Math.max(0, Math.min(100, ((eventTimeMs - startMs) / (24 * 60 * 60 * 1000)) * 100))
            : (cameraEvents.length > 1 ? (eventIndex / (cameraEvents.length - 1)) * 100 : 100);

        const bottomPercent = Math.max(0, Math.min(100, ((eventRow.peakToPeakDisplacement ?? 0) / scaleMax) * 100));

        return {
            leftPercent,
            bottomPercent,
        };
    }

    function buildThresholdTracePath(cameraEvents: RecentEventRow[], scaleMax: number): string | null {
        if (cameraEvents.length === 0) {
            return null;
        }

        const startMs = panelNowMs - 24 * 60 * 60 * 1000;
        const width = 100;

        const points = cameraEvents
            .map((eventRow, eventIndex) => {
                const eventTimeMs = Date.parse(eventRow.receivedAtUtc);
                const x = Number.isFinite(eventTimeMs)
                    ? Math.max(0, Math.min(width, ((eventTimeMs - startMs) / (24 * 60 * 60 * 1000)) * width))
                    : (cameraEvents.length > 1 ? (eventIndex / (cameraEvents.length - 1)) * width : width);
                const y = 100 - Math.max(0, Math.min(100, ((eventRow.peakToPeakDisplacementThreshold ?? 0) / scaleMax) * 100));

                return { x, y };
            })
            .sort((first, second) => first.x - second.x);

        const firstPoint = points[0];
        if (!firstPoint) {
            return null;
        }

        const commands: string[] = [`M ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`];

        for (let index = 1; index < points.length; index += 1) {
            const previousPoint = points[index - 1];
            const point = points[index];
            commands.push(`H ${point.x.toFixed(2)}`);
            commands.push(`V ${point.y.toFixed(2)}`);

            if (index === points.length - 1 && previousPoint.y !== point.y) {
                commands.push(`H ${point.x.toFixed(2)}`);
            }
        }

        return commands.join(" ");
    }

    const currentUserId = session?.user?.id ?? "";
    const currentUserDisplayName = session?.user?.email ?? "Unknown";

    async function refreshSavedSnapshots(): Promise<void> {
        if (!currentUserId) {
            setSavedSnapshots([]);
            return;
        }

        setIsSavedLoading(true);
        setSavedError(null);

        try {
            const saved = await listSavedSnapshots(currentUserId);
            setSavedSnapshots(saved);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setSavedError(message);
        } finally {
            setIsSavedLoading(false);
        }
    }

    useEffect(() => {
        void refreshSavedSnapshots();
    }, [currentUserId]);

    const savedCameraOptions = useMemo(() => {
        const uniqueCameraIds = new Set(savedSnapshots.map((item) => String(item.cameraId)));
        return Array.from(uniqueCameraIds).sort((first, second) => Number(first) - Number(second));
    }, [savedSnapshots]);

    const filteredSavedSnapshots = useMemo(() => {
        const searchTerm = savedLogSearch.trim().toLowerCase();

        return savedSnapshots.filter((item) => {
            if (savedLogCameraFilter !== "all" && String(item.cameraId) !== savedLogCameraFilter) {
                return false;
            }

            if (!searchTerm) {
                return true;
            }

            return buildSavedSnapshotSearchText(item).includes(searchTerm);
        });
    }, [savedLogCameraFilter, savedLogSearch, savedSnapshots]);

    function toggleFrozen(cameraId: string, isFrozen: boolean) {
        setFrozenCameraIds((current) => {
            if (!isFrozen) {
                const next = { ...current };
                delete next[cameraId];
                return next;
            }

            return {
                ...current,
                [cameraId]: true,
            };
        });

        if (isFrozen) {
            const currentRow = rows.find((row) => row.cameraId === cameraId);
            if (currentRow) {
                setFrozenBaselineByCamera((current) => ({
                    ...current,
                    [cameraId]: currentRow.receivedAtUtc,
                }));
            }
            return;
        }

        setFrozenBaselineByCamera((current) => {
            const next = { ...current };
            delete next[cameraId];
            return next;
        });

        setPendingFrozenUpdates((current) => {
            const next = { ...current };
            delete next[cameraId];
            return next;
        });

        const freshRow = latestFreshRowsByCamera[cameraId];
        if (!freshRow) return;

        setRows((currentRows) => {
            const existingIndex = currentRows.findIndex((row) => row.cameraId === cameraId);
            const nextRows = [...currentRows];

            if (existingIndex === -1) {
                nextRows.push(freshRow);
            } else {
                nextRows[existingIndex] = freshRow;
            }

            return nextRows.sort((first, second) => Number(first.cameraId) - Number(second.cameraId));
        });
    }

    function openDetails(row: SnapshotRow): void {
        toggleFrozen(row.cameraId, true);
        setSelectedRow(row);
        setSaveNote("");
    }

    function closeDetails(): void {
        if (isSaving) return;
        const cameraId = selectedRow?.cameraId;

        if (cameraId && pendingFrozenUpdates[cameraId]) {
            // Apply the pending image update when returning to the main panel.
            toggleFrozen(cameraId, false);
        }

        setSelectedRow(null);
        setSaveNote("");
    }

    function handleDownloadSelected(): void {
        if (!selectedRow) return;
        const errorMessage = downloadSnapshotImage(selectedRow);
        if (errorMessage) {
            setPayloadError(errorMessage);
        }
    }

    async function handleSaveSelected(): Promise<void> {
        if (!selectedRow) return;
        if (!currentUserId) {
            setPayloadError("Cannot save image because user identity is missing.");
            return;
        }
        if (payloadLooksTruncated(selectedRow)) {
            setPayloadError("Cannot save a truncated payload. Wait for a complete snapshot.");
            return;
        }

        setIsSaving(true);
        setPayloadError(null);
        try {
            await saveSnapshot({
                cameraId: Number(selectedRow.cameraId),
                receivedAtUtc: selectedRow.receivedAtUtc,
                sourceTopic: selectedRow.sourceTopic,
                controlTopic: selectedRow.controlTopic,
                contentType: selectedRow.contentType,
                imagePayloadLength: selectedRow.imagePayloadLength,
                imagePayloadBase64: selectedRow.imagePayloadBase64,
                note: saveNote,
                addedByName: currentUserDisplayName,
                addedByEmail: session?.user?.email ?? undefined,
                userId: currentUserId,
            });

            await refreshSavedSnapshots();
            closeDetails();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setPayloadError(message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <main className="min-h-full bg-background">
            <section className="mx-auto max-w-[1400px] p-600">
                {viewMode === "live" ? (
                    <div className="mb-500 flex flex-wrap items-center justify-between gap-300 rounded-xl border bg-card p-400">
                        <div>
                            <p className="text-200 text-muted-foreground">Live snapshots from semantic model</p>
                            <p className="text-300 font-semibold text-foreground">{statusText}</p>
                            <p className="text-200 text-muted-foreground">Next refresh in {secondsUntilRefresh}s</p>
                            <p className="mt-200 text-200 text-muted-foreground">
                                Automatic refresh runs on the selected interval. Enable Freeze on a panel to keep that camera on its current image.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-300">
                            <label className="flex items-center gap-200 text-200 text-muted-foreground">
                                <span>Timezone</span>
                                <select
                                    value={timeZone}
                                    onChange={(event) => setTimeZone(event.target.value)}
                                    className="rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {TIME_ZONE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex items-center gap-200 text-200 text-muted-foreground">
                                <span>Refresh every</span>
                                <select
                                    value={refreshIntervalSeconds}
                                    onChange={(event) => setRefreshIntervalSeconds(Number(event.target.value))}
                                    className="rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    {REFRESH_INTERVAL_OPTIONS_SECONDS.map((seconds) => (
                                        <option key={seconds} value={seconds}>{seconds} seconds</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                ) : (
                    <div className="mb-500 flex flex-wrap items-center justify-end gap-300 rounded-xl border bg-card p-400">
                        <label className="flex items-center gap-200 text-200 text-muted-foreground">
                            <span>Timezone</span>
                            <select
                                value={timeZone}
                                onChange={(event) => setTimeZone(event.target.value)}
                                className="rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {TIME_ZONE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                )}

                {isLoading && rows.length === 0 ? (
                    viewMode === "live" ? (
                    <div className="rounded-xl border bg-card p-500 text-300 text-muted-foreground">
                        Loading the latest snapshot images...
                    </div>
                    ) : null
                ) : null}

                {error && viewMode === "live" ? (
                    <div className="rounded-xl border border-destructive bg-destructive/10 p-400 text-300 text-destructive">
                        {error.message}
                    </div>
                ) : null}

                {payloadError ? (
                    <div className="rounded-xl border border-destructive bg-destructive/10 p-400 text-300 text-destructive">
                        {payloadError}
                    </div>
                ) : null}

                {data?.status === "error" && viewMode === "live" ? (
                    <div className="rounded-xl border border-destructive bg-destructive/10 p-400 text-300 text-destructive">
                        {data.error.message}
                    </div>
                ) : null}

                {!isLoading && visibleRows.length === 0 && viewMode === "live" ? (
                    <div className="rounded-xl border bg-card p-500 text-300 text-muted-foreground">
                        No snapshots are available yet.
                    </div>
                ) : null}

                {visibleRows.length > 0 && viewMode === "live" ? (
                    <div className="grid grid-cols-1 gap-400 md:grid-cols-2 xl:grid-cols-3">
                        {visibleRows.map((row, index) => (
                            (() => {
                                const hasPendingFrozenUpdate = Boolean(pendingFrozenUpdates[row.cameraId]);

                                return (
                            <article
                                key={`${row.cameraId}-${row.receivedAtUtc}-${index}`}
                                className="overflow-hidden rounded-xl border bg-card"
                            >
                                <div className="flex items-center justify-between border-b border-border px-300 py-200">
                                    <p className="text-300 font-semibold text-foreground">Camera {row.cameraId}</p>
                                    <div className="flex items-center gap-300">
                                        <button
                                            type="button"
                                            onClick={() => openDetails(row)}
                                            className="rounded-md border border-border bg-background px-200 py-100 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            Details
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDisplacementVisuals((current) => !current)}
                                            className="rounded-md border border-border bg-background px-200 py-100 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            {showDisplacementVisuals ? "Hide details" : "Show details"}
                                        </button>
                                        <label className={hasPendingFrozenUpdate
                                            ? "flex items-center gap-200 text-200 font-semibold text-foreground"
                                            : "flex items-center gap-200 text-200 text-muted-foreground"
                                        }>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(frozenCameraIds[row.cameraId])}
                                                onChange={(event) => toggleFrozen(row.cameraId, event.target.checked)}
                                                className="h-4 w-4"
                                            />
                                            Freeze
                                        </label>
                                        {hasPendingFrozenUpdate ? (
                                            <span className="text-200 font-semibold text-destructive">Update ready, unfreeze to apply</span>
                                        ) : null}
                                    </div>
                                </div>
                                {payloadLooksTruncated(row) ? (
                                    <div className="flex h-[280px] w-full items-center justify-center bg-muted px-300 text-center text-200 text-muted-foreground">
                                        Image not rendered because the base64 payload length does not match the expected length.
                                    </div>
                                ) : (
                                    <SnapshotImage
                                        base64={row.imagePayloadBase64}
                                        contentType={row.contentType}
                                        alt={`Camera ${row.cameraId} snapshot at ${formatDateTime(row.receivedAtUtc, timeZone)}`}
                                    />
                                )}
                                {payloadLooksTruncated(row) ? (
                                    <div className="border-t border-destructive/40 bg-destructive/10 px-300 py-200 text-200 text-destructive">
                                        Base64 payload appears truncated by the semantic model. Image render is unreliable.
                                    </div>
                                ) : null}
                                <div className="space-y-100 p-300 text-200">
                                    <p><span className="font-semibold">Received:</span> {formatDateTime(row.receivedAtUtc, timeZone)} {selectedTimeZoneLabel}</p>
                                    <p><span className="font-semibold">Image age:</span> {formatSnapshotAge(row.receivedAtUtc, panelNowMs)}</p>
                                    <p className="truncate"><span className="font-semibold">Source:</span> {row.sourceTopic || "-"}</p>
                                    {(() => {
                                        const universalNamespaceParts = row.controlTopic
                                            .split("/")
                                            .map((value) => value.trim())
                                            .filter((value) => value.length > 0);

                                        const [company, country, city, building, line, sensor] = [
                                            universalNamespaceParts[0] ?? "-",
                                            universalNamespaceParts[1] ?? "-",
                                            universalNamespaceParts[2] ?? "-",
                                            universalNamespaceParts[3] ?? "-",
                                            universalNamespaceParts[4] ?? "-",
                                            universalNamespaceParts[5] ?? "-",
                                        ];

                                        return (
                                            <div className="space-y-0 break-words leading-tight">
                                                <p className="mb-0"><span className="font-semibold">Universal Namespace</span></p>
                                                <p className="mb-0"><span className="font-semibold">Company:</span> {company}</p>
                                                <p className="mb-0"><span className="font-semibold">Country:</span> {country}</p>
                                                <p className="mb-0"><span className="font-semibold">City:</span> {city}</p>
                                                <p className="mb-0"><span className="font-semibold">Building:</span> {building}</p>
                                                <p className="mb-0"><span className="font-semibold">Line:</span> {line}</p>
                                                <p className="mb-0"><span className="font-semibold">Sensor:</span> {sensor}</p>
                                            </div>
                                        );
                                    })()}
                                    <p><span className="font-semibold">Image bytes:</span> {row.imagePayloadLength}</p>
                                    <p><span className="font-semibold">Chunk count:</span> {row.chunkCount}</p>
                                    {showDisplacementVisuals ? (() => {
                                        const threshold = row.peakToPeakDisplacementThreshold;
                                        const displacement = row.peakToPeakDisplacement;
                                        const scaleMax = Math.max(1, threshold ?? 0, displacement ?? 0);
                                        const exceedsThreshold = threshold != null
                                            && displacement != null
                                            && displacement > threshold;

                                        const currentPercent = toBarPercent(displacement, scaleMax);
                                        const thresholdPercent = toBarPercent(threshold, scaleMax);

                                        return (
                                            <div className="rounded-md border border-border bg-background/50 p-200">
                                                <p className="mb-100 font-semibold text-foreground">Displacement</p>

                                                <div className="mb-100">
                                                    <div className="flex h-36 flex-col items-center justify-center rounded-sm bg-muted/30 px-100 py-100">
                                                        <div className="relative mx-auto flex h-20 w-10 items-end rounded-sm bg-muted">
                                                            <div
                                                                className={exceedsThreshold ? "w-full rounded-sm bg-destructive" : "w-full rounded-sm bg-foreground"}
                                                                style={{ height: `${currentPercent}%` }}
                                                            />
                                                            {threshold != null ? (
                                                                <span
                                                                    className="pointer-events-none absolute left-0 right-0 border-t-2 border-muted-foreground"
                                                                    style={{ bottom: `${thresholdPercent}%` }}
                                                                    aria-hidden="true"
                                                                />
                                                            ) : null}
                                                        </div>
                                                        <p className="mt-100 text-center text-100 text-muted-foreground">Current / Threshold</p>
                                                        <p className={exceedsThreshold ? "text-center text-destructive" : "text-center text-foreground"}>
                                                            {formatDisplacement(displacement)} / {formatDisplacement(threshold)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })() : null}
                                    {showDisplacementVisuals ? (() => {
                                        const cameraEvents = recentEventsByCamera[row.cameraId] ?? [];
                                        const scaleMax = buildTimelineScaleMax(cameraEvents);
                                        const thresholdTracePath = buildThresholdTracePath(cameraEvents, scaleMax);

                                        return (
                                            <div className="rounded-md border border-border bg-background/50 p-200">
                                                <div className="mb-100 flex items-center justify-between gap-200">
                                                    <p className="font-semibold text-foreground">24H Device Timeline</p>
                                                    <p className="text-100 text-muted-foreground">{cameraEvents.length} events</p>
                                                </div>

                                                {recentEventsError ? (
                                                    <p className="mb-100 text-100 text-destructive">Timeline unavailable: {recentEventsError}</p>
                                                ) : null}

                                                <div className="relative h-24 overflow-hidden rounded-md border border-border bg-muted/30">
                                                    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                                                        {thresholdTracePath ? (
                                                            <path
                                                                d={thresholdTracePath}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeDasharray="3 2"
                                                                className="text-foreground/70"
                                                                strokeWidth="1.5"
                                                            />
                                                        ) : null}
                                                    </svg>
                                                    <div className="absolute inset-x-0 bottom-0 border-t border-border/60" />
                                                    {cameraEvents.length === 0 ? (
                                                        <div className="absolute inset-0 flex items-center justify-center text-100 text-muted-foreground">
                                                            No events in the last 24 hours
                                                        </div>
                                                    ) : (
                                                        cameraEvents.map((eventRow, eventIndex) => {
                                                            const dotStyle = buildTimelineDotStyle(eventRow, cameraEvents, eventIndex, scaleMax);
                                                            const displacement = eventRow.peakToPeakDisplacement ?? 0;
                                                            const threshold = eventRow.peakToPeakDisplacementThreshold;

                                                            return (
                                                                <div
                                                                    key={`${eventRow.cameraId}-${eventRow.receivedAtUtc}-${eventIndex}`}
                                                                    className="group absolute"
                                                                    style={{ left: `${dotStyle.leftPercent}%`, bottom: `${dotStyle.bottomPercent}%`, transform: "translate(-50%, 50%)" }}
                                                                    title={`${formatDateTime(eventRow.receivedAtUtc, timeZone)} ${selectedTimeZoneLabel} • displacement ${formatDisplacement(eventRow.peakToPeakDisplacement)} • threshold ${formatDisplacement(threshold)}`}
                                                                >
                                                                    <span className={displacement >= (threshold ?? Number.POSITIVE_INFINITY)
                                                                        ? "block h-3 w-3 rounded-full bg-destructive shadow"
                                                                        : "block h-3 w-3 rounded-full bg-foreground shadow"
                                                                    } />
                                                                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-background px-100 py-50 text-100 text-foreground opacity-0 shadow group-hover:opacity-100">
                                                                        {formatDisplacement(displacement)} / {formatDisplacement(threshold)}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                                <div className="mt-100 flex items-center justify-between text-100 text-muted-foreground">
                                                    <span>24h ago</span>
                                                    <span>Now</span>
                                                </div>
                                            </div>
                                        );
                                    })() : null}
                                    {showDisplacementVisuals ? (() => {
                                        const cameraEvents = recentEventsByCamera[row.cameraId] ?? [];
                                        const histogramBins = buildDisplacementHistogramBins(cameraEvents);

                                        return (
                                            <div className="rounded-md border border-border bg-background/50 p-200">
                                                <p className="mb-100 font-semibold text-foreground">Displacement Histogram</p>
                                                <div className="h-36 overflow-auto rounded-sm border border-border/50 bg-muted/20">
                                                    {histogramBins.length === 0 ? (
                                                        <div className="flex h-full items-center justify-center text-100 text-muted-foreground">No events</div>
                                                    ) : (
                                                        <table className="w-full table-fixed text-[11px] leading-tight">
                                                            <thead className="bg-muted/30 text-left text-muted-foreground">
                                                                <tr>
                                                                    <th className="px-100 py-[1px] font-semibold">Displacement</th>
                                                                    <th className="px-100 py-[1px] text-right font-semibold">Count</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {histogramBins.map((item) => (
                                                                    <tr key={`${row.cameraId}-hist-row-${item.label}`} className="border-t border-border/40">
                                                                        <td className="px-100 py-[1px] text-foreground">{item.label}</td>
                                                                        <td className="px-100 py-[1px] text-right text-foreground">{item.count}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })() : null}
                                    <p>
                                        <span className="font-semibold">Base64 length:</span> {row.encodedPayloadLength}
                                    </p>
                                    <p>
                                        <span className="font-semibold">Decoded bytes:</span> {row.decodedPayloadLength ?? "unavailable"}
                                    </p>
                                    <p className={row.payloadLengthMatches ? "text-foreground" : "text-destructive"}>
                                        <span className="font-semibold">Decoded byte check:</span> {row.payloadLengthMatches ? "match" : "mismatch"}
                                    </p>
                                </div>
                            </article>
                                );
                            })()
                        ))}
                    </div>
                ) : null}

                {viewMode === "saved" ? (
                <section>
                    <div className="mb-300 flex items-center justify-between">
                        <h2 className="text-400 font-semibold text-foreground">Saved Image Notes</h2>
                        {isSavedLoading ? (
                            <span className="text-200 text-muted-foreground">Loading saved items...</span>
                        ) : null}
                    </div>

                    <div className="mb-300 grid grid-cols-1 gap-300 rounded-xl border bg-card p-400 md:grid-cols-[minmax(0,1.5fr)_minmax(0,260px)]">
                        <label className="flex flex-col gap-100 text-200 text-muted-foreground">
                            <span className="font-semibold text-foreground">Search all logs</span>
                            <input
                                value={savedLogSearch}
                                onChange={(event) => setSavedLogSearch(event.target.value)}
                                placeholder="Search note, camera, source, control, author, date..."
                                className="rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </label>

                        <label className="flex flex-col gap-100 text-200 text-muted-foreground">
                            <span className="font-semibold text-foreground">Camera</span>
                            <select
                                value={savedLogCameraFilter}
                                onChange={(event) => setSavedLogCameraFilter(event.target.value)}
                                className="rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="all">All cameras</option>
                                {savedCameraOptions.map((cameraId) => (
                                    <option key={cameraId} value={cameraId}>{cameraId}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {savedError ? (
                        <div className="mb-300 rounded-xl border border-destructive bg-destructive/10 p-300 text-200 text-destructive">
                            {savedError}
                        </div>
                    ) : null}

                    {!isSavedLoading && savedSnapshots.length === 0 ? (
                        <div className="rounded-xl border bg-card p-400 text-200 text-muted-foreground">
                            No saved images yet. Open a camera image and save it with your note.
                        </div>
                    ) : null}

                    {!isSavedLoading && savedSnapshots.length > 0 && filteredSavedSnapshots.length === 0 ? (
                        <div className="rounded-xl border bg-card p-400 text-200 text-muted-foreground">
                            No logs match the current filters.
                        </div>
                    ) : null}

                    {filteredSavedSnapshots.length > 0 ? (
                        <div className="space-y-400">
                            {filteredSavedSnapshots.map((item) => (
                                <article key={item.id} className="rounded-xl border bg-card p-300">
                                    <div className="grid grid-cols-1 gap-300 lg:grid-cols-[minmax(0,380px)_1fr]">
                                        <SnapshotImage
                                            base64={item.imagePayloadBase64}
                                            contentType={item.contentType}
                                            alt={`Saved camera ${item.cameraId} snapshot`}
                                            className="h-[260px] w-full rounded-md bg-muted object-contain"
                                        />
                                        <div className="space-y-100 text-200 text-foreground">
                                            <p><span className="font-semibold">Camera:</span> {item.cameraId}</p>
                                            <p><span className="font-semibold">Captured:</span> {formatDateTime(item.receivedAtUtc, timeZone)} {selectedTimeZoneLabel}</p>
                                            <p><span className="font-semibold">Added by:</span> {item.addedByName || "Unknown"}</p>
                                            <p><span className="font-semibold">Added at:</span> {formatDateTime(item.addedAt, timeZone)} {selectedTimeZoneLabel}</p>
                                            <div className="mt-200 rounded-md border border-border bg-muted/40 p-300">
                                                <p className="text-100 font-semibold uppercase tracking-wide text-muted-foreground">Note</p>
                                                <p className="mt-100 text-300 leading-relaxed text-foreground">
                                                    {item.note || "-"}
                                                </p>
                                            </div>
                                            <div className="pt-200">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const errorMessage = downloadSnapshotImage({
                                                            cameraId: item.cameraId,
                                                            receivedAtUtc: item.receivedAtUtc,
                                                            contentType: item.contentType,
                                                            imagePayloadBase64: item.imagePayloadBase64,
                                                        });
                                                        if (errorMessage) setPayloadError(errorMessage);
                                                    }}
                                                    className="rounded-md border border-border bg-background px-300 py-100 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                >
                                                    Download Image
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : null}
                </section>
                ) : null}

                {viewMode === "live" ? (
                    null
                ) : null}
            </section>

            {selectedRow ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-400">
                    <div className="max-h-[95vh] w-full max-w-[1200px] overflow-auto rounded-xl border bg-card p-400">
                        {pendingFrozenUpdates[selectedRow.cameraId] ? (
                            <div className="mb-300 rounded-md border border-amber-400 bg-amber-100/50 p-300 text-200 text-amber-900">
                                A newer image is available. This page will refresh when you return to the main page.
                            </div>
                        ) : null}

                        <div className="mb-300 flex items-center justify-between">
                            <h2 className="text-400 font-semibold text-foreground">
                                Camera {selectedRow.cameraId} - {formatDateTime(selectedRow.receivedAtUtc, timeZone)} {selectedTimeZoneLabel}
                            </h2>
                            <button
                                type="button"
                                onClick={closeDetails}
                                className="rounded-md border border-border bg-background px-300 py-100 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Close
                            </button>
                        </div>

                        {payloadLooksTruncated(selectedRow) ? (
                            <div className="mb-300 rounded-md border border-destructive bg-destructive/10 p-300 text-200 text-destructive">
                                This payload is incomplete, so it cannot be reliably previewed or saved.
                            </div>
                        ) : (
                            <SnapshotImage
                                base64={selectedRow.imagePayloadBase64}
                                contentType={selectedRow.contentType}
                                alt={`Camera ${selectedRow.cameraId} detail view`}
                                className="mb-300 h-[68vh] w-full rounded-md bg-muted object-contain"
                            />
                        )}

                        <div className="text-200 text-muted-foreground">
                            <p><span className="font-semibold text-foreground">Added by:</span> {currentUserDisplayName}</p>
                            <p>Download the selected image or save it with notes.</p>
                        </div>

                        <label className="mt-300 flex flex-col gap-100 text-200 text-foreground">
                            <span className="font-semibold">Notes</span>
                            <textarea
                                value={saveNote}
                                onChange={(event) => setSaveNote(event.target.value)}
                                placeholder="Add your notes for this image"
                                className="min-h-[120px] rounded-md border border-border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                        </label>

                        <div className="mt-300 flex flex-wrap gap-200">
                            <button
                                type="button"
                                onClick={handleDownloadSelected}
                                className="rounded-md border border-border bg-background px-300 py-200 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                Download Selected Image
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleSaveSelected()}
                                disabled={isSaving || payloadLooksTruncated(selectedRow)}
                                className="rounded-md border border-border bg-foreground px-300 py-200 text-200 font-semibold text-background disabled:opacity-60"
                            >
                                {isSaving ? "Saving..." : "Save To Notes List"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    );
}
