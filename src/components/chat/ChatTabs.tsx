import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ChatTabs({ open, onOpenChange, organizationId }: ChatTabsProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
  const [profileOpen, setProfileOpen] = useState(false);

  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording } = useRecording();

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden border-0 shadow-2xl">

          {/* Header */}
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 bg-white border-b border-gray-100">
            <button
              onClick={() => setProfileOpen(true)}
              className="w-9 h-9 rounded-xl bg-[#001f54] flex items-center justify-center flex-shrink-0 hover:bg-[#001f54]/80 transition-colors"
            >
              <Icon name="User" size={16} className="text-white" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-gray-900 leading-none">Чаты</h2>
              {organizationId && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">Площадка #{organizationId}</p>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Icon name="X" size={15} className="text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-4 pt-3 pb-0 gap-1 bg-white">
            {([
              { key: 'personal', label: 'Личный', icon: 'User' },
              { key: 'group', label: 'Групповой', icon: 'Users' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-xl transition-all ${
                  activeTab === tab.key
                    ? 'bg-[#001f54] text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <Icon name={tab.icon} size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0 mt-2">
            {activeTab === 'personal' && (
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
            )}
            {activeTab === 'group' && (
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
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
