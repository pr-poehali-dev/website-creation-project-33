import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import UserCard from './UserCard';
import UserLeadsSection from './UserLeadsSection';
import { User, Lead, ADMIN_API } from './types';

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLeads, setUserLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
      const date = new Date(lead.created_at).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
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
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="border-[#001f54]/20 shadow-xl bg-white">
        <CardContent className="p-8">
          <div className="text-center text-[#001f54] flex items-center justify-center gap-3 font-medium">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка пользователей...
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlineUsers = users.filter(u => u.is_online).length;
  const groupedLeads = groupLeadsByDate(userLeads);

  return (
    <Card className="border-[#001f54]/20 shadow-xl bg-white slide-up hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[#001f54] gap-3">
          <span className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
            <div className="p-2 rounded-lg bg-[#001f54]/10">
              <Icon name="Users" size={18} className="text-[#001f54] md:w-5 md:h-5" />
            </div>
            Пользователи ({users.length})
          </span>
          <Badge className="bg-green-100 text-green-800 border border-green-200 flex items-center gap-2 px-2 md:px-3 py-1 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Онлайн: {onlineUsers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
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
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}