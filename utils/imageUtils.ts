
export const dataUrlToBase64 = (dataUrl: string): string => {
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    throw new Error('Invalid data URL');
  }
  return parts[1];
};
