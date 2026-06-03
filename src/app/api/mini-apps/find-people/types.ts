export type Seniority = 'C-suite' | 'VP' | 'Director' | 'Manager' | 'Individual'
export type Department = 'Engineering' | 'Sales' | 'Marketing' | 'Product' | 'Operations' | 'Other'

export type Person = {
  fullName: string
  title: string
  department: string | null
  seniority: Seniority | null
  linkedinUrl: string | null
  photoUrl: string | null
  location: string | null
}

export type FindPeopleResult = {
  companyName: string
  companyDomain: string
  totalEmployees: number
  people: Person[]
}

export type SuccessResponse = { ok: true; result: FindPeopleResult; mode: 'stub' | 'live' }
export type ErrorResponse = { ok: false; error: string }
export type ApiResponse = SuccessResponse | ErrorResponse
