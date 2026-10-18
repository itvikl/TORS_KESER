import * as z from "zod";

export const UpdateUserRoleInputSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  role: z.enum(["staff", "admin"], { error: "Choose a role." }),
});

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleInputSchema>;

/** "Add account": the password is only needed when the email has no login yet. */
export const AddAdminAccountInputSchema = UpdateUserRoleInputSchema.extend({
  password: z.preprocess(
    (v) => (typeof v === "string" && v === "" ? undefined : v),
    z.string().min(8, { error: "Password must be at least 8 characters." }).optional()
  ),
});

export type AddAdminAccountInput = z.infer<typeof AddAdminAccountInputSchema>;
