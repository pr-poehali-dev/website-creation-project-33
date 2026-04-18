import Icon from '@/components/ui/icon';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onTyping: () => void;
  onSendMessage: () => void;
  isSending: boolean;
  selectedFile: File | null;
  previewUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
  isRecording: boolean;
  recordingTime?: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording?: () => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (show: boolean) => void;
  emojiPickerRef: React.RefObject<HTMLDivElement>;
  onEmojiClick: (emojiData: EmojiClickData) => void;
}

export default function ChatInput({
  newMessage,
  setNewMessage,
  onTyping,
  onSendMessage,
  isSending,
  selectedFile,
  previewUrl,
  fileInputRef,
  onFileSelect,
  onRemoveFile,
  isRecording,
  recordingTime = 0,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  showEmojiPicker,
  setShowEmojiPicker,
  emojiPickerRef,
  onEmojiClick,
}: ChatInputProps) {
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const canSend = !isSending && (!!newMessage.trim() || !!selectedFile);

  return (
    <div className="border-t border-gray-100 bg-white relative">

      {/* Image/video preview */}
      {previewUrl && selectedFile && !selectedFile.type.startsWith('audio/') && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            {selectedFile.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="max-h-24 rounded-xl object-cover" />
            )}
            {selectedFile.type.startsWith('video/') && (
              <video src={previewUrl} className="max-h-24 rounded-xl" />
            )}
            <button
              onClick={onRemoveFile}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <Icon name="X" size={11} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* Audio preview */}
      {selectedFile?.type.startsWith('audio/') && (
        <div className="mx-4 mt-3 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-[#001f54] flex items-center justify-center">
            <Icon name="Mic" size={13} className="text-white" />
          </div>
          <span className="text-sm text-gray-600 flex-1">Голосовое сообщение</span>
          <button onClick={onRemoveFile} className="text-gray-400 hover:text-red-500 transition-colors">
            <Icon name="X" size={14} />
          </button>
        </div>
      )}

      {/* Recording indicator — Telegram style */}
      {isRecording && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-white">
          {/* Mic pulse */}
          <div className="relative flex-shrink-0">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-60" />
          </div>

          {/* Waveform bars */}
          <div className="flex items-center gap-[3px] flex-1">
            {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 0.4, 0.7, 1, 0.6, 0.85, 0.5, 0.75, 0.4, 0.9, 0.6, 1, 0.5, 0.7].map((h, i) => (
              <div
                key={i}
                className="w-[3px] bg-red-400 rounded-full"
                style={{
                  height: `${Math.round(h * 18) + 4}px`,
                  animation: `waveBar 0.8s ease-in-out infinite`,
                  animationDelay: `${(i % 5) * 0.12}s`,
                  opacity: 0.7 + h * 0.3,
                }}
              />
            ))}
          </div>

          {/* Timer */}
          <span className="text-sm font-medium text-red-500 tabular-nums flex-shrink-0">
            {formatTime(recordingTime)}
          </span>

          {/* Cancel */}
          {onCancelRecording && (
            <button
              onClick={onCancelRecording}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Icon name="X" size={16} />
            </button>
          )}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 px-3 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={onFileSelect}
        />

        {/* Emoji */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={isSending || isRecording}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-40"
        >
          <Icon name="Smile" size={20} />
        </button>

        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending || !!selectedFile || isRecording}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-40"
        >
          <Icon name="Paperclip" size={20} />
        </button>

        {/* Textarea */}
        <textarea
          value={newMessage}
          onChange={(e) => { setNewMessage(e.target.value); onTyping(); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSendMessage(); }
          }}
          placeholder="Сообщение..."
          rows={1}
          disabled={isSending}
          className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#001f54]/30 focus:ring-2 focus:ring-[#001f54]/10 transition-all max-h-28 leading-5 disabled:opacity-60"
          onInput={(e) => {
            const t = e.currentTarget;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 112) + 'px';
          }}
        />

        {/* Send / Mic */}
        {canSend ? (
          <button
            onClick={onSendMessage}
            disabled={isSending}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#001f54] hover:bg-[#001f54]/80 text-white transition-colors flex-shrink-0 disabled:opacity-60 shadow-sm"
          >
            {isSending
              ? <Icon name="Loader2" size={18} className="animate-spin" />
              : <Icon name="Send" size={17} />
            }
          </button>
        ) : (
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isSending || !!selectedFile}
            className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-colors flex-shrink-0 disabled:opacity-40 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
            }`}
          >
            <Icon name="Mic" size={18} />
          </button>
        )}
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute bottom-full left-4 z-50 shadow-2xl rounded-2xl overflow-hidden mb-2"
        >
          <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={380} />
        </div>
      )}
    </div>
  );
}