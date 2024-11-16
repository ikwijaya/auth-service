export const LOG_DIR = './logs';
export const LOG_DATE_FORMAT = 'MM-DD-YYYY HH:MM:SS';
export const DEFAULT_PORT = 5000;

/// DEFAULT
export const _DATA_NOT_FOUND = '404 - Not Found';
export const ERR_SURR_API =
  '#ERR03. Server is not respond, please check again later';

/// ERROR MIDDLEWARE
export const TOKEN_FAIL_01 = '#TF01, Bad authorization can`t authenticated';
export const TOKEN_FAIL_02 = '#TF02, Wrong or missing authorization';
export const AUTH_BAD_00 = 'Bad Access, your headers is not match requirement';
export const AUTH_BAD_01 = 'Device/User time is not valid';
export const AUTH_FAIL_00 = 'Session is destroyed';
export const AUTH_FAIL_01 = '#AF01, Unknown User - Access Denied';
export const AUTH_FAIL_02 = '#AF02, Pending User - Access Denied';
export const MATRIX_FAIL_00 = '#MXF00, Bad Security - Access Denied';
export const MATRIX_FAIL_01 = '#MXF01, Unknown Security - Access Denied';
export const MATRIX_FAIL_03 = '#MXF03, Wrong Security - Access Denied';
export const PRIV_FAIL_00 = '#PVF00, Access Denied';
export const PRIV_FAIL_01 = '#PVF01, Unknown Role - Access Denied';
export const REQVAL_FAIL_00 = '#RQF00, Bad Request Payload';

/// API ERROR
export const LOGIN_FAIL_00 = '#LOF00, Unknown User';
export const LOGIN_FAIL_01 = '#LOF01, Failed Login';
export const LOGOUT_ALREADY = 'Session is destroyed';

/// DEFAULT RETURN
export const DEFAULT_SUCCESS = 'Great, your task is done';
export const DEFAULT_FAILED =
  'Sorry, your task is failed, please do it again later';
export const DEFAULT_UPDATED = 'Great, your task update is done';
export const DEFAULT_DELETED = 'Great, your task delete is done';
export const DEFAULT_APPROVED = 'Yippi.., your task is approved';
export const DEFAULT_REJECTED = 'Yey.., your task is rejected';
export const DEFAULT_UPLOAD_OK = 'Great, upload is done';
