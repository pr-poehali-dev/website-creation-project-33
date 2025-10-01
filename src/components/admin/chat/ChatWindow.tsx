import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  fileInputRef: React.RefObject<HTMLInputElement>;
  scrollRef: React.RefObject<HTMLDivElement>;
  onClearChat: () => void;
  onSendMessage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancelFile: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
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
  fileInputRef,
  scrollRef,
  onClearChat,
  onSendMessage,
  onFileSelect,
  onCancelFile,
  onStartRecording,
  onStopRecording,
  onKeyPress,
}: ChatWindowProps) {
  return (
    <Card className="md:col-span-2 flex flex-col h-full border-0 md:border rounded-none md:rounded-lg shadow-none md:shadow-sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm md:text-base">
            <Icon name="MessageCircle" size={18} className="md:w-5 md:h-5" />
            <span className="truncate">{selectedUser ? `Чат с ${selectedUser.name}` : 'Выберите диалог'}</span>
          </CardTitle>
          {selectedUser && messages.length > 0 && (
            <Button
              onClick={onClearChat}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
              className="h-8 px-2 md:px-3"
            >
              {isDeleting ? (
                <Icon name="Loader2" size={14} className="animate-spin md:mr-2 md:w-4 md:h-4" />
              ) : (
                <Icon name="Trash2" size={14} className="md:mr-2 md:w-4 md:h-4" />
              )}
              <span className="hidden md:inline">Очистить чат</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-4 md:p-6">
            <div className="text-center">
              <Icon name="MessageCircleOff" size={40} className="mx-auto mb-3 md:mb-4 opacity-50 md:w-12 md:h-12" />
              <p className="text-xs md:text-sm">Выберите пользователя для начала общения</p>
            </div>
          </div>
        ) : (
          <>
            <ChatMessages
              messages={messages}
              selectedUser={selectedUser}
              isLoading={isLoading}
              scrollRef={scrollRef}
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
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}