export interface JwtPayload {
  exp: number;
  id?: number;
  name?: string;
  email?: string;
}