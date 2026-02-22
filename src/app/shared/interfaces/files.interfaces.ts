export interface FileNode {
  name: string;
  is_dir: boolean;
  sublevel: FileNode[] | "";
}