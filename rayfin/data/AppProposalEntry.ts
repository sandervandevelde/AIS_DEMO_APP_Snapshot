import { entity, authenticated, boolean, date, set, text } from "@microsoft/rayfin-core";

@entity()
@authenticated("*", {
    policy: (claims, item) => claims.sub.eq(item.user_id),
})
export class AppProposalEntry {
    @set("low", "medium", "high")
    priority!: "low" | "medium" | "high";

    @text({ max: 200 })
    title!: string;

    @text({ max: 4000 })
    description!: string;

    @date()
    proposedAt!: Date;

    @text({ max: 200 })
    proposedByName!: string;

    @text({ optional: true, max: 320 })
    proposedByEmail?: string;

    @boolean()
    completed!: boolean;

    @date({ optional: true })
    completedAt?: Date;

    @text({ optional: true, max: 200 })
    completedByName?: string;

    @text({ optional: true, max: 320 })
    completedByEmail?: string;

    @text({ max: 200 })
    user_id!: string;
}
