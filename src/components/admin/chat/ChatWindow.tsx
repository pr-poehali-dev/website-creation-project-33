import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Message, UserChat } from './types';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  selectedUser: UserChat | null;
  messages: Message[];
  isLoading: boolean;
  isDeleting: boolean;
  newMessage: string;
  setNewMessage: (message: string) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  isRecording: boolean;
  isSending: boolean;
  userTyping: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  scrollRef: React.RefObject<HTMLDivElement>;
  onBack?: () => void;
  onClearChat: () => void;
  onSendMessage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancelFile: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onTyping: () => void;
  currentAdminId?: number;
  onMessageDeleted?: (msgId: number) => void;
}

export default function ChatWindow({
  selectedUser,
  messages,
  isLoading,
  isDeleting,
  newMessage,
  setNewMessage,
  selectedFile,
  previewUrl,
  isRecording,
  isSending,
  userTyping,
  fileInputRef,
  scrollRef,
  onClearChat,
  onSendMessage,
  onFileSelect,
  onCancelFile,
  onStartRecording,
  onStopRecording,
  onKeyPress,
  onTyping,
  onBack,
  currentAdminId,
  onMessageDeleted,
}: ChatWindowProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 md:col-span-2 flex flex-col h-full shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <Icon name="ArrowLeft" size={18} />
            </button>
          )}
          <span className="text-sm font-semibold text-gray-800 truncate">
            {selectedUser ? selectedUser.name : 'Выберите диалог'}
          </span>
        </div>
        {selectedUser && messages.length > 0 && (
          <Button
            onClick={onClearChat}
            disabled={isDeleting}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
          >
            {isDeleting ? (
              <Icon name="Loader2" size={16} className="animate-spin" />
            ) : (
              <Icon name="Trash2" size={16} />
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 p-6">
            <div className="text-center">
              <Icon name="MessageCircleOff" size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Выберите пользователя для начала общения</p>
            </div>
          </div>
        ) : (
          <>
            <ChatMessages
              messages={messages}
              selectedUser={selectedUser}
              isLoading={isLoading}
              userTyping={userTyping}
              scrollRef={scrollRef}
              currentAdminId={currentAdminId}
              onMessageDeleted={onMessageDeleted}
            />
            <ChatInput
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              selectedFile={selectedFile}
              previewUrl={previewUrl}
              isRecording={isRecording}
              isSending={isSending}
              fileInputRef={fileInputRef}
              onSendMessage={onSendMessage}
              onFileSelect={onFileSelect}
              onCancelFile={onCancelFile}
              onStartRecording={onStartRecording}
              onStopRecording={onStopRecording}
              onKeyPress={onKeyPress}
              onTyping={onTyping}
            />
          </>
        )}
      </div>
    </div>
  );
}