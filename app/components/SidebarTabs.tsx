import {useTranslation} from "react-i18next";
import {Tabs, TabsList, TabsTrigger} from "./ui/tabs";

export type SidebarTabValue = "setup" | "sets" | "reading" | "journal";

type Props = {
    value: SidebarTabValue;
    onChange: (value: SidebarTabValue) => void;
};

export function SidebarTabs({value, onChange}: Props) {
    const {t} = useTranslation();
    return (
        <Tabs
            value={value}
            onValueChange={(next) => onChange(next as SidebarTabValue)}
            className="p-3"
        >
            <TabsList className="grid w-full grid-cols-4 rounded-xl">
                <TabsTrigger value="setup" className="rounded-lg px-2 text-xs">{t("sidebar.setup")}</TabsTrigger>
                <TabsTrigger value="sets" className="rounded-lg px-2 text-xs">{t("sidebar.sets")}</TabsTrigger>
                <TabsTrigger value="reading" className="rounded-lg px-2 text-xs">{t("sidebar.reading")}</TabsTrigger>
                <TabsTrigger value="journal" className="rounded-lg px-2 text-xs">{t("sidebar.journal")}</TabsTrigger>
            </TabsList>
        </Tabs>
    );
}
