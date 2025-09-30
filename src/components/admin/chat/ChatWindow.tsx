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
    <Card className="md:col-span-2 flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon name="MessageCircle" size={20} />
            {selectedUser ? `Чат с ${selectedUser.name}` : 'Выберите диалог'}
          </CardTitle>
          {selectedUser && messages.length > 0 && (
            <Button
              onClick={onClearChat}
              disabled={isDeleting}
              variant="destructive"
              size="sm"
            >
              {isDeleting ? (
                <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              ) : (
                <Icon name="Trash2" size={16} className="mr-2" />
              )}
              Очистить чат
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        {!selectedUser ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Icon name="MessageCircleOff" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Выберите пользователя для начала общения</p>
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