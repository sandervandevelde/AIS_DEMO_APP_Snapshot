import { FormEvent, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/auth.context";
import {
    completeAppProposal,
    createAppProposal,
    deleteAppProposal,
    listAppProposals,
    undoCompleteAppProposal,
    type AppProposalRecord,
} from "@/services/app-proposals.service";

type ProposalPriority = "low" | "medium" | "high";

function formatUtc(utcText: string): string {
    const parsed = new Date(utcText);
    if (Number.isNaN(parsed.getTime())) {
        return utcText;
    }

    return parsed.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "UTC",
    });
}

function normalizeSearchText(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

function buildProposalSearchText(item: AppProposalRecord): string {
    return [
        item.id,
        item.priority,
        item.title,
        item.description,
        item.proposedAt,
        item.proposedByName,
        item.proposedByEmail ?? "",
        item.completed ? "completed" : "open",
        item.completedAt ?? "",
        item.completedByName ?? "",
        item.completedByEmail ?? "",
    ].map(normalizeSearchText).join(" ");
}

export function AppProposals() {
    const { session } = useAuth();
    const currentUserId = session?.user?.id ?? "";
    const currentUserDisplayName = session?.user?.email ?? "Unknown";
    const currentUserEmail = session?.user?.email ?? undefined;

    const [proposals, setProposals] = useState<AppProposalRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [proposalError, setProposalError] = useState<string | null>(null);
    const [proposalPriority, setProposalPriority] = useState<ProposalPriority>("medium");
    const [proposalTitle, setProposalTitle] = useState("");
    const [proposalDescription, setProposalDescription] = useState("");
    const [hideCompleted, setHideCompleted] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [selectedPriorities, setSelectedPriorities] = useState<Record<ProposalPriority, boolean>>({
        low: true,
        medium: true,
        high: true,
    });

    async function refreshProposals(): Promise<void> {
        if (!currentUserId) {
            setProposals([]);
            return;
        }

        setIsLoading(true);
        setProposalError(null);

        try {
            const items = await listAppProposals(currentUserId);
            setProposals(items);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setProposalError(message);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        void refreshProposals();
    }, [currentUserId]);

    const filteredProposals = useMemo(() => {
        const search = searchText.trim().toLowerCase();

        return proposals.filter((proposal) => {
            if (hideCompleted && proposal.completed) {
                return false;
            }

            if (!selectedPriorities[proposal.priority]) {
                return false;
            }

            if (!search) {
                return true;
            }

            return buildProposalSearchText(proposal).includes(search);
        });
    }, [hideCompleted, proposals, searchText, selectedPriorities]);

    function togglePriorityFilter(priority: ProposalPriority, enabled: boolean): void {
        setSelectedPriorities((current) => {
            const next = {
                ...current,
                [priority]: enabled,
            };

            if (!next.low && !next.medium && !next.high) {
                return {
                    ...current,
                    [priority]: true,
                };
            }

            return next;
        });
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();

        if (!currentUserId) {
            setProposalError("Cannot submit a proposal because user identity is missing.");
            return;
        }

        if (!proposalTitle.trim() || !proposalDescription.trim()) {
            setProposalError("Please provide both a title and a description.");
            return;
        }

        setIsSubmitting(true);
        setProposalError(null);

        try {
            await createAppProposal({
                priority: proposalPriority,
                title: proposalTitle,
                description: proposalDescription,
                proposedByName: currentUserDisplayName,
                proposedByEmail: currentUserEmail,
                userId: currentUserId,
            });

            setProposalPriority("medium");
            setProposalTitle("");
            setProposalDescription("");
            await refreshProposals();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setProposalError(message);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleMarkCompleted(proposalId: string): Promise<void> {
        if (!currentUserId) {
            setProposalError("Cannot mark a proposal complete because user identity is missing.");
            return;
        }

        setIsLoading(true);
        setProposalError(null);

        try {
            await completeAppProposal({
                id: proposalId,
                completedByName: currentUserDisplayName,
                completedByEmail: currentUserEmail,
                userId: currentUserId,
            });

            await refreshProposals();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setProposalError(message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUndoCompleted(proposalId: string): Promise<void> {
        if (!currentUserId) {
            setProposalError("Cannot reopen a proposal because user identity is missing.");
            return;
        }

        setIsLoading(true);
        setProposalError(null);

        try {
            await undoCompleteAppProposal({
                id: proposalId,
                userId: currentUserId,
            });

            await refreshProposals();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setProposalError(message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteProposal(proposalId: string): Promise<void> {
        if (!currentUserId) {
            setProposalError("Cannot delete a proposal because user identity is missing.");
            return;
        }

        const approved = window.confirm("Delete this proposal entry permanently?");
        if (!approved) return;

        setIsLoading(true);
        setProposalError(null);

        try {
            await deleteAppProposal({
                id: proposalId,
                userId: currentUserId,
            });

            await refreshProposals();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setProposalError(message);
        } finally {
            setIsLoading(false);
        }
    }

    if (!currentUserId) {
        return (
            <main className="min-h-full bg-background">
                <section className="mx-auto max-w-[1200px] p-600">
                    <div className="rounded-xl border bg-card p-500 text-300 text-muted-foreground">
                        Sign in to log and manage app proposals.
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="min-h-full bg-background">
            <section className="mx-auto max-w-[1200px] p-600">
                <div className="mb-500 rounded-xl border bg-card p-500">
                    <h2 className="text-500 font-semibold text-foreground">App Proposals</h2>
                    <p className="mt-100 text-200 text-muted-foreground">
                        Log feature ideas with a timestamp and your identity, then mark them complete when they are done.
                    </p>
                </div>

                <div className="mb-500 grid grid-cols-1 gap-400 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <form onSubmit={(event) => void handleSubmit(event)} className="rounded-xl border bg-card p-400">
                        <h3 className="text-300 font-semibold text-foreground">New Proposal</h3>
                        <div className="mt-300 grid grid-cols-1 gap-300">
                            <label className="flex flex-col gap-100 text-200 text-muted-foreground">
                                <span className="font-semibold text-foreground">Title</span>
                                <input
                                    value={proposalTitle}
                                    onChange={(event) => setProposalTitle(event.target.value)}
                                    placeholder="Short feature title"
                                    className="rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </label>
                            <label className="flex flex-col gap-100 text-200 text-muted-foreground">
                                <span className="font-semibold text-foreground">Priority</span>
                                <select
                                    value={proposalPriority}
                                    onChange={(event) => setProposalPriority(event.target.value as ProposalPriority)}
                                    className="rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-100 text-200 text-muted-foreground">
                                <span className="font-semibold text-foreground">Description</span>
                                <textarea
                                    value={proposalDescription}
                                    onChange={(event) => setProposalDescription(event.target.value)}
                                    placeholder="Describe the feature, why it matters, and any notes for delivery"
                                    className="min-h-[140px] rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </label>
                            <div className="rounded-lg border border-border bg-muted/40 p-300 text-200 text-muted-foreground">
                                <p><span className="font-semibold text-foreground">Proposed by:</span> {currentUserDisplayName}</p>
                                <p><span className="font-semibold text-foreground">Proposed at:</span> auto-generated when you submit</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-200">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="rounded-md border border-border bg-foreground px-300 py-200 text-200 font-semibold text-background disabled:opacity-60"
                                >
                                    {isSubmitting ? "Saving..." : "Add Proposal"}
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="rounded-xl border bg-card p-400">
                        <h3 className="text-300 font-semibold text-foreground">Filters</h3>
                        <div className="mt-300 space-y-300">
                            <label className="flex flex-col gap-100 text-200 text-muted-foreground">
                                <span className="font-semibold text-foreground">Search all fields</span>
                                <input
                                    value={searchText}
                                    onChange={(event) => setSearchText(event.target.value)}
                                    placeholder="Search title, description, user, dates, status..."
                                    className="rounded-lg border bg-background px-300 py-200 text-200 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </label>

                            <div className="space-y-100">
                                <p className="font-semibold text-foreground">Priorities</p>
                                <div className="flex flex-wrap items-center gap-300 text-200 text-muted-foreground">
                                    <label className="flex items-center gap-200">
                                        <input
                                            type="checkbox"
                                            checked={selectedPriorities.low}
                                            onChange={(event) => togglePriorityFilter("low", event.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        Low
                                    </label>
                                    <label className="flex items-center gap-200">
                                        <input
                                            type="checkbox"
                                            checked={selectedPriorities.medium}
                                            onChange={(event) => togglePriorityFilter("medium", event.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        Medium
                                    </label>
                                    <label className="flex items-center gap-200">
                                        <input
                                            type="checkbox"
                                            checked={selectedPriorities.high}
                                            onChange={(event) => togglePriorityFilter("high", event.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        High
                                    </label>
                                </div>
                            </div>

                            <label className="flex items-center gap-200 text-200 text-muted-foreground">
                                <input
                                    type="checkbox"
                                    checked={hideCompleted}
                                    onChange={(event) => setHideCompleted(event.target.checked)}
                                    className="h-4 w-4"
                                />
                                Hide completed proposals
                            </label>

                            <div className="rounded-lg border border-border bg-muted/30 p-300 text-200 text-muted-foreground">
                                <p><span className="font-semibold text-foreground">Total:</span> {proposals.length}</p>
                                <p><span className="font-semibold text-foreground">Visible:</span> {filteredProposals.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {proposalError ? (
                    <div className="mb-300 rounded-xl border border-destructive bg-destructive/10 p-400 text-300 text-destructive">
                        {proposalError}
                    </div>
                ) : null}

                {isLoading && proposals.length === 0 ? (
                    <div className="rounded-xl border bg-card p-500 text-300 text-muted-foreground">
                        Loading proposals...
                    </div>
                ) : null}

                {!isLoading && proposals.length === 0 ? (
                    <div className="rounded-xl border bg-card p-500 text-300 text-muted-foreground">
                        No proposals have been logged yet.
                    </div>
                ) : null}

                {!isLoading && proposals.length > 0 && filteredProposals.length === 0 ? (
                    <div className="rounded-xl border bg-card p-500 text-300 text-muted-foreground">
                        No proposals match the current filters.
                    </div>
                ) : null}

                {filteredProposals.length > 0 ? (
                    <div className="space-y-400">
                        {filteredProposals.map((proposal) => (
                            <article key={proposal.id} className="rounded-xl border bg-card p-400">
                                <div className="flex flex-wrap items-start justify-between gap-300">
                                    <div className="space-y-100">
                                        <h3 className="text-400 font-semibold text-foreground">{proposal.title}</h3>
                                        <p className="text-200 text-muted-foreground">{proposal.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-100">
                                        <div className={proposal.completed ? "rounded-full bg-emerald-100 px-200 py-100 text-100 font-semibold text-emerald-900" : "rounded-full bg-amber-100 px-200 py-100 text-100 font-semibold text-amber-900"}>
                                            {proposal.completed ? "Completed" : "Open"}
                                        </div>
                                        <div className="rounded-full border border-border bg-background px-200 py-100 text-100 font-semibold text-foreground">
                                            Priority: {proposal.priority}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-300 grid grid-cols-1 gap-200 text-200 text-foreground md:grid-cols-2">
                                    <p><span className="font-semibold">Proposed at:</span> {formatUtc(proposal.proposedAt)}</p>
                                    <p><span className="font-semibold">Proposed by:</span> {proposal.proposedByName || "Unknown"}</p>
                                    {proposal.completed ? (
                                        <>
                                            <p><span className="font-semibold">Completed at:</span> {proposal.completedAt ? formatUtc(proposal.completedAt) : "-"}</p>
                                            <p><span className="font-semibold">Completed by:</span> {proposal.completedByName || "-"}</p>
                                        </>
                                    ) : null}
                                </div>

                                <div className="mt-300 flex flex-wrap gap-200">
                                    {!proposal.completed ? (
                                        <button
                                            type="button"
                                            onClick={() => void handleMarkCompleted(proposal.id)}
                                            className="rounded-md border border-border bg-background px-300 py-200 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            Mark Completed
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => void handleUndoCompleted(proposal.id)}
                                            className="rounded-md border border-border bg-background px-300 py-200 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            Undo Completed
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => void handleDeleteProposal(proposal.id)}
                                        className="rounded-md border border-destructive/40 bg-destructive/10 px-300 py-200 text-200 font-semibold text-destructive hover:bg-destructive/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : null}
            </section>
        </main>
    );
}
