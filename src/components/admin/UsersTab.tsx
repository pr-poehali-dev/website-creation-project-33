import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import UserCard from './UserCard';
import UserLeadsSection from './UserLeadsSection';
import { User, Lead } from './types';
import { formatMoscowTime } from '@/utils/timeFormat';
import { useUsers, useUpdateUserName, useDeleteUser, useUserLeads, useDeleteLead, useDeleteLeadsByDate } from '@/hooks/useAdminData';

interface UsersTabProps {
  enabled?: boolean;
}

export default function UsersTab({ enabled = true }: UsersTabProps) {
  const { data: users = [], isLoading: loading } = useUsers(enabled);
  const updateUserNameMutation = useUpdateUserName();
  const deleteUserMutation = useDeleteUser();
  const deleteLeadMutation = useDeleteLead();
  const deleteLeadsByDateMutation = useDeleteLeadsByDate();
  
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: userLeads = [], isLoading: leadsLoading } = useUserLeads(selectedUser?.id || null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');



  const updateUserName = async (userId: number, name: string) => {
    await updateUserNameMutation.mutateAsync({ userId, name });
    setEditingUser(null);
    setNewName('');
  };

  const startEdit = (user: User) => {
    setEditingUser(user.id);
    setNewName(user.name);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewName('');
  };



  const deleteLead = async (leadId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот лид?')) {
      return;
    }
    await deleteLeadMutation.mutateAsync(leadId);
  };

  const deleteLeadsByDate = async (date: string) => {
    if (!selectedUser) return;

    const leadsCount = groupedLeads[date]?.length || 0;
    if (!confirm(`Вы уверены, что хотите удалить все ${leadsCount} лид(ов) за ${date}? Это действие нельзя отменить.`)) {
      return;
    }

    const [day, month, year] = date.split('.');
    const isoDate = `${year}-${month}-${day}`;

    const result = await deleteLeadsByDateMutation.mutateAsync({ userId: selectedUser.id, date: isoDate });
    alert(`Удалено лидов: ${result.deleted_count}`);
    setSelectedDate(null);
  };

  const handleUserClick = (user: User) => {
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
      setSelectedDate(null);
    } else {
      setSelectedUser(user);
      setSelectedDate(null);
    }
  };

  const groupLeadsByDate = (leads: Lead[]): Record<string, Lead[]> => {
    const grouped: Record<string, Lead[]> = {};
    
    leads.forEach(lead => {
      const date = formatMoscowTime(lead.created_at, 'date');
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(lead);
    });
    
    return grouped;
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить.')) {
      return;
    }
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch {
      alert('Ошибка при удалении пользователя');
    }
  };



  if (loading) {
    return (
      <Card className="bg-white border-gray-200 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-gray-900 flex items-center justify-center gap-3 font-medium">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка пользователей...
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlineUsers = users.filter(u => u.is_online).length;
  const groupedLeads = groupLeadsByDate(userLeads);
  
  const filteredUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.lead_count - a.lead_count);
  
  const displayedUsers = showAll ? filteredUsers : filteredUsers.slice(0, 4);
  const hasMoreUsers = filteredUsers.length > 4;

  return (
    <Card className="bg-white border-gray-200 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-gray-900 gap-3">
          <span className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
            <div className="p-2 rounded-lg bg-gray-100">
              <Icon name="Users" size={18} className="text-gray-900 md:w-5 md:h-5" />
            </div>
            Пользователи ({users.length})
          </span>
          <Badge className="bg-gray-100 text-green-400 border border-green-400/30 flex items-center gap-2 px-2 md:px-3 py-1 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Онлайн: {onlineUsers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <Input
              type="text"
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-gray-300 focus:ring-gray-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Icon name="SearchX" size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            <>
              {displayedUsers.map((user) => (
                <div key={user.id}>
                  <UserCard
                    user={user}
                    isSelected={selectedUser?.id === user.id}
                    isEditing={editingUser === user.id}
                    editName={newName}
                    onUserClick={() => handleUserClick(user)}
                    onStartEdit={() => startEdit(user)}
                    onCancelEdit={cancelEdit}
                    onUpdateName={() => updateUserName(user.id, newName)}
                    onDeleteUser={() => deleteUser(user.id)}
                    onEditNameChange={setNewName}
                  />

                  {selectedUser?.id === user.id && (
                    <div className="mt-4 ml-0 md:ml-8">
                      <UserLeadsSection
                        leads={userLeads}
                        isLoading={leadsLoading}
                        selectedDate={selectedDate}
                        groupedLeads={groupedLeads}
                        onDateSelect={setSelectedDate}
                        onDeleteLead={deleteLead}
                        onDeleteDate={deleteLeadsByDate}
                      />
                    </div>
                  )}
                </div>
              ))}
              {hasMoreUsers && !showAll && (
                <button
                  onClick={() => setShowAll(true)}
                  className="w-full mt-4 py-3 px-4 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <Icon name="ChevronDown" size={20} />
                  Показать еще ({filteredUsers.length - 4})
                </button>
              )}
              {showAll && hasMoreUsers && (
                <button
                  onClick={() => setShowAll(false)}
                  className="w-full mt-4 py-3 px-4 bg-gray-100 hover:bg-gray-100 text-gray-900 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <Icon name="ChevronUp" size={20} />
                  Свернуть
                </button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}