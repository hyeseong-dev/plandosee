import { z } from "zod";

const short = z.string().trim().min(1).max(120);

export const diaryCommandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("createStudy"),
    data: z.object({
      question: z.string().trim().min(10).max(300),
      metricName: short,
      unit: z.string().trim().min(1).max(30),
      missingRule: z.string().trim().min(5).max(300),
      duplicateRule: z.string().trim().min(5).max(300),
      outlierRule: z.string().trim().min(5).max(300),
      roundingRule: z.string().trim().min(5).max(300),
    }),
  }),
  z.object({
    action: z.literal("saveEntry"),
    data: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      value: z.number().finite().min(0).max(1_000_000),
      note: z.string().trim().max(500),
    }),
  }),
  z.object({
    action: z.literal("saveRuleChange"),
    data: z.object({
      reason: z.string().trim().min(5).max(500),
      beforeRule: z.string().trim().min(3).max(300),
      afterRule: z.string().trim().min(3).max(300),
    }),
  }),
]);
