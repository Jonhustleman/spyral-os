/**
 * StatementType — First-class classification for all kernel statements.
 *
 * Per Rule #008 and ADR-0018, every piece of information in the kernel
 * must be classified as one of these four types.
 */

export enum StatementType {
  FACT = "fact",
  ASSUMPTION = "assumption",
  INFERENCE = "inference",
  RECOMMENDATION = "recommendation",
}
