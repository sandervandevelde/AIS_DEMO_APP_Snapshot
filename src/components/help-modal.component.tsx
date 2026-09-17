import type { LucideIcon } from "lucide-react";
import {
    BarChart3,
    Bell,
    Clock3,
    Eye,
    FileImage,
    Globe2,
    Image,
    Lightbulb,
    Maximize2,
    Network,
    RefreshCw,
    Snowflake,
    Table2,
    Timer,
    UserRound,
    X,
} from "lucide-react";

interface HelpModalProps {
    open: boolean;
    onClose: () => void;
}

function SectionTitle({ children }: { children: string }) {
    return <h2 className="text-300 font-semibold text-foreground">{children}</h2>;
}

function SubTitle({ children, icon: Icon }: { children: string; icon?: LucideIcon }) {
    return (
        <h3 className="inline-flex items-center gap-100 text-200 font-semibold text-foreground">
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
            {children}
        </h3>
    );
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
                        <p>The app is intended to run inside the Microsoft Fabric portal. You must be signed in through Fabric to access the live and saved data. Opening the app directly outside Fabric shows an access message instead of the monitoring workspace.</p>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>2. Main Screen Overview</SectionTitle>
                        <p>At the top of the app, you will find:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Vibration Alert Triage title and subtitle</li>
                            <li>Clickable title that returns you to Live Images</li>
                            <li>View switch</li>
                            <li>Live Images</li>
                            <li>Saved Image Notes</li>
                            <li>App Proposals</li>
                            <li>Dark mode / Light mode toggle</li>
                            <li>Help button with the full manual</li>
                        </ol>
                        <p>The Help button opens this manual, and the selected light or dark theme is used throughout the interface.</p>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>3. View Modes</SectionTitle>
                        <div className="space-y-200">
                            <SubTitle icon={Image}>Live Images</SubTitle>
                            <p>Use this mode for real-time monitoring.</p>
                            <p>You will see:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>A live status panel with last refresh time</li>
                                <li>Countdown to the next refresh</li>
                                <li>Timezone selector</li>
                                <li>Refresh interval selector</li>
                                <li>Guidance about automatic refresh and freeze behavior</li>
                                <li>Camera cards for each available camera snapshot</li>
                                <li>A shared Show displacement / Hide displacement toggle</li>
                                <li>Camera metadata including source, control namespace, image size, and chunk count</li>
                                <li>Payload validation status, including Base64 length, decoded bytes, and match or mismatch</li>
                                <li>A displacement mini panel on each camera card when visuals are shown</li>
                                <li>A 24-hour device timeline on each camera card when visuals are shown</li>
                                <li>A displacement histogram on each camera card when visuals are shown</li>
                                <li>Per-camera hide controls and restore controls for hidden cameras</li>
                            </ol>
                            <p>Camera labels use the Building, Line, and Sensor parts of the Universal Namespace, separated with `/`. If those UNS parts are unavailable, the numeric camera ID is shown as a fallback.</p>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={FileImage}>Saved Image Notes</SubTitle>
                            <p>Use this mode to review previously saved snapshots and annotations.</p>
                            <p>You will see:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Saved image cards</li>
                                <li>Capture metadata</li>
                                <li>Author and save time</li>
                                <li>Saved displacement and threshold values</li>
                                <li>Full Universal Namespace value</li>
                                <li>Timezone selector</li>
                                <li>Download action on each card</li>
                                <li>Prominent note text area</li>
                                <li>Search across note content and saved metadata</li>
                                <li>Camera filter showing only cameras that are currently visible on the main page</li>
                                <li>Items per page controls with 5, 10, 15, 20, or All options</li>
                                <li>Previous and Next pagination controls with the current result range and total count</li>
                                <li>Read-only details dialog for saved log items</li>
                            </ol>
                            <p>The selected page size is exclusive: exactly one option is active at a time. Changing the search text, camera filter, or page size returns the list to page 1.</p>
                            <p>The camera filter and saved cards use only cameras that are currently visible on the main page. Hiding a camera removes its saved records from this view until the camera is shown again.</p>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Lightbulb}>App Proposals</SubTitle>
                            <p>Use this mode to log and manage feature ideas.</p>
                            <p>You will see:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Proposal entry form</li>
                                <li>Priority selector</li>
                                <li>Search across proposal fields, identity, dates, and status</li>
                                <li>Hide-completed and multi-priority filters</li>
                                <li>Total and visible item counts</li>
                                <li>Open and completed proposal cards</li>
                                <li>Mark completed, undo completed, and delete actions</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>4. Live Monitoring Features</SectionTitle>
                        <div className="space-y-200">
                            <SubTitle icon={RefreshCw}>Automatic Refresh</SubTitle>
                            <p>The app refreshes live data continuously.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>You can set refresh frequency to 10 seconds, 30 seconds, 60 seconds, 5 minutes, 15 minutes, or 30 minutes with the Refresh every selector.</li>
                                <li>A countdown shows how many seconds remain until the next update.</li>
                                <li>Last refresh time is shown in the selected timezone.</li>
                                <li>The live view shows loading, empty, and error states when usable semantic-model data is unavailable.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Globe2}>Timezone Handling</SubTitle>
                            <p>All source timestamps come in as UTC, but the app can display them in your preferred timezone.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>The timezone selector defaults to CET (UTC+01:00).</li>
                                <li>Your timezone choice is remembered for the next visit.</li>
                                <li>Displayed dates and times are converted to the selected timezone.</li>
                                <li>Image age remains correct because age is calculated from the original UTC timestamp.</li>
                                <li>The selector provides 24 fixed UTC-offset choices from UTC-12:00 through UTC+11:00, including UTC+00:00 (UTC). Each option includes a conventional abbreviation, such as UTC+01:00 (CET). The numeric offset is authoritative because abbreviations can vary by region.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Timer}>Image Age Stopwatch</SubTitle>
                            <p>Each camera card shows how old the current image is.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Format is mm:ss for under one hour.</li>
                                <li>Format changes to hh:mm:ss for one hour or more.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Network}>Universal Namespace Panel</SubTitle>
                            <p>Each camera card shows Universal Namespace in the main device details area.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>It is derived from the CONTROL value.</li>
                                <li>CONTROL is split by slash characters.</li>
                                <li>The resulting namespace parts are shown as Company, Country, City, Building, Line, and Sensor.</li>
                                <li>The camera's primary label is the combined Building/Line/Sensor value so the same physical camera is recognizable across views.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Eye}>Show / Hide Displacement Visuals</SubTitle>
                            <p>Each camera card has a visuals toggle in the card header.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>The default first-load button label is Show displacement, which means the extra visuals start hidden until you open them.</li>
                                <li>The toggle applies to all camera cards at once.</li>
                                <li>Your last choice is remembered and reused after refresh or reopen.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={BarChart3}>Displacement Mini Chart</SubTitle>
                            <p>Each card shows a compact displacement visual panel.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>The bar fill represents current displacement.</li>
                                <li>A marker line represents threshold.</li>
                                <li>The numeric readout shows current and threshold values.</li>
                                <li>Over-threshold conditions are highlighted.</li>
                                <li>Missing displacement values are shown as unavailable rather than treated as valid measurements.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Table2}>Displacement Histogram</SubTitle>
                            <p>Each card also shows a compact summary table for recent displacement values.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>The table has two columns: Displacement and Count.</li>
                                <li>Counts are grouped by rounded displacement value.</li>
                                <li>The table uses the same compact panel height as the other displacement visuals.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Clock3}>24H Device Timeline</SubTitle>
                            <p>Each live card includes an in-memory timeline of received events from the last 24 hours.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Each event appears as a single dot, even when the source row is chunked.</li>
                                <li>The horizontal position reflects when the event arrived in the last 24 hours.</li>
                                <li>The vertical position reflects the event displacement.</li>
                                <li>A dashed threshold trace follows the changing threshold value over time.</li>
                                <li>The panel shows the event count and reports when the timeline query is unavailable.</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>5. Freeze Behavior</SectionTitle>
                        <div className="space-y-200">
                            <SubTitle icon={Snowflake}>Manual Freeze</SubTitle>
                            <p>Each camera card has a Freeze control with a snowflake icon.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Select the snowflake control to freeze that camera image.</li>
                                <li>Other cameras continue updating normally.</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Bell}>Update While Frozen</SubTitle>
                            <p>If a new image arrives while a panel is frozen:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>Freeze text becomes bold.</li>
                                <li>An update indicator appears: Update ready, unfreeze to apply</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Snowflake}>Unfreeze Behavior</SubTitle>
                            <p>Select the active snowflake control again to unfreeze:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>The newest available image is applied immediately.</li>
                                <li>You do not need to wait for another refresh cycle.</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>6. Camera Visibility</SectionTitle>
                        <p>Camera visibility is controlled independently from Freeze.</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Select Hide on a live camera card to remove that camera from the main card grid.</li>
                            <li>Hidden camera choices are remembered in this browser and remain hidden after refresh or reopening the app.</li>
                            <li>Hidden camera buttons appear in the live toolbar using the camera's Building/Line/Sensor identifier. Select a camera button to show that camera again.</li>
                            <li>Select Show all to restore every hidden camera at once.</li>
                            <li>Hiding a camera does not delete its data or change its Fabric queries.</li>
                            <li>The saved visibility choice and UNS label are retained for the hidden camera across refreshes and reopening the app.</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>7. Details Dialog</SectionTitle>
                        <p>Open by selecting Details or by clicking the live camera image on a camera card.</p>
                        <p>What you can do:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>View a larger version of the image</li>
                            <li>Download the selected image</li>
                            <li>Enter a note</li>
                            <li>Save to notes list</li>
                        </ol>
                        <p>If the payload is incomplete, the dialog shows a warning instead of a reliable preview and the save action is disabled. The separate Details button remains available when the image area is replaced by a warning.</p>
                        <div className="space-y-200">
                            <SubTitle icon={Maximize2}>Automatic Freeze on Open</SubTitle>
                            <p>When Details opens for a camera:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>That camera is automatically frozen if it was not manually frozen already</li>
                                <li>This keeps the viewed image stable while inspecting details</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={Image}>New Image During Details</SubTitle>
                            <p>If a new image arrives while Details is open:</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>You get a notice that a newer image is available</li>
                                <li>On closing Details, the main panel refreshes to the newest image automatically</li>
                                <li>If the freeze was added automatically for the dialog, it is removed when you close the dialog</li>
                            </ol>
                        </div>
                        <div className="space-y-200">
                            <SubTitle icon={UserRound}>Added By Field</SubTitle>
                            <p>The author is read-only.</p>
                            <ol className="list-decimal space-y-100 pl-500 text-foreground">
                                <li>It uses your signed-in identity</li>
                                <li>There is no editable name textbox</li>
                            </ol>
                        </div>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>8. Saving Notes</SectionTitle>
                        <p>When saving from Details:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>The image snapshot is stored</li>
                            <li>Your note is stored</li>
                            <li>Author and timestamp are stored</li>
                            <li>Source topic, control topic, content type, camera, and capture timestamp are stored with the entry</li>
                            <li>The displacement and threshold values shown are captured from the live image at the time you save it</li>
                            <li>The full Universal Namespace is stored as a separate property on the saved entry</li>
                            <li>Large image payloads are stored as ordered chunks and reassembled when the saved list is loaded</li>
                            <li>Saved entries appear in Saved Image Notes view</li>
                        </ol>
                        <p>Older saved entries without the dedicated Universal Namespace property fall back to their stored control topic when displaying the namespace.</p>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>9. Removing Saved Images</SectionTitle>
                        <p>You can remove an image from Saved Image Notes when it is no longer needed.</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Select Delete on a saved-image card, or select Delete Saved Image from its read-only details dialog.</li>
                            <li>Confirm the deletion when prompted.</li>
                            <li>The saved image and its stored payload chunks are removed from the list.</li>
                            <li>Deletion is limited to your own saved records.</li>
                            <li>Deletion cannot be undone, so download or review an image before removing it if you may need it later.</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>10. Downloading Images</SectionTitle>
                        <p>You can download images from:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Details dialog in Live Images mode</li>
                            <li>Each card in Saved Image Notes mode</li>
                            <li>Read-only details dialog in Saved Image Notes mode</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>11. Saved Log Details (Read-only)</SectionTitle>
                        <p>Saved Image Notes includes a details dialog that mirrors the live details layout but keeps log content read-only.</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>Open by clicking a saved image or selecting Details (read-only).</li>
                            <li>View a large preview and full metadata for the saved item.</li>
                            <li>Read the note in a non-editable field.</li>
                            <li>Review the saved displacement and threshold values captured when the image was saved.</li>
                            <li>Review the full saved Universal Namespace value.</li>
                            <li>Download the selected saved image from the dialog.</li>
                            <li>Delete the saved image after confirmation.</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>12. Data Integrity and Warnings</SectionTitle>
                        <p>If payload validation fails:</p>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>The app may show decode or truncation warnings</li>
                            <li>Unreliable images are not rendered as normal snapshots</li>
                            <li>Save action is blocked for known incomplete payloads</li>
                            <li>Download reports an error when the Base64 payload cannot be decoded</li>
                        </ol>
                    </section>

                    <section className="space-y-200">
                        <SectionTitle>13. App Proposals</SectionTitle>
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
                        <SectionTitle>14. Recommended Workflow</SectionTitle>
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
                        <SectionTitle>15. Troubleshooting Tips</SectionTitle>
                        <ol className="list-decimal space-y-100 pl-500 text-foreground">
                            <li>No live cards visible: Switch to Live Images view and wait one refresh cycle.</li>
                            <li>No saved items visible: Switch to Saved Image Notes and confirm at least one saved entry exists.</li>
                            <li>Times look wrong for your location: Change the timezone selector. Age stays correct because it is calculated from UTC.</li>
                            <li>Freeze is bold with update indicator: Unfreeze to apply the new image.</li>
                            <li>Image not shown: Check for payload mismatch/truncation warnings in the card or dialog.</li>
                            <li>Timeline shows no events: Confirm the semantic model has recent rows for the selected camera.</li>
                            <li>Timeline or displacement table looks sparse: That can happen when events are filtered by the 24-hour window or when many chunks collapse to one event.</li>
                            <li>A camera is missing from the main page: Check the Hidden cameras controls in the live toolbar and select the camera to restore it, or select Show all.</li>
                            <li>A saved image is no longer needed: Open Saved Image Notes and use Delete, then confirm the prompt.</li>
                            <li>A saved camera is missing: Check whether that camera is hidden on the main page; unhide it there to make its saved records available again.</li>
                        </ol>
                    </section>
                </div>
            </div>
        </div>
    );
}
