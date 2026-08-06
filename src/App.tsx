//-----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
//        Copyright (c) Microsoft Corporation.  All rights reserved.
//        Licensed under the MIT license. See LICENSE file in the project root for full license information.
// </copyright>
//-----------------------------------------------------------------------

import { useState } from "react";

import { AppProposals } from "@/components/app-proposals.component";
import { HelpButton } from "@/components/help-button.component";
import { HelpModal } from "@/components/help-modal.component";
import { SnapshotGallery, type GalleryViewMode } from "@/components/snapshot-gallery.component";
import { useThemeContext } from "@/hooks/theme.context";

type AppViewMode = GalleryViewMode | "proposals";

function App() {
    const { isDark, toggleTheme } = useThemeContext();
    const [viewMode, setViewMode] = useState<AppViewMode>("live");
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    return (
        <div className="flex min-h-full flex-col bg-background">
            <header className="flex items-center justify-between border-b border-border px-600 py-400">
                <div>
                    <button
                        type="button"
                        onClick={() => setViewMode("live")}
                        className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Go to live images view"
                    >
                        <h1 className="text-600 leading-600 font-semibold text-foreground hover:underline">
                            Vibration Alert Triage
                        </h1>
                    </button>
                    <p className="text-200 text-muted-foreground">
                        Live panels showing snapshots taken from local IP cameras via RTPS protocol powered by Azure IoT Operations
                    </p>
                </div>
                <div className="flex items-center gap-200">
                    <HelpButton onClick={() => setIsHelpOpen(true)} />

                    <div className="inline-flex rounded-lg border border-border bg-card p-100">
                        <button
                            type="button"
                            onClick={() => setViewMode("live")}
                            className={viewMode === "live"
                                ? "rounded-md bg-foreground px-300 py-100 text-200 font-semibold text-background"
                                : "rounded-md px-300 py-100 text-200 font-semibold text-foreground hover:bg-accent"
                            }
                        >
                            Live Images
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("saved")}
                            className={viewMode === "saved"
                                ? "rounded-md bg-foreground px-300 py-100 text-200 font-semibold text-background"
                                : "rounded-md px-300 py-100 text-200 font-semibold text-foreground hover:bg-accent"
                            }
                        >
                            Saved Image Notes
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("proposals")}
                            className={viewMode === "proposals"
                                ? "rounded-md bg-foreground px-300 py-100 text-200 font-semibold text-background"
                                : "rounded-md px-300 py-100 text-200 font-semibold text-foreground hover:bg-accent"
                            }
                        >
                            App Proposals
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="rounded-lg border border-border bg-card px-300 py-200 text-200 font-semibold text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {isDark ? "Light mode" : "Dark mode"}
                    </button>
                </div>
            </header>
            {viewMode === "proposals" ? (
                <AppProposals />
            ) : (
                <SnapshotGallery viewMode={viewMode} />
            )}

            <HelpModal open={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>
    );
}

export default App;
