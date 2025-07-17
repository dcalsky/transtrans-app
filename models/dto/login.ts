export interface AppleSignInRequest {
  IdentityToken: string
  Email: string
  FullName: string
}

export interface LoginResponse {
  Token: string
  Account: AccountForDetail
}

export interface GetUserDetailResponse {
  Account: AccountForDetail
}

export interface SubscriptionInfo {
  ExpiredAt?: string
  Subscribed: boolean
  Entitlement: string
}

export interface AccountForDetail {
  Id: string
  Email: string
  NickName: string
  Credit: number;
  CreatedAt: number
  UpdatedAt: number
  SubscriptionInfo: SubscriptionInfo
}


