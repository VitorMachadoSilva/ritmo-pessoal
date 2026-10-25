export type * from "../shared/domain-types";
import type { MutationTarget } from "./api-operations";

export type Mutation = (
  target: MutationTarget,
  body?: unknown,
  method?: string,
) => Promise<boolean>;
