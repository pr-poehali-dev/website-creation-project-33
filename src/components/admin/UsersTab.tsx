import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import UserCard from './UserCard';
import UserLeadsModal from './UserLeadsModal';
import { User, Lead } from './types';
import { formatMoscowTime } from '@/utils/timeFormat';
import { useUsers, useUpdateUserName, useDeleteUser, useActivateUser, useUserLeads, useDeleteLead, useDeleteLeadsByDate } from '@/hooks/useAdminData';

interface UsersTabProps {
  enabled?: boolean;
}

export default function UsersTab({ enabled = true }: UsersTabProps) {
  const { data: usersData, isLoading: loading } = useUsers(enabled);
  const activeUsers = usersData?.active || [];
  const inactiveUsers = usersData?.inactive || [];
  
  console.log('👤 Active users with IP:', activeUsers.map(u => ({ name: u.name, ip: u.registration_ip })));
  const updateUserNameMutation = useUpdateUserName();
  const deleteUserMutation = useDeleteUser();
  const activateUserMutation = useActivateUser();
  const deleteLeadMutation = useDeleteLead();
  const deleteLeadsByDateMutation = useDeleteLeadsByDate();
  
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { data: userLeads = [], isLoading: leadsLoading } = useUserLeads(selectedUser?.id || null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllInactive, setShowAllInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inactiveSearchQuery, setInactiveSearchQuery] = useState('');



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
    if (!confirm('Вы уверены, что хотите деактивировать этого пользователя? Это действие заблокирует его IP.')) {
      return;
    }
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch {
      alert('Ошибка при деактивации пользователя');
    }
  };

  const activateUser = async (userId: number) => {
    if (!confirm('Вы уверены, что хотите активировать этого пользователя?')) {
      return;
    }
    try {
      await activateUserMutation.mutateAsync(userId);
    } catch {
      alert('Ошибка при активации пользователя');
    }
  };



  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-slate-300 flex items-center justify-center gap-3 font-medium">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка пользователей...
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlineUsers = activeUsers.filter(u => u.is_online).length;
  const groupedLeads = groupLeadsByDate(userLeads);
  
  const filteredActiveUsers = activeUsers
    .filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  
  const filteredInactiveUsers = inactiveUsers
    .filter(user => 
      user.name.toLowerCase().includes(inactiveSearchQuery.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  
  const displayedActiveUsers = showAllActive ? filteredActiveUsers : filteredActiveUsers.slice(0, 4);
  const hasMoreActiveUsers = filteredActiveUsers.length > 4;
  
  const displayedInactiveUsers = showAllInactive ? filteredInactiveUsers : filteredInactiveUsers.slice(0, 4);
  const hasMoreInactiveUsers = filteredInactiveUsers.length > 4;

  return (
    <>
    <Card className="bg-slate-900 border-slate-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-slate-100 gap-3">
          <span className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
            <div className="p-2 rounded-lg bg-slate-800">
              <Icon name="Users" size={18} className="text-cyan-400 md:w-5 md:h-5" />
            </div>
            Активные пользователи ({activeUsers.length})
          </span>
          <Badge className="bg-slate-800 text-green-400 border border-green-400/30 flex items-center gap-2 px-2 md:px-3 py-1 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Онлайн: {onlineUsers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-slate-600 focus:ring-slate-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {filteredActiveUsers.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Icon name="SearchX" size={48} className="mx-auto mb-3 text-slate-600" />
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            <>
              {displayedActiveUsers.map((user) => (
                <UserCard
                  key={user.id}
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
              ))}
              {hasMoreActiveUsers && !showAllActive && (
                <button
                  onClick={() => setShowAllActive(true)}
                  className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <Icon name="ChevronDown" size={20} />
                  Показать еще ({filteredActiveUsers.length - 4})
                </button>
              )}
              {showAllActive && hasMoreActiveUsers && (
                <button
                  onClick={() => setShowAllActive(false)}
                  className="w-full mt-4 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium border border-slate-700"
                >
                  <Icon name="ChevronUp" size={20} />
                  Свернуть
                </button>
              )}
            </>
          )}
        </div>
      </CardContent>

      <UserLeadsModal
        userName={selectedUser?.name || null}
        leads={userLeads}
        isLoading={leadsLoading}
        selectedDate={selectedDate}
        groupedLeads={groupedLeads}
        onDateSelect={setSelectedDate}
        onDeleteLead={deleteLead}
        onDeleteDate={deleteLeadsByDate}
        onClose={() => {
          setSelectedUser(null);
          setSelectedDate(null);
        }}
      />
    </Card>

    {inactiveUsers.length > 0 && (
      <Card className="bg-slate-900 border-red-700 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300 mt-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-slate-100 gap-3">
            <span className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
              <div className="p-2 rounded-lg bg-slate-800">
                <Icon name="UserX" size={18} className="text-red-400 md:w-5 md:h-5" />
              </div>
              Деактивированные пользователи ({inactiveUsers.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <div className="relative">
              <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Поиск по имени..."
                value={inactiveSearchQuery}
                onChange={(e) => setInactiveSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-slate-600 focus:ring-slate-600"
              />
              {inactiveSearchQuery && (
                <button
                  onClick={() => setInactiveSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  <Icon name="X" size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {filteredInactiveUsers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Icon name="SearchX" size={48} className="mx-auto mb-3 text-slate-600" />
                <p>Пользователи не найдены</p>
              </div>
            ) : (
              <>
            {displayedInactiveUsers.map((user) => (
              <div key={user.id} className="bg-slate-800/50 border border-red-700/30 rounded-xl p-3 md:p-4">
                <div className="flex flex-col gap-3 mb-2">
                  <div className="flex-1">
                    <h3 className="text-slate-100 font-semibold text-base md:text-lg">{user.name}</h3>
                    <p className="text-slate-400 text-xs md:text-sm">{user.email}</p>
                    {user.registration_ip && (
                      <p className="text-red-400 text-xs mt-1 font-medium">IP заблокирован: {user.registration_ip}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => activateUser(user.id)}
                      className="px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 flex items-center gap-1.5 md:gap-2 text-xs md:text-sm flex-1 md:flex-initial justify-center"
                      title="Активировать пользователя и разблокировать его IP"
                    >
                      <Icon name="UserCheck" size={14} className="md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Активировать</span>
                      <span className="sm:hidden">Актив.</span>
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-slate-400 mt-3">
                  <div>Лидов: {user.lead_count}</div>
                  <div>Смен: {user.shifts_count || 0}</div>
                  {user.last_shift_date && <div className="hidden sm:block">Последняя смена: {user.last_shift_date}</div>}
                </div>
              </div>
            ))}
            {hasMoreInactiveUsers && !showAllInactive && (
              <button
                onClick={() => setShowAllInactive(true)}
                className="w-full mt-4 py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <Icon name="ChevronDown" size={20} />
                Показать еще ({filteredInactiveUsers.length - 4})
              </button>
            )}
            {showAllInactive && hasMoreInactiveUsers && (
              <button
                onClick={() => setShowAllInactive(false)}
                className="w-full mt-4 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium border border-slate-700"
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
    )}
    </>
  );
}