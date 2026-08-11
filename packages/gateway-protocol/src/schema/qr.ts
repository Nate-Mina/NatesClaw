// Gateway Protocol QR schemas share the established PNG data-URL contract.
import { Type } from "typebox";

export const QR_PNG_DATA_URL_MAX_LENGTH = 16_384;
export const QR_PNG_DATA_URL_PREFIX = "data:image/png;base64,";
const QR_PNG_DATA_URL_MIN_LENGTH = 114;

// The header requires the PNG signature followed by the mandatory 13-byte IHDR
// chunk. The terminator alternatives cover the three Base64 alignments of the
// fixed zero-length IEND chunk, so truncated signature-only payloads cannot pass.
const QR_PNG_BASE64_SIGNATURE_PATTERN = "iVBORw0KGg";
const QR_PNG_BASE64_HEADER_PATTERN = "(?=iVBORw0KGgoAAAANSUhEUg)";
const QR_PNG_BASE64_TERMINATOR_PATTERN =
  "(?=[A-Za-z0-9+/]*(?:AAAAAElFTkSuQmCC|AAAABJRU5ErkJggg==|AAAAASUVORK5CYII=)$)";
const QR_PNG_BASE64_CANONICAL_TAIL_PATTERN =
  "(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/][AQgw]==|[A-Za-z0-9+/]{2}[AEIMQUYcgkosw048]=)?";
const QR_PNG_DATA_URL_PATTERN = `^${QR_PNG_DATA_URL_PREFIX}${QR_PNG_BASE64_HEADER_PATTERN}${QR_PNG_BASE64_TERMINATOR_PATTERN}${QR_PNG_BASE64_SIGNATURE_PATTERN}[o-r][A-Za-z0-9+/]${QR_PNG_BASE64_CANONICAL_TAIL_PATTERN}$`;

export const QrPngDataUrlSchema = Type.String({
  minLength: QR_PNG_DATA_URL_MIN_LENGTH,
  maxLength: QR_PNG_DATA_URL_MAX_LENGTH,
  pattern: QR_PNG_DATA_URL_PATTERN,
});
