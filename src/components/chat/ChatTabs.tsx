import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import ProfileModal from '@/components/user/ProfileModal';
import PersonalChatTab from './tabs/PersonalChatTab';
import GroupChatTab from './tabs/GroupChatTab';
import { useRecording } from './tabs/useRecording';

interface ChatTabsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: number | null;
}

const CHAT_API_URL = 'https://functions.poehali.dev/cad0f9c1-a7f9-476f-b300-29e671bbaa2c';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 МБ

export default function ChatTabs({ open, onOpenChange, organizationId }: ChatTabsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [profileOpen, setProfileOpen] = useState(false);

  const {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useRecording();

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setProfileOpen(true)}
              >
                <Icon name="User" size={20} />
              </Button>
              <div>
                <h2 className="text-lg font-semibold">Чаты</h2>
                {organizationId && (
                  <p className="text-xs text-gray-500">Организация: {organizationId}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <Icon name="X" size={20} />
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b">
              <TabsTrigger value="personal" className="flex-1">
                <Icon name="User" size={16} className="mr-2" />
                Личный чат
              </TabsTrigger>
              <TabsTrigger value="group" className="flex-1">
                <Icon name="Users" size={16} className="mr-2" />
                Групповой чат
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="flex-1 flex flex-col m-0">
              <PersonalChatTab
                isActive={activeTab === 'personal'}
                chatApiUrl={CHAT_API_URL}
                maxFileSize={MAX_FILE_SIZE}
                isRecording={isRecording}
                recordingTime={recordingTime}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onCancelRecording={cancelRecording}
              />
            </TabsContent>

            <TabsContent value="group" className="flex-1 flex flex-col m-0">
              <GroupChatTab
                isActive={activeTab === 'group'}
                chatApiUrl={CHAT_API_URL}
                maxFileSize={MAX_FILE_SIZE}
                isRecording={isRecording}
                recordingTime={recordingTime}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onCancelRecording={cancelRecording}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
