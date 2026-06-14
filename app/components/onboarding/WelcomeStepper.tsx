import {useMemo, useState} from "react";
import {useNavigate} from "react-router";
import {Trans, useTranslation} from "react-i18next";
import {Button} from "~/components/ui/button";
import {clampRangeValue, CUSTOM_RANGE_ID, DEFAULT_RANGES} from "~/ranges";
import {loadRangeSettings, saveRangeSettings} from "~/storage";
import {markOnboardingCompleted} from "~/onboarding";
import {detectPlatform, isPWAInstalled} from "~/lib/platform";
import {usePWAInstall} from "~/hooks/usePWAInstall";

type StepKey =
    | "language"
    | "welcome"
    | "not-medical"
    | "features"
    | "range"
    | "privacy"
    | "install"
    | "done";

const ALL_STEPS: StepKey[] = [
    "language",
    "welcome",
    "not-medical",
    "features",
    "range",
    "privacy",
    "install",
    "done",
];

const STEPS_NO_INSTALL: StepKey[] = [
    "language",
    "welcome",
    "not-medical",
    "features",
    "range",
    "privacy",
    "done",
];

export function WelcomeStepper() {
    const navigate = useNavigate();
    const {t} = useTranslation();
    const STEPS = isPWAInstalled() ? STEPS_NO_INSTALL : ALL_STEPS;
    const [stepIndex, setStepIndex] = useState(0);
    const [understood, setUnderstood] = useState(false);
    const [pickedRangeId, setPickedRangeId] = useState<string | null>(null);
    const [customMinHz, setCustomMinHz] = useState(150);
    const [customMaxHz, setCustomMaxHz] = useState(200);
    const [customMinInput, setCustomMinInput] = useState("150");
    const [customMaxInput, setCustomMaxInput] = useState("200");

    const step = STEPS[stepIndex];
    const isFirst = stepIndex === 0;
    const isLast = stepIndex === STEPS.length - 1;

    function next() {
        setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }

    function back() {
        setStepIndex((i) => Math.max(i - 1, 0));
    }

    function finish() {
        markOnboardingCompleted();
        void navigate("/");
    }

    function skipAll() {
        markOnboardingCompleted();
        void navigate("/");
    }

    function handlePickRange(id: string) {
        setPickedRangeId(id);
        const existing = loadRangeSettings();
        const customRange =
            id === CUSTOM_RANGE_ID
                ? {...existing.customRange, minHz: customMinHz, maxHz: customMaxHz}
                : existing.customRange;
        saveRangeSettings({
            selectedRangeId: id,
            customRange,
            detectorAlgorithm: existing.detectorAlgorithm,
        });
    }

    function handleCustomChange(field: "minHz" | "maxHz", raw: string) {
        if (field === "minHz") setCustomMinInput(raw);
        else setCustomMaxInput(raw);

        if (raw.trim() === "") {
            setPickedRangeId(CUSTOM_RANGE_ID);
            return;
        }

        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || (parsed > 0 && parsed < 50)) {
            setPickedRangeId(CUSTOM_RANGE_ID);
            return;
        }

        const fallback = field === "minHz" ? customMinHz : customMaxHz;
        const numericValue = parsed <= 0 ? 0 : clampRangeValue(parsed, fallback);

        let nextMin = customMinHz;
        let nextMax = customMaxHz;
        if (field === "minHz") {
            nextMin = numericValue;
            if (nextMin > 0 && nextMax > 0 && nextMax <= nextMin) nextMax = nextMin + 1;
        } else {
            nextMax = numericValue;
            if (nextMin > 0 && nextMax > 0 && nextMax <= nextMin) nextMin = nextMax - 1;
        }
        setCustomMinHz(nextMin);
        setCustomMaxHz(nextMax);
        setPickedRangeId(CUSTOM_RANGE_ID);
        const existing = loadRangeSettings();
        saveRangeSettings({
            selectedRangeId: CUSTOM_RANGE_ID,
            customRange: {...existing.customRange, minHz: nextMin, maxHz: nextMax},
            detectorAlgorithm: existing.detectorAlgorithm,
        });
    }

    function handleCustomBlur(field: "minHz" | "maxHz") {
        const raw = field === "minHz" ? customMinInput : customMaxInput;
        const currentValue = field === "minHz" ? customMinHz : customMaxHz;
        if (raw.trim() === "") {
            if (field === "minHz") setCustomMinInput(String(customMinHz));
            else setCustomMaxInput(String(customMaxHz));
            return;
        }

        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
            if (field === "minHz") setCustomMinInput(String(customMinHz));
            else setCustomMaxInput(String(customMaxHz));
            return;
        }

        const normalizedValue =
            parsed <= 0 ? 0 : clampRangeValue(parsed, currentValue);

        let nextMin = customMinHz;
        let nextMax = customMaxHz;
        if (field === "minHz") {
            nextMin = normalizedValue;
            if (nextMin > 0 && nextMax > 0 && nextMax <= nextMin) nextMax = nextMin + 1;
        } else {
            nextMax = normalizedValue;
            if (nextMin > 0 && nextMax > 0 && nextMax <= nextMin) nextMin = nextMax - 1;
        }

        setCustomMinHz(nextMin);
        setCustomMaxHz(nextMax);
        setCustomMinInput(String(nextMin));
        setCustomMaxInput(String(nextMax));
        setPickedRangeId(CUSTOM_RANGE_ID);
        const existing = loadRangeSettings();
        saveRangeSettings({
            selectedRangeId: CUSTOM_RANGE_ID,
            customRange: {...existing.customRange, minHz: nextMin, maxHz: nextMax},
            detectorAlgorithm: existing.detectorAlgorithm,
        });
    }

    const canAdvance = step === "not-medical" ? understood : true;

    return (
        <div
            className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pb-8 pt-[calc(2rem+env(safe-area-inset-top))] text-ink lg:min-h-0 lg:max-w-md lg:rounded-3xl lg:border lg:border-slate-200 lg:bg-white lg:px-6 lg:py-6 lg:shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{t("common.stepXofY", {current: stepIndex + 1, total: STEPS.length})}</span>
                <button
                    type="button"
                    onClick={skipAll}
                    className="text-slate-500 underline-offset-4 hover:underline"
                >
                    {t("common.skip")}
                </button>
            </div>

            <div className="mt-3 flex gap-1.5">
                {STEPS.map((s, i) => (
                    <span
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${
                            i <= stepIndex ? "bg-sea" : "bg-slate-200"
                        }`}
                    />
                ))}
            </div>

            <div className="mt-6 flex-1 lg:mt-5 lg:flex-none">
                {step === "language" && <StepLanguage/>}
                {step === "welcome" && <StepWelcome/>}
                {step === "not-medical" && (
                    <StepNotMedical
                        understood={understood}
                        onUnderstoodChange={setUnderstood}
                    />
                )}
                {step === "features" && <StepFeatures/>}
                {step === "range" && (
                    <StepPickRange
                        pickedRangeId={pickedRangeId}
                        onPick={handlePickRange}
                        customMinHz={customMinHz}
                        customMaxHz={customMaxHz}
                        customMinInput={customMinInput}
                        customMaxInput={customMaxInput}
                        onCustomChange={handleCustomChange}
                        onCustomBlur={handleCustomBlur}
                    />
                )}
                {step === "privacy" && <StepPrivacy/>}
                {step === "install" && <StepInstall/>}
                {step === "done" && <StepDone/>}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 pb-[env(safe-area-inset-bottom)] lg:mt-5 lg:pb-0">
                <Button
                    variant="ghost"
                    onClick={back}
                    disabled={isFirst}
                    aria-label={t("common.back")}
                >
                    {t("common.back")}
                </Button>
                {isLast ? (
                    <Button onClick={finish} size="lg">
                        {t("onboarding.openApp")}
                    </Button>
                ) : (
                    <Button
                        onClick={next}
                        size="lg"
                        disabled={!canAdvance}
                        aria-disabled={!canAdvance}
                    >
                        {t("common.next")}
                    </Button>
                )}
            </div>
        </div>
    );
}

function StepLanguage() {
    const {t, i18n} = useTranslation();
    const current = i18n.resolvedLanguage ?? i18n.language ?? "en";
    const options: Array<{code: string; label: string}> = [
        {code: "en", label: t("common.english")},
        {code: "de", label: t("common.german")},
    ];
    return (
        <section className="space-y-4">
            <div className="text-5xl">🌐</div>
            <h2 className="text-xl font-semibold tracking-tight">
                {t("onboarding.language.title")}
            </h2>
            <p className="text-sm text-slate-600">
                {t("onboarding.language.body")}
            </p>
            <div className="space-y-2">
                {options.map((opt) => {
                    const selected = current.startsWith(opt.code);
                    return (
                        <button
                            type="button"
                            key={opt.code}
                            onClick={() => void i18n.changeLanguage(opt.code)}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                                selected
                                    ? "border-sea bg-sea/10"
                                    : "border-slate-200 bg-white/70 hover:bg-white"
                            }`}
                        >
                            <div className="font-medium">{opt.label}</div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function StepWelcome() {
    const {t} = useTranslation();
    return (
        <section className="space-y-4 text-center">
            <div className="text-6xl">🎙️</div>
            <h1 className="text-2xl font-semibold tracking-tight">
                {t("onboarding.welcome.title")}
            </h1>
            <p className="text-base text-slate-600">
                {t("onboarding.welcome.body")}
            </p>
            <p className="text-sm text-slate-500">
                {t("onboarding.welcome.tour")}
            </p>
        </section>
    );
}

function StepNotMedical({
                            understood,
                            onUnderstoodChange,
                        }: {
    understood: boolean;
    onUnderstoodChange: (value: boolean) => void;
}) {
    const {t} = useTranslation();
    return (
        <section className="space-y-4">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-semibold tracking-tight">
                {t("onboarding.notMedical.title")}
            </h2>
            <p className="text-slate-600">
                <Trans
                    i18nKey="onboarding.notMedical.body1"
                    components={[<span key="0"/>, <strong key="1"/>]}
                />
            </p>
            <p className="text-slate-600">
                {t("onboarding.notMedical.body2")}
            </p>

            <label className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/60 p-4">
                <input
                    type="checkbox"
                    checked={understood}
                    onChange={(e) => onUnderstoodChange(e.target.checked)}
                    className="mt-1 size-4 rounded"
                />
                <span className="text-sm text-slate-700">
                    {t("onboarding.notMedical.checkbox")}
                </span>
            </label>
        </section>
    );
}

function StepFeatures() {
    const {t} = useTranslation();
    const features: Array<{ emoji: string; titleKey: string; bodyKey: string }> = [
        {emoji: "📊", titleKey: "onboarding.features.pitch.title", bodyKey: "onboarding.features.pitch.body"},
        {emoji: "🎯", titleKey: "onboarding.features.ranges.title", bodyKey: "onboarding.features.ranges.body"},
        {emoji: "🔴", titleKey: "onboarding.features.recording.title", bodyKey: "onboarding.features.recording.body"},
        {emoji: "🗣️", titleKey: "onboarding.features.practice.title", bodyKey: "onboarding.features.practice.body"},
        {emoji: "📓", titleKey: "onboarding.features.journal.title", bodyKey: "onboarding.features.journal.body"},
        {emoji: "📱", titleKey: "onboarding.features.offline.title", bodyKey: "onboarding.features.offline.body"},
    ];
    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
                {t("onboarding.features.title")}
            </h2>
            <ul className="space-y-3">
                {features.map((f) => (
                    <li
                        key={f.titleKey}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-3"
                    >
                        <span className="text-2xl leading-none">{f.emoji}</span>
                        <div>
                            <div className="font-medium">{t(f.titleKey)}</div>
                            <div className="text-sm text-slate-600">{t(f.bodyKey)}</div>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}

function StepPickRange({
                           pickedRangeId,
                           onPick,
                           customMinHz,
                           customMaxHz,
                           customMinInput,
                           customMaxInput,
                           onCustomChange,
                           onCustomBlur,
                       }: {
    pickedRangeId: string | null;
    onPick: (id: string) => void;
    customMinHz: number;
    customMaxHz: number;
    customMinInput: string;
    customMaxInput: string;
    onCustomChange: (field: "minHz" | "maxHz", value: string) => void;
    onCustomBlur: (field: "minHz" | "maxHz") => void;
}) {
    const {t} = useTranslation();
    const cards = useMemo(
        () =>
            DEFAULT_RANGES.map((r) => {
                const meta = RANGE_EMOJI[r.id] ?? "🎵";
                return {...r, emoji: meta};
            }),
        [],
    );

    const customSelected = pickedRangeId === CUSTOM_RANGE_ID;

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">
                {t("onboarding.range.title")}
            </h2>
            <p className="text-sm text-slate-600">
                {t("onboarding.range.intro")}
            </p>
            <div className="space-y-2">
                {cards.map((r) => {
                    const selected = pickedRangeId === r.id;
                    return (
                        <button
                            type="button"
                            key={r.id}
                            onClick={() => onPick(r.id)}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                                selected
                                    ? "border-sea bg-sea/10"
                                    : "border-slate-200 bg-white/70 hover:bg-white"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{r.emoji}</span>
                                    <div>
                                        <div className="font-medium">{t(`ranges.${r.id}`)}</div>
                                        <div className="text-xs text-slate-500">{t(`ranges.rangeBlurb.${r.id}`)}</div>
                                    </div>
                                </div>
                                <div className="text-sm tabular-nums text-slate-600">
                                    {r.minHz}–{r.maxHz} Hz
                                </div>
                            </div>
                        </button>
                    );
                })}

                <div
                    className={`rounded-2xl border p-4 transition ${
                        customSelected
                            ? "border-sea bg-sea/10"
                            : "border-slate-200 bg-white/70"
                    }`}
                >
                    <button
                        type="button"
                        onClick={() => onPick(CUSTOM_RANGE_ID)}
                        className="flex w-full items-center justify-between text-left"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🛠️</span>
                            <div>
                                <div className="font-medium">{t("ranges.custom")}</div>
                                <div className="text-xs text-slate-500">
                                    {t("ranges.rangeBlurb.custom")}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm tabular-nums text-slate-600">
                            {customMinHz}–{customMaxHz} Hz
                        </div>
                    </button>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <label className="space-y-1 text-xs font-medium text-slate-600">
                            {t("onboarding.range.minHz")}
                            <input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="399"
                                value={customMinInput}
                                onChange={(e) => onCustomChange("minHz", e.currentTarget.value)}
                                onBlur={() => onCustomBlur("minHz")}
                                onFocus={() => onPick(CUSTOM_RANGE_ID)}
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-sea"
                            />
                        </label>
                        <label className="space-y-1 text-xs font-medium text-slate-600">
                            {t("onboarding.range.maxHz")}
                            <input
                                type="number"
                                inputMode="numeric"
                                min="0"
                                max="400"
                                value={customMaxInput}
                                onChange={(e) => onCustomChange("maxHz", e.currentTarget.value)}
                                onBlur={() => onCustomBlur("maxHz")}
                                onFocus={() => onPick(CUSTOM_RANGE_ID)}
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-sea"
                            />
                        </label>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-500">
                {t("onboarding.range.later")}
            </p>
        </section>
    );
}

const RANGE_EMOJI: Record<string, string> = {
    female: "🙍‍♀️",
    androgynous: "🙍",
    male: "🙍‍♂️",
};

function StepPrivacy() {
    const {t} = useTranslation();
    return (
        <section className="space-y-4">
            <div className="text-5xl">🔒</div>
            <h2 className="text-xl font-semibold tracking-tight">
                {t("onboarding.privacy.title")}
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
                <li>
                    <Trans
                        i18nKey="onboarding.privacy.items.indexeddb"
                        components={[<code key="0"/>]}
                    />
                </li>
                <li>{t("onboarding.privacy.items.settings")}</li>
                <li>{t("onboarding.privacy.items.exports")}</li>
                <li>{t("onboarding.privacy.items.hosting")}</li>
                <li>{t("onboarding.privacy.items.noTracking")}</li>
            </ul>
            <p className="text-sm text-slate-600">
                <Trans
                    i18nKey="onboarding.privacy.footer"
                    components={[
                        <a key="0" href="/privacy" className="underline"/>,
                        <a key="1" href="/imprint" className="underline"/>,
                    ]}
                />
            </p>
        </section>
    );
}

function StepInstall() {
    const {t} = useTranslation();
    const platform = detectPlatform();
    const {canInstall, promptInstall} = usePWAInstall();

    return (
        <section className="space-y-4">
            <div className="text-5xl">📱</div>
            <h2 className="text-xl font-semibold tracking-tight">
                {t("onboarding.install.title")}
            </h2>
            <p className="text-sm text-slate-600">
                {t("onboarding.install.body")}
            </p>

            <InstallInstructions
                platform={platform}
                canInstall={canInstall}
                promptInstall={promptInstall}
            />
        </section>
    );
}

function InstallInstructions({
                                 platform,
                                 canInstall,
                                 promptInstall,
                             }: {
    platform: ReturnType<typeof detectPlatform>;
    canInstall: boolean;
    promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}) {
    const {t} = useTranslation();
    const fallbackUrl =
        typeof window !== "undefined"
            ? `https://www.installpwa.com/from/${encodeURIComponent(window.location.origin)}`
            : "https://www.installpwa.com/";

    if (
        platform === "android-chrome" ||
        platform === "android-samsung" ||
        platform === "desktop-chrome" ||
        platform === "desktop-edge"
    ) {
        return (
            <div className="space-y-3">
                {canInstall ? (
                    <Button size="lg" onClick={() => void promptInstall()}>
                        {t("onboarding.install.button")}
                    </Button>
                ) : (
                    <Steps
                        items={[
                            t("onboarding.install.stepsAndroid.0"),
                            t("onboarding.install.stepsAndroid.1"),
                            t("onboarding.install.stepsAndroid.2"),
                        ]}
                    />
                )}
                <FallbackLink url={fallbackUrl}/>
            </div>
        );
    }

    if (platform === "ios-safari") {
        return (
            <div className="space-y-3">
                <Steps
                    items={[
                        t("onboarding.install.stepsIos.0"),
                        t("onboarding.install.stepsIos.1"),
                        t("onboarding.install.stepsIos.2"),
                    ]}
                />
                <FallbackLink url={fallbackUrl}/>
            </div>
        );
    }

    if (platform === "ios-chrome" || platform === "ios-firefox" || platform === "ios-other") {
        return (
            <div className="space-y-3">
                <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {t("onboarding.install.iosOtherBrowser")}
                </p>
                <FallbackLink url={fallbackUrl}/>
            </div>
        );
    }

    if (platform === "desktop-firefox") {
        return (
            <div className="space-y-3">
                <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    {t("onboarding.install.desktopFirefox")}
                </p>
                <FallbackLink url={fallbackUrl}/>
            </div>
        );
    }

    if (platform === "desktop-safari") {
        return (
            <div className="space-y-3">
                <Steps
                    items={[
                        t("onboarding.install.stepsDesktopSafari.0"),
                        t("onboarding.install.stepsDesktopSafari.1"),
                    ]}
                />
                <FallbackLink url={fallbackUrl}/>
            </div>
        );
    }

    if (platform === "android-firefox" || platform === "android-other") {
        return (
            <div className="space-y-3">
                <Steps
                    items={[
                        t("onboarding.install.stepsAndroidGeneric.0"),
                        t("onboarding.install.stepsAndroidGeneric.1"),
                    ]}
                />
                <FallbackLink url={fallbackUrl}/>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-slate-600">
                {t("onboarding.install.unknown")}
            </p>
            <FallbackLink url={fallbackUrl}/>
        </div>
    );
}

function Steps({items}: { items: string[] }) {
    return (
        <ol className="list-decimal space-y-1 rounded-2xl border border-slate-200 bg-white/70 p-4 pl-7 text-sm text-slate-700">
            {items.map((s, i) => (
                <li key={i}>{s}</li>
            ))}
        </ol>
    );
}

function FallbackLink({url}: { url: string }) {
    const {t} = useTranslation();
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-sea underline underline-offset-4"
        >
            {t("onboarding.install.fallback")}
        </a>
    );
}

function StepDone() {
    const {t} = useTranslation();
    return (
        <section className="space-y-4 text-center">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("onboarding.done.title")}</h2>
            <p className="text-slate-600">
                {t("onboarding.done.body")}
            </p>
            <p className="text-sm text-slate-500">
                {t("onboarding.done.revisit")}
            </p>
        </section>
    );
}
