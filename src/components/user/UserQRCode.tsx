import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface UserQRCodeProps {
  userId?: number;
}

export default function UserQRCode({ userId }: UserQRCodeProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchQRCode = async () => {
      try {
        const response = await fetch(
          `https://functions.poehali.dev/07269a27-0500-4f53-8cb2-a718a9fc7c85?user_id=${userId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setQrCodeUrl(data.qr_code_url);
        }
      } catch (error) {
        console.error('Error fetching QR code:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [userId]);

  return (
    <>
      <Card className="bg-white border-blue-500/20 shadow-xl slide-up hover:shadow-2xl transition-all duration-300 h-full">
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-black">
            <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
              <Icon name="QrCode" size={18} className="text-blue-500 md:w-5 md:h-5" />
            </div>
            QR-код
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center h-[120px] md:h-[150px]">
              <Icon name="Loader2" size={24} className="animate-spin text-blue-500" />
            </div>
          ) : qrCodeUrl ? (
            <div 
              className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsFullscreen(true)}
            >
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="max-w-full h-auto rounded-lg border-2 border-blue-200"
                style={{ maxHeight: '150px' }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[120px] md:h-[150px] text-gray-400">
              <Icon name="QrCode" size={48} className="mb-2 opacity-30" />
              <div className="text-sm text-center">QR-код не загружен</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen QR Modal */}
      {isFullscreen && qrCodeUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] p-4">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
            >
              <Icon name="X" size={24} className="text-gray-700" />
            </button>
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}