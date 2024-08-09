import * as express from "express";
import { TValidatedUser } from "src/auth/auth.service";

declare global {
  namespace Express {
    interface User extends TValidatedUser {}
  }
}
