import { z } from "zod";


export const UserSidebarSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().url().or(z.string().min(0)).optional(),
});

export type UserSidebar = z.infer<typeof UserSidebarSchema>;