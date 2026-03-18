export interface SideNavInterface {
    path: string | null;
    title: string | null;
    iconType: "" | "nzIcon" | "fontawesome" | "image";
    iconTheme: "" | "fab" | "far" | "fas" | "fill" | "outline" | "twotone";
    icon: string,
    canAccess:  number[];
    submenu : SideNavInterface[];
}
