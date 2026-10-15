import type { ApiClient } from "./client";
import { MockApi } from "./mock";

export const api: ApiClient = new MockApi();
