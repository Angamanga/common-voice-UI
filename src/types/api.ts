export interface AuthTokenResponse {
  token: string
  expiresIn: number
}

export interface UserResponse {
  userId: string
  username?: string
  email?: string
}

export interface Sentence {
  id: string
  text: string
  hash: string
}

export interface SentencesResponse {
  sentences: Sentence[]
}

export interface Accent {
  code: string
  name: string
}

export interface Variant {
  code: string
  name: string
  predefined_accents?: Accent[]
}

export interface Dataset {
  code: string
  name: string
  variants: Variant[]
  predefined_accents: Accent[]
}

export interface DatasetsResponse {
  languages: Dataset[]
}

export interface AudioUploadResponse {
  id: string
  status: string
}

export interface AudioStatusResponse {
  id: string
  status: 'queued' | 'pending_validation' | 'error'
  url?: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
