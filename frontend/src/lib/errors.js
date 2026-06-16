export function getErrorMessage(error, fallback = 'Terjadi kesalahan saat memuat data.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
