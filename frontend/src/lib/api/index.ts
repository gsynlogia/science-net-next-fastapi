import type { ApiClient } from "./client";
import { HttpApi } from "./http";

export const api: ApiClient = new HttpApi();
