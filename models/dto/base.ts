
export interface ErrorObj {
  Code: string;
  Message: string;
  Detail?: string;
}

export interface ResponseMetaData {
  RequestId: string;
  Error?: ErrorObj;
}

export interface ErrorResponse {
  Meta: ResponseMetaData;
}

export interface CommonResponse<T = any> {
  Meta: ResponseMetaData;
  Data?: T;
}

export interface PageOption {
  PageSize: number;
  PageNum: number;
}