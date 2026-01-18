export interface JwtPayload {
  exp: number;
  id?: number;
  sub?: string;
}