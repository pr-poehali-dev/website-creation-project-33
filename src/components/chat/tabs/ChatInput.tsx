import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (msg: string) => void;
  handleTyping: () => void;
  sendMessage: () => void;
  isSending: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cancelFile: () => void;
  isGroup: boolean;
  isRecording: boolean;
  recordingTime?: number;
  startRecording: () => void;
  stopRecording: () => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  emojiPickerRef: React.RefObject<HTMLDivElement>;
  handleEmojiClick: (emojiData: EmojiClickData) => void;
}

export default function ChatInput({
  newMessage,
  setNewMessage,
  handleTyping,
  sendMessage,
  isSending,
  selectedFile,
  previewUrl,
  fileInputRef,
  handleFileSelect,
  cancelFile,
  isGroup,
  isRecording,
  recordingTime = 0,
  startRecording,
  stopRecording,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  handleEmojiClick,
}: ChatInputProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <>
      {previewUrl && (
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="relative inline-block">
            {selectedFile?.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="max-h-20 rounded" />
            )}
            {selectedFile?.type.startsWith('video/') && (
              <video src={previewUrl} className="max-h-20 rounded" />
            )}
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2"
              onClick={cancelFile}
            >
              <Icon name="X" size={16} />
            </Button>
          </div>
        </div>
      )}

      {selectedFile && selectedFile.type.startsWith('audio/') && (
        <div className="px-4 py-2 border-t bg-gray-50 flex items-center gap-2">
          <Icon name="Mic" size={16} />
          <span className="text-sm">Голосовое сообщение готово</span>
          <Button size="sm" variant="ghost" onClick={cancelFile}>
            <Icon name="X" size={16} />
          </Button>
        </div>
      )}

      {isRecording && (
        <div className="px-4 py-2 border-t bg-red-50 flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-600">
              Идет запись: {formatTime(recordingTime)}
            </span>
          </div>
          <span className="text-xs text-gray-500">макс. 2 мин</span>
        </div>
      )}

      <div className="p-4 border-t bg-white relative">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isSending || isRecording}
          >
            <Icon name="Smile" size={20} />
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || selectedFile !== null || isRecording}
          >
            <Icon name="Paperclip" size={20} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending || selectedFile !== null}
            className={isRecording ? 'text-red-500 bg-red-100' : ''}
          >
            <Icon name="Mic" size={20} />
          </Button>

          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Написать сообщение..."
            className="min-h-[40px] max-h-[120px] resize-none"
            disabled={isSending}
          />

          <Button
            onClick={sendMessage}
            disabled={isSending || (!newMessage.trim() && !selectedFile)}
          >
            {isSending ? (
              <Icon name="Loader2" className="animate-spin" size={20} />
            ) : (
              <Icon name="Send" size={20} />
            )}
          </Button>
        </div>
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef} 
            className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <EmojiPicker 
              onEmojiClick={handleEmojiClick} 
              width={300} 
              height={400} 
            />
          </div>
        )}
      </div>
    </>
  );
}