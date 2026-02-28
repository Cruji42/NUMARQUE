export interface JwtPayload {
  exp: number;
  id?: number;
  sub?: string;
  user_id?: number;
  [key: string]: any;
}
