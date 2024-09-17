export const LOG_DIR = './logs';
export const LOG_DATE_FORMAT = 'MM-DD-YYYY HH:MM:SS';
export const DEFAULT_PORT = 5000;

/// DEFAULT
export const _DATA_NOT_FOUND = 'data not found';
export const ERR_SURR_API =
  '#ERR03. Mohon maaf server tidak merespon, silakan coba kembali';

/// ERROR MIDDLEWARE
export const TOKEN_FAIL_01 = '#TF01, Token tidak dapat melakukan authentikasi';
export const TOKEN_FAIL_02 = '#TF02, Token authentikasi tidak dikenal';
export const AUTH_BAD_00 = 'Bad Access, your headers is not match requirement';
export const AUTH_BAD_01 = 'Device/User time is not valid';
export const AUTH_FAIL_00 = 'Sesi Anda telah berakhir';
export const AUTH_FAIL_01 = '#AF01, User tidak dikenal';
export const AUTH_FAIL_02 = '#AF02, User Anda sedang dalam proses approval';
export const MATRIX_FAIL_00 = '#MXF00, Tidak dikenal';
export const MATRIX_FAIL_01 = '#MXF01, Keamanan tidak dikenal';
export const MATRIX_FAIL_03 = '#MXF03, Keamanan, tidak di izinkan';
export const PRIV_FAIL_00 = '#PVF00, Tidak dikenal';
export const PRIV_FAIL_01 = '#PVF01, Mode Peran tidak dikenal';
export const REQVAL_FAIL_00 = '#RQF00, Gagal melakukan validasi input';

/// API ERROR
export const LOGIN_FAIL_00 = '#LOF00, User tidak terdaftar atau tidak aktif';
export const LOGIN_FAIL_01 = '#LOF01, Gagal melakukan authentikasi';
export const LOGOUT_ALREADY = 'Sesi telah berakhir';

/// DEFAULT RETURN
export const DEFAULT_SUCCESS = 'berhasil disimpan!';
export const DEFAULT_FAILED = 'gagal disimpan!';
export const DEFAULT_UPDATED = 'berhasil diubah!';
export const DEFAULT_DELETED = 'berhasil dihapus!';
export const DEFAULT_APPROVED = 'berhasil Disetujui!';
export const DEFAULT_REJECTED = 'berhasil Ditolak!';
export const DEFAULT_UPLOAD_OK = 'berhasil upload!';
