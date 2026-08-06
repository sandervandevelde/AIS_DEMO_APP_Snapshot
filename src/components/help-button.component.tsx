import { HelpCircle } from "lucide-react";

interface HelpButtonProps {
    onClick: () => void;
}

export function HelpButton({ onClick }: HelpButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-lg border border-border bg-card px-300 py-200 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open help"
            title="Help"
        >
            <span className="inline-flex items-center gap-200">
                <HelpCircle className="h-4 w-4" />
                Help
            </span>
        </button>
    );
}
