import { X } from "lucide-react";

interface HelpModalProps {
    open: boolean;
    onClose: () => void;
}

function SectionTitle({ children }: { children: string }) {
    return <h2 className="text-300 font-semibold text-foreground">{children}</h2>;
}

function SubTitle({ children }: { children: string }) {
    return <h3 className="text-200 font-semibold text-foreground">{children}</h3>;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-400">
            <div className="max-h-[92vh] w-full max-w-[1100px] overflow-auto rounded-xl border bg-card p-500 shadow-2xl">
                <div className="mb-400 flex items-start justify-between gap-300 border-b border-border pb-300">
                    <div>
                        <h1 className="text-500 font-semibold tracking-tight text-foreground">Vibration Alert Triage User Manual</h1>
                        <p className="mt-100 text-200 text-muted-foreground">Help is always available from the top bar.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-border bg-background p-200 text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Close help"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="space-y-400 text-200 text-foreground">
                    <section className="space-y-200">
                        <SectionTitle>1. Purpose</SectionTitle>
                        <p>This app helps you monitor live camera snapshots, inspect vibration-related values over time, save important images with notes, and capture future improvement ideas in one place.</p>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>2. Main Screen Overview</SectionTitle>
                        <p>At the top of the app, you will find:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Vibration Alert Triage title and subtitle</li>
                            <li>View switch</li>
                            <li>Live Images</li>
                            <li>Saved Image Notes</li>
                            <li>App Proposals</li>
                            <li>Dark mode / Light mode toggle</li>
                            <li>Help button with the full manual</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>3. View Modes</SectionTitle>
                        <div className="space-y-200">
                            <SubTitle>Live Images</SubTitle>
                            <p>Use this mode for real-time monitoring.</p>
                            <p>You will see:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>A live status panel with last refresh time</li>
                                <li>Countdown to next refresh</li>
                                <li>Refresh interval selector</li>
                                <li>Guidance about automatic refresh and freeze behavior</li>
                                <li>Camera cards for each available camera snapshot</li>
                                <li>A shared toggle to show or hide displacement visuals</li>
                                <li>A displacement mini chart on each camera card</li>
                                <li>A small displacement histogram next to the mini chart</li>
                                <li>A 24-hour device timeline on each camera card</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>Saved Image Notes</SubTitle>
                            <p>Use this mode to review previously saved snapshots and annotations.</p>
                            <p>You will see:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Saved image cards</li>
                                <li>Capture metadata</li>
                                <li>Author and save time</li>
                                <li>Download action</li>
                                <li>Prominent note text area</li>
                                <li>Search and camera filters</li>
                                <li>Search across saved note content and metadata</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>App Proposals</SubTitle>
                            <p>Use this mode to log and manage feature ideas.</p>
                            <p>You will see:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Proposal entry form</li>
                                <li>Priority selector</li>
                                <li>Search, hide-completed, and multi-priority filters</li>
                                <li>Open and completed proposal cards</li>
                                <li>Mark completed, undo completed, and delete actions</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>4. Live Monitoring Features</SectionTitle>
                        <div className="space-y-200">
                            <SubTitle>Automatic Refresh</SubTitle>
                            <p>The app refreshes live data continuously.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>You can set refresh frequency with the Refresh every selector.</li>
                                <li>A countdown shows how many seconds remain until the next update.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>Image Age Stopwatch</SubTitle>
                            <p>Each camera card shows how old the current image is.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Format is mm:ss for under one hour.</li>
                                <li>Format changes to hh:mm:ss for one hour or more.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>Universal Namespace Panel</SubTitle>
                            <p>Each camera card shows Universal Namespace in the main device details area.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>It is derived from the CONTROL value.</li>
                                <li>CONTROL is split by slash characters.</li>
                                <li>The resulting namespace parts are shown in a readable sequence.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>Show / Hide Displacement Visuals</SubTitle>
                            <p>Each camera card has a visuals toggle in the card header.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>The toggle applies to all camera cards at once.</li>
                                <li>Your last choice is remembered and reused after refresh or reopen.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>Displacement Mini Chart</SubTitle>
                            <p>Each card shows a compact displacement visual panel.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>The bar fill represents current displacement.</li>
                                <li>A marker line represents threshold.</li>
                                <li>The numeric readout shows current and threshold values.</li>
                                <li>Over-threshold conditions are highlighted.</li>
                                <li>A small histogram summarizes recent displacement distribution.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>24H Device Timeline</SubTitle>
                            <p>Each live card includes an in-memory timeline of received events from the last 24 hours.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Each event appears as a single dot, even when the source row is chunked.</li>
                                <li>The horizontal position reflects when the event arrived in the last 24 hours.</li>
                                <li>The vertical position reflects the event displacement.</li>
                                <li>A dashed threshold trace follows the changing threshold value over time.</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>5. Freeze Behavior</SectionTitle>
                        <div className="space-y-200">
                            <SubTitle>Manual Freeze</SubTitle>
                            <p>Each camera card has a Freeze checkbox.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>When enabled, that camera image stays fixed.</li>
                                <li>Other cameras continue updating normally.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>Update While Frozen</SubTitle>
                            <p>If a new image arrives while a panel is frozen:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Freeze text becomes bold.</li>
                                <li>An update indicator appears: Update ready, unfreeze to apply</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>Unfreeze Behavior</SubTitle>
                            <p>When you unfreeze:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>The newest available image is applied immediately.</li>
                                <li>You do not need to wait for another refresh cycle.</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>6. Details Dialog</SectionTitle>
                        <p>Open by selecting Details on a camera card.</p>
                        <p>What you can do:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>View a larger version of the image</li>
                            <li>Download the selected image</li>
                            <li>Enter a note</li>
                            <li>Save to notes list</li>
                        </ol>
                        <div className="space-y-200">
                            <SubTitle>Automatic Freeze on Open</SubTitle>
                            <p>When Details opens for a camera:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>That camera is automatically frozen</li>
                                <li>This keeps the viewed image stable while inspecting details</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>New Image During Details</SubTitle>
                            <p>If a new image arrives while Details is open:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>You get a notice that a newer image is available</li>
                                <li>On closing Details, the main panel refreshes to the newest image automatically</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle>Added By Field</SubTitle>
                            <p>The author is read-only.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>It uses your signed-in identity</li>
                                <li>There is no editable name textbox</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>7. Saving Notes</SectionTitle>
                        <p>When saving from Details:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>The image snapshot is stored</li>
                            <li>Your note is stored</li>
                            <li>Author and timestamp are stored</li>
                            <li>Saved entries appear in Saved Image Notes view</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>8. Downloading Images</SectionTitle>
                        <p>You can download images from:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Details dialog in Live Images mode</li>
                            <li>Each card in Saved Image Notes mode</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>9. Data Integrity and Warnings</SectionTitle>
                        <p>If payload validation fails:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>The app may show decode or truncation warnings</li>
                            <li>Unreliable images are not rendered as normal snapshots</li>
                            <li>Save action is blocked for known incomplete payloads</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>10. App Proposals</SectionTitle>
                        <p>The proposals tab is used to collect future feature ideas and track their status.</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Create a proposal with a title, description, and priority.</li>
                            <li>Filter the visible list by selecting one or more priority levels.</li>
                            <li>Mark proposals completed when work is done.</li>
                            <li>Undo completion if the item needs to be reopened.</li>
                            <li>Delete proposal items you no longer want to keep.</li>
                            <li>Use search and hide-completed to focus on the active backlog.</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>11. Recommended Workflow</SectionTitle>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Start in Live Images view</li>
                            <li>Freeze a camera when you spot an interesting event</li>
                            <li>Open Details for close inspection</li>
                            <li>Add note and save</li>
                            <li>Review the 24-hour timeline and displacement chart for event patterns</li>
                            <li>Switch to Saved Image Notes for comparison and reporting</li>
                            <li>Use App Proposals to log future improvements</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>12. Troubleshooting Tips</SectionTitle>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>No live cards visible: Switch to Live Images view and wait one refresh cycle.</li>
                            <li>No saved items visible: Switch to Saved Image Notes and confirm at least one saved entry exists.</li>
                            <li>Freeze is bold with update indicator: Unfreeze to apply the new image.</li>
                            <li>Image not shown: Check for payload mismatch/truncation warnings in the card or dialog.</li>
                            <li>Timeline shows no events: Confirm the semantic model has recent rows for the selected camera.</li>
                            <li>Timeline or histogram looks sparse: That can happen when events are filtered by the 24-hour window or when many chunks collapse to one event.</li>
                        </ol>
                    </section>
                </div>
            </div>
        </div>
    );
}
