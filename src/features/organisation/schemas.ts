import { z } from 'zod'

export const inviteOrganisationMemberSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .transform((email) => email.toLowerCase()),
  role: z.enum(['ADMIN', 'MEMBER'], {
    message: 'Select a role',
  }),
})

export type InviteMemberField = keyof z.input<typeof inviteOrganisationMemberSchema>
