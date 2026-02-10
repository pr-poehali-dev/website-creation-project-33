import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface NotebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRecording: boolean;
  isLoading: boolean;
  parentName: string;
  setParentName: (value: string) => void;
  childName: string;
  setChildName: (value: string) => void;
  childAge: string;
  setChildAge: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  onCancel: () => void;
  onSend: () => void;
  onQRClick: () => void;
}

export default function NotebookModal({
  open,
  onOpenChange,
  isRecording,
  isLoading,
  parentName,
  setParentName,
  childName,
  setChildName,
  childAge,
  setChildAge,
  phone,
  setPhone,
  onCancel,
  onSend,
  onQRClick
}: NotebookModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-white !border-0 shadow-2xl rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500 shadow-lg">
                <Icon name="NotebookPen" size={20} className="text-white sm:w-[22px] sm:h-[22px]" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="p-2 rounded-xl border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 disabled:opacity-50"
                  title="Отменить"
                >
                  <Icon name="X" size={20} />
                </button>
                <button
                  onClick={onSend}
                  disabled={isLoading}
                  className="p-2 rounded-xl bg-[#0088cc] hover:bg-[#006699] text-white transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl"
                  title="Отправить в Telegram"
                >
                  {isLoading ? (
                    <Icon name="Loader2" size={20} className="animate-spin" />
                  ) : (
                    <Icon name="Send" size={20} />
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Имя родителя
                </label>
                <Input
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Иван"
                  className="bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl h-11 sm:h-12"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Имя ребёнка
                </label>
                <Input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Мария"
                  className="bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl h-11 sm:h-12"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Возраст
                  </label>
                  <Input
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    placeholder="5 лет"
                    className="bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl h-11 sm:h-12"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Телефон
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-medium text-sm sm:text-base pointer-events-none">
                      +7
                    </span>
                    <Input
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value.length <= 10) {
                          setPhone(value);
                        }
                      }}
                      placeholder="9001234567"
                      className="bg-white !border-2 !border-blue-500 text-gray-900 placeholder:text-gray-400 focus:!border-blue-500 focus-visible:!ring-0 focus-visible:!ring-offset-0 focus:!outline-none !outline-none transition-all duration-300 text-sm sm:text-base rounded-xl h-11 sm:h-12 pl-9"
                      style={{ outline: 'none', boxShadow: 'none' }}
                      type="tel"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center lg:min-w-[200px]">
            <div
              onClick={onQRClick}
              className="cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 p-3 bg-gray-50 rounded-2xl shadow-lg hover:shadow-xl"
            >
              <img 
                src="https://cdn.poehali.dev/files/image-fotor-20260117124937.jpg"
                alt="QR Code"
                className="w-32 h-32 sm:w-40 sm:h-40"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}