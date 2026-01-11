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
    <div className="p-4 border-t border-slate-700 bg-slate-900">
      {(selectedFile || previewUrl) && (
        <div className="mb-3 p-3 bg-slate-800 rounded-2xl border border-slate-600 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {previewUrl && selectedFile?.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-xl" />
            )}
            {previewUrl && selectedFile?.type.startsWith('video/') && (
              <video src={previewUrl} className="w-14 h-14 object-cover rounded-xl" />
            )}
            {selectedFile?.type.startsWith('audio/') && (
              <div className="flex items-center gap-2 bg-cyan-500/20 px-3 py-2 rounded-lg">
                <Icon name="Mic" size={18} className="text-cyan-400" />
                <span className="text-sm font-medium text-slate-100">Голосовое</span>
              </div>
            )}
            <span className="text-sm text-slate-400 font-medium">
              {selectedFile && (selectedFile.size / 1024).toFixed(0)} КБ
            </span>
          </div>
          <Button onClick={onCancelFile} variant="ghost" size="sm" className="rounded-full hover:bg-slate-700 text-slate-300">
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
        
        <div className="flex-1 relative bg-slate-800 rounded-3xl border border-slate-600 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/30 flex items-center">
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              onTyping();
            }}
            onKeyDown={onKeyPress}
            placeholder="Введите сообщение..."
            className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pl-5 pr-2 py-3 text-sm md:text-base text-slate-100 placeholder:text-slate-500 overflow-y-auto leading-snug"
            maxLength={1000}
          />
          
          <div className="flex items-center gap-1 pr-2 flex-shrink-0">
            <Button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              variant="ghost"
              size="icon"
              disabled={isSending || isRecording}
              className="h-9 w-9 rounded-full hover:bg-slate-700 transition-colors text-slate-400"
            >
              <Icon name="Smile" size={18} />
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="icon"
              disabled={isSending || isRecording || selectedFile !== null}
              className="h-9 w-9 rounded-full hover:bg-slate-700 transition-colors text-slate-400"
            >
              <Icon name="Paperclip" size={18} />
            </Button>
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              variant="ghost"
              size="icon"
              disabled={isSending || selectedFile !== null}
              className={`h-9 w-9 rounded-full transition-all text-slate-400 ${isRecording ? 'bg-red-500/20 hover:bg-red-500/30 animate-pulse' : 'hover:bg-slate-700'}`}
            >
              <Icon name="Mic" size={18} className={isRecording ? 'text-red-500' : ''} />
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