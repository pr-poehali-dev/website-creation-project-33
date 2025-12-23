import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  isRecording: boolean;
  isSending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSendMessage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancelFile: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onTyping: () => void;
}

export default function ChatInput({
  newMessage,
  setNewMessage,
  selectedFile,
  previewUrl,
  isRecording,
  isSending,
  fileInputRef,
  onSendMessage,
  onFileSelect,
  onCancelFile,
  onStartRecording,
  onStopRecording,
  onKeyPress,
  onTyping,
}: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(newMessage + emojiData.emoji);
    onTyping();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);
  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      {(selectedFile || previewUrl) && (
        <div className="mb-3 p-3 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {previewUrl && selectedFile?.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-xl" />
            )}
            {previewUrl && selectedFile?.type.startsWith('video/') && (
              <video src={previewUrl} className="w-14 h-14 object-cover rounded-xl" />
            )}
            {selectedFile?.type.startsWith('audio/') && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Icon name="Mic" size={18} className="text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Голосовое</span>
              </div>
            )}
            <span className="text-sm text-gray-500 font-medium">
              {selectedFile && (selectedFile.size / 1024).toFixed(0)} КБ
            </span>
          </div>
          <Button onClick={onCancelFile} variant="ghost" size="sm" className="rounded-full hover:bg-gray-200 text-gray-700">
            <Icon name="X" size={18} />
          </Button>
        </div>
      )}
      <div className="relative flex items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={onFileSelect}
          className="hidden"
        />
        
        <div className="flex-1 relative bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-gray-300 focus-within:ring-2 focus-within:ring-gray-200">
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              onTyping();
            }}
            onKeyDown={onKeyPress}
            placeholder="Введите сообщение..."
            className="min-h-[44px] max-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-5 pr-44 py-3 text-sm md:text-base text-gray-900 placeholder:text-gray-400 overflow-y-auto"
            maxLength={1000}
          />
          
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              variant="ghost"
              size="icon"
              disabled={isSending || isRecording}
              className="h-9 w-9 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <Icon name="Smile" size={18} />
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="icon"
              disabled={isSending || isRecording || selectedFile !== null}
              className="h-9 w-9 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            >
              <Icon name="Paperclip" size={18} />
            </Button>
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              variant="ghost"
              size="icon"
              disabled={isSending || selectedFile !== null}
              className={`h-9 w-9 rounded-full transition-all text-gray-500 ${isRecording ? 'bg-red-500/20 hover:bg-red-500/30 animate-pulse' : 'hover:bg-gray-100'}`}
            >
              <Icon name="Mic" size={18} className={isRecording ? 'text-red-600' : ''} />
            </Button>
            {(newMessage.trim() || selectedFile) && (
              <Button
                onClick={onSendMessage}
                disabled={isSending}
                className="h-9 w-9 rounded-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                size="icon"
              >
                {isSending ? (
                  <Icon name="Loader2" size={18} className="animate-spin" />
                ) : (
                  <Icon name="Send" size={18} />
                )}
              </Button>
            )}
          </div>
          
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-16 right-2 z-50 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
              <EmojiPicker onEmojiClick={handleEmojiClick} width={320} height={400} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}