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
}: ChatInputProps) {
  return (
    <div className="p-3 md:p-4 border-t bg-gray-50">
      {(selectedFile || previewUrl) && (
        <div className="mb-2 md:mb-3 p-2 md:p-3 bg-white rounded-lg border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {previewUrl && selectedFile?.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="w-12 h-12 md:w-16 md:h-16 object-cover rounded" />
            )}
            {previewUrl && selectedFile?.type.startsWith('video/') && (
              <video src={previewUrl} className="w-12 h-12 md:w-16 md:h-16 object-cover rounded" />
            )}
            {selectedFile?.type.startsWith('audio/') && (
              <div className="flex items-center gap-2">
                <Icon name="Mic" size={18} className="text-blue-600" />
                <span className="text-xs md:text-sm">Голосовое</span>
              </div>
            )}
            <span className="text-xs md:text-sm text-gray-600">
              {selectedFile && (selectedFile.size / 1024).toFixed(0)} КБ
            </span>
          </div>
          <Button onClick={onCancelFile} variant="ghost" size="sm">
            <Icon name="X" size={16} />
          </Button>
        </div>
      )}
      <div className="flex gap-2 mb-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={onFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          size="icon"
          disabled={isSending || isRecording || selectedFile !== null}
          className="shrink-0 h-10 w-10 md:h-10 md:w-10"
        >
          <Icon name="Paperclip" size={18} />
        </Button>
        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          variant="outline"
          size="icon"
          disabled={isSending || selectedFile !== null}
          className={`shrink-0 h-10 w-10 md:h-10 md:w-10 ${isRecording ? 'bg-red-100 border-red-300' : ''}`}
        >
          <Icon name="Mic" size={18} className={isRecording ? 'text-red-500' : ''} />
        </Button>
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Напишите сообщение..."
          className="min-h-[40px] md:min-h-[60px] max-h-[100px] md:max-h-[120px] resize-none bg-white text-sm"
          maxLength={1000}
        />
        <Button
          onClick={onSendMessage}
          disabled={(!newMessage.trim() && !selectedFile) || isSending}
          className="self-end h-10 w-10 md:h-10 md:w-10"
          size="icon"
        >
          {isSending ? (
            <Icon name="Loader2" size={18} className="animate-spin" />
          ) : (
            <Icon name="Send" size={18} />
          )}
        </Button>
      </div>
      <p className="text-[10px] md:text-xs text-gray-500">
        {newMessage.length}/1000 {selectedFile && `• ${selectedFile.name}`}
      </p>
    </div>
  );
}