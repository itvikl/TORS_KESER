import * as z from "zod";
import { ADMIN_ROLES } from "@/lib/auth/roles";

const RoleSchema = z.enum(ADMIN_ROLES, { error: "Choose a role." });

/** "Add account": the password is only needed when the email has no login yet. */
export const AddAdminAccountInputSchema = z.object({
  email: z.email({ error: "Enter a valid email." }),
  role: RoleSchema,
  password: z.preprocess(
    (v) => (typeof v === "string" && v === "" ? undefined : v),
    z.string().min(8, { error: "Password must be at least 8 characters." }).optional()
  ),
});

export type AddAdminAccountInput = z.infer<typeof AddAdminAccountInputSchema>;

/** Role dropdown on an Admin accounts row. */
export const ChangeAccountRoleInputSchema = z.object({
  uid: z.string().min(1),
  role: RoleSchema,
});
