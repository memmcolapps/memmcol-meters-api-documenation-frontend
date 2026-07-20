export type AuthenticatedUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  organisationId: string
  dialCode?: string
  phone?: string
}

export type AuthenticatedOrganisation = {
  id: string
  name: string
}

export type AuthenticatedAccount = {
  user: AuthenticatedUser
  organisation: AuthenticatedOrganisation
}
