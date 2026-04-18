const UPLOAD_URL = 'https://functions.poehali.dev/f5321501-2042-46b8-9b98-0029c2d10bde';

export async function uploadChatMedia(
  file: File,
  userId: number
): Promise<{ url: string; mime: string }> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const mediaType = file.type.startsWith('audio/')
    ? 'audio'
    : file.type.startsWith('image/')
    ? 'image'
    : 'video';

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': String(userId),
    },
    body: JSON.stringify({
      media_data: base64,
      media_type: mediaType,
      mime: file.type,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Upload failed: ${res.status}`);
  }

  return res.json();
}
