export interface SideNavInterface {
    path: string | null;
    title: string;
    iconType: "" | "nzIcon" | "fontawesome";
    iconTheme: "" | "fab" | "far" | "fas" | "fill" | "outline" | "twotone";
    icon: string,
    canAccess:  number[];
    submenu : SideNavInterface[];
}
