import { getRayfinClient } from "@/lib/rayfin-client";

export interface CreateAppProposalInput {
    priority: "low" | "medium" | "high";
    title: string;
    description: string;
    proposedByName: string;
    proposedByEmail?: string;
    userId: string;
}

export interface AppProposalRecord {
    id: string;
    priority: "low" | "medium" | "high";
    title: string;
    description: string;
    proposedAt: string;
    proposedByName: string;
    proposedByEmail?: string;
    completed: boolean;
    completedAt?: string;
    completedByName?: string;
    completedByEmail?: string;
}

export interface CompleteAppProposalInput {
    id: string;
    completedByName: string;
    completedByEmail?: string;
    userId: string;
}

export interface UndoCompleteAppProposalInput {
    id: string;
    userId: string;
}

export interface DeleteAppProposalInput {
    id: string;
    userId: string;
}

function normalizeText(value: unknown): string {
    return String(value ?? "").trim();
}

export async function listAppProposals(userId: string): Promise<AppProposalRecord[]> {
    const client = getRayfinClient();
    const entries = await client.data.AppProposalEntry
        .select([
            "id",
            "priority",
            "title",
            "description",
            "proposedAt",
            "proposedByName",
            "proposedByEmail",
            "completed",
            "completedAt",
            "completedByName",
            "completedByEmail",
        ])
        .where({ user_id: { eq: userId } })
        .orderBy({ completed: "asc", priority: "desc", proposedAt: "desc" })
        .execute();

    return entries.map((entry) => ({
        id: String(entry.id),
        priority: (entry.priority as "low" | "medium" | "high" | undefined) ?? "medium",
        title: String(entry.title ?? ""),
        description: String(entry.description ?? ""),
        proposedAt: String(entry.proposedAt ?? ""),
        proposedByName: String(entry.proposedByName ?? ""),
        proposedByEmail: entry.proposedByEmail ? String(entry.proposedByEmail) : undefined,
        completed: Boolean(entry.completed),
        completedAt: entry.completedAt ? String(entry.completedAt) : undefined,
        completedByName: entry.completedByName ? String(entry.completedByName) : undefined,
        completedByEmail: entry.completedByEmail ? String(entry.completedByEmail) : undefined,
    } satisfies AppProposalRecord));
}

export async function createAppProposal(input: CreateAppProposalInput): Promise<void> {
    const client = getRayfinClient();
    await client.data.AppProposalEntry.create({
        priority: input.priority,
        title: normalizeText(input.title),
        description: normalizeText(input.description),
        proposedAt: new Date(),
        proposedByName: normalizeText(input.proposedByName),
        proposedByEmail: input.proposedByEmail || null,
        completed: false,
        completedAt: null,
        completedByName: null,
        completedByEmail: null,
        user_id: input.userId,
    });
}

export async function completeAppProposal(input: CompleteAppProposalInput): Promise<void> {
    const client = getRayfinClient();
    await client.data.AppProposalEntry.update(
        { id: input.id },
        {
            completed: true,
            completedAt: new Date(),
            completedByName: normalizeText(input.completedByName),
            completedByEmail: input.completedByEmail || null,
        },
    );
}

export async function undoCompleteAppProposal(input: UndoCompleteAppProposalInput): Promise<void> {
    const client = getRayfinClient();
    await client.data.AppProposalEntry.update(
        { id: input.id },
        {
            completed: false,
            completedAt: null,
            completedByName: null,
            completedByEmail: null,
        },
    );
}

export async function deleteAppProposal(input: DeleteAppProposalInput): Promise<void> {
    const client = getRayfinClient();
    await client.data.AppProposalEntry.delete({ id: input.id });
}
