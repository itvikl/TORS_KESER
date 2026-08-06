import * as z from "zod";

export const UpdateUserRoleInputSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  role: z.enum(["staff", "admin"], { error: "Choose a role." }),
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleInputSchema>;
