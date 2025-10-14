import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

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
  return (
    <div className="p-4 border-t border-white/10 bg-white/5">
      {(selectedFile || previewUrl) && (
        <div className="mb-3 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {previewUrl && selectedFile?.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="w-14 h-14 object-cover rounded-xl" />
            )}
            {previewUrl && selectedFile?.type.startsWith('video/') && (
              <video src={previewUrl} className="w-14 h-14 object-cover rounded-xl" />
            )}
            {selectedFile?.type.startsWith('audio/') && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                <Icon name="Mic" size={18} className="text-blue-400" />
                <span className="text-sm font-medium text-white">Голосовое</span>
              </div>
            )}
            <span className="text-sm text-white/50 font-medium">
              {selectedFile && (selectedFile.size / 1024).toFixed(0)} КБ
            </span>
          </div>
          <Button onClick={onCancelFile} variant="ghost" size="sm" className="rounded-full hover:bg-white/10 text-white">
            <Icon name="X" size={18} />
          </Button>
        </div>
      )}
      <div className="relative flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={onFileSelect}
          className="hidden"
        />
        
        <div className="flex-1 relative bg-white/5 rounded-3xl border border-white/10 shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/20">
          <Textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              onTyping();
            }}
            onKeyDown={onKeyPress}
            placeholder="Введите сообщение..."
            className="min-h-[52px] max-h-[120px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-5 py-4 pr-28 text-base text-white placeholder:text-white/40"
            maxLength={1000}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="ghost"
              size="icon"
              disabled={isSending || isRecording || selectedFile !== null}
              className="h-9 w-9 rounded-full hover:bg-white/10 transition-colors text-white/70"
            >
              <Icon name="Paperclip" size={18} />
            </Button>
            <Button
              onClick={isRecording ? onStopRecording : onStartRecording}
              variant="ghost"
              size="icon"
              disabled={isSending || selectedFile !== null}
              className={`h-9 w-9 rounded-full transition-all text-white/70 ${isRecording ? 'bg-red-500/20 hover:bg-red-500/30 animate-pulse' : 'hover:bg-white/10'}`}
            >
              <Icon name="Mic" size={18} className={isRecording ? 'text-red-400' : ''} />
            </Button>
          </div>
        </div>
        
        <Button
          onClick={onSendMessage}
          disabled={(!newMessage.trim() && !selectedFile) || isSending}
          className="glass-button h-[52px] w-[52px] rounded-full bg-white/10 hover:bg-white/20 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          size="icon"
        >
          {isSending ? (
            <Icon name="Loader2" size={20} className="animate-spin" />
          ) : (
            <Icon name="Send" size={20} />
          )}
        </Button>
      </div>
    </div>
  );
}