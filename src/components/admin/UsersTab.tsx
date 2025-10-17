import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import UserCard from './UserCard';
import UserLeadsSection from './UserLeadsSection';
import { User, Lead, ADMIN_API } from './types';
import { formatMoscowTime } from '@/utils/timeFormat';

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLeads, setUserLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getSessionToken = () => localStorage.getItem('session_token');

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${ADMIN_API}?action=users`, {
        headers: {
          'X-Session-Token': getSessionToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const updateUserName = async (userId: number, name: string) => {
    try {
      const response = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'update_user',
          user_id: userId,
          name: name,
        }),
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
        setNewName('');
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user.id);
    setNewName(user.name);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewName('');
  };

  const fetchUserLeads = async (userId: number) => {
    setLeadsLoading(true);
    try {
      const response = await fetch(`${ADMIN_API}?action=user_leads&user_id=${userId}`, {
        headers: {
          'X-Session-Token': getSessionToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching user leads:', error);
    }
    setLeadsLoading(false);
  };

  const deleteLead = async (leadId: number) => {
    if (!confirm('Вы уверены, что хотите удалить этот лид?')) {
      return;
    }

    try {
      const response = await fetch(ADMIN_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'delete_lead',
          lead_id: leadId
        })
      });

      if (response.ok) {
        if (selectedUser) {
          fetchUserLeads(selectedUser.id);
        }
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const deleteLeadsByDate = async (date: string) => {
    if (!selectedUser) return;

    const leadsCount = groupedLeads[date]?.length || 0;
    if (!confirm(`Вы уверены, что хотите удалить все ${leadsCount} лид(ов) за ${date}? Это действие нельзя отменить.`)) {
      return;
    }

    // Конвертируем дату из DD.MM.YYYY в YYYY-MM-DD для backend
    const [day, month, year] = date.split('.');
    const isoDate = `${year}-${month}-${day}`;

    try {
      const response = await fetch(ADMIN_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'delete_leads_by_date',
          user_id: selectedUser.id,
          date: isoDate
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Удалено лидов: ${data.deleted_count}`);
        fetchUserLeads(selectedUser.id);
        setSelectedDate(null);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting leads by date:', error);
      alert('Ошибка при удалении лидов');
    }
  };

  const handleUserClick = (user: User) => {
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
      setUserLeads([]);
      setSelectedDate(null);
    } else {
      setSelectedUser(user);
      fetchUserLeads(user.id);
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
      const response = await fetch(ADMIN_API, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': getSessionToken() || '',
        },
        body: JSON.stringify({
          action: 'delete_user',
          user_id: userId,
        }),
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        alert('Ошибка при удалении пользователя');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Ошибка при удалении пользователя');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Card className="glass-panel border-white/10 rounded-2xl">
        <CardContent className="p-8">
          <div className="text-center text-white flex items-center justify-center gap-3 font-medium">
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
    <Card className="glass-panel border-white/10 rounded-2xl slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3">
          <span className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
            <div className="p-2 rounded-lg bg-white/5">
              <Icon name="Users" size={18} className="text-white md:w-5 md:h-5" />
            </div>
            Пользователи ({users.length})
          </span>
          <Badge className="bg-white/5 text-green-400 border border-green-400/30 flex items-center gap-2 px-2 md:px-3 py-1 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Онлайн: {onlineUsers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-6">
          <div className="relative">
            <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <Input
              type="text"
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/50 focus:border-white/30 focus:ring-white/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70"
              >
                <Icon name="X" size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-white/70">
              <Icon name="SearchX" size={48} className="mx-auto mb-3 text-white/30" />
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
                  className="w-full mt-4 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <Icon name="ChevronDown" size={20} />
                  Показать еще ({filteredUsers.length - 4})
                </button>
              )}
              {showAll && hasMoreUsers && (
                <button
                  onClick={() => setShowAll(false)}
                  className="w-full mt-4 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium"
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