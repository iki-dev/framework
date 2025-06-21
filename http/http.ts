export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PRECONDITION_FAILED: 412,
  TOO_MANY_REQUESTS: 429,
  IM_A_TEAPOT: 418,
};

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

export const ContentType = {
  TextPlain: "text/plain",
  TextHTML: "text/html",
  ApplicationJSON: "application/json",
  ApplicationXML: "application/xml",
  ApplicationFormUrlEncoded: "application/x-www-form-urlencoded",
  ApplicationOctetStream: "application/octet-stream",
  MultipartFormData: "multipart/form-data",
};

export type HeaderContentType = (typeof ContentType)[keyof typeof ContentType];
