import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import AudioPlayer from './AudioPlayer';


interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_online: boolean;
  last_seen: string;
  created_at: string;
  lead_count: number;
}

interface Lead {
  id: number;
  notes: string;
  has_audio: boolean;
  audio_data: string | null;
  created_at: string;
}

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLeads, setUserLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

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
        // Обновляем список лидов после удаления
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
    } else {
      setSelectedUser(user);
      fetchUserLeads(user.id);
    }
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
    // Обновляем список каждые 30 секунд для актуального онлайн статуса
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="border-gray-200 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="text-center text-gray-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка пользователей...
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlineUsers = users.filter(u => u.is_online).length;

  return (
    <Card className="border-gray-200 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-black gap-3">
          <span className="flex items-center gap-2 md:gap-3 text-lg md:text-xl">
            <div className="p-2 rounded-lg bg-gray-100">
              <Icon name="Users" size={18} className="text-gray-600 md:w-5 md:h-5" />
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
          {users.map((user, index) => (
            <div key={user.id}>
              <div 
                className="border border-gray-100 rounded-xl p-3 md:p-4 hover:bg-gray-50 transition-all duration-300 cursor-pointer bg-white shadow-sm"
                onClick={() => handleUserClick(user)}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      {user.is_online ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      )}
                      {user.is_admin && (
                        <Badge className="bg-gray-100 text-black border border-gray-200 px-1.5 py-0.5 text-xs">
                          <Icon name="Shield" size={10} className="mr-1" />
                          <span className="hidden sm:inline">Админ</span>
                          <span className="sm:hidden">А</span>
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {editingUser === user.id ? (
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full max-w-48 border border-gray-200 bg-white text-black placeholder:text-gray-400 focus:border-gray-400 text-sm md:text-base"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateUserName(user.id, newName);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-medium text-black text-base md:text-lg truncate">{user.name}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 truncate">{user.email}</div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>
                          {user.is_online 
                            ? 'Онлайн сейчас' 
                            : `Был(а) онлайн: ${new Date(user.last_seen).toLocaleString('ru-RU')}`
                          }
                        </span>
                        <Badge className={`ml-2 px-1.5 py-0.5 text-xs ${
                          user.is_online 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-gray-100 text-black border border-gray-200'
                        }`}>
                          {user.lead_count} лидов
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2 flex-shrink-0">
                    {selectedUser?.id === user.id && (
                      <Icon name="ChevronDown" size={16} className="text-gray-500 md:mr-2" />
                    )}
                    
                    <div className="flex gap-1 md:gap-2" onClick={(e) => e.stopPropagation()}>
                      {editingUser === user.id ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateUserName(user.id, newName)}
                            disabled={!newName.trim()}
                            className="bg-black hover:bg-gray-800 text-white px-2 md:px-3 py-1 h-8"
                          >
                            <Icon name="Check" size={12} className="md:w-[14px] md:h-[14px]" />
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={cancelEdit}
                            className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-2 md:px-3 py-1 h-8"
                            variant="ghost"
                          >
                            <Icon name="X" size={12} className="md:w-[14px] md:h-[14px]" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => startEdit(user)}
                            disabled={user.is_admin}
                            className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-2 md:px-3 py-1 h-8"
                            variant="ghost"
                          >
                            <Icon name="Edit" size={12} className="md:w-[14px] md:h-[14px]" />
                          </Button>
                          {!user.is_admin && (
                            <Button 
                              size="sm" 
                              onClick={() => deleteUser(user.id)}
                              className="border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 px-2 md:px-3 py-1 h-8"
                              variant="ghost"
                            >
                              <Icon name="Trash2" size={12} className="md:w-[14px] md:h-[14px]" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Лиды пользователя */}
              {selectedUser?.id === user.id && (
                <div className="mt-4 ml-0 md:ml-8 space-y-3">
                  {leadsLoading ? (
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Icon name="Loader2" size={16} className="animate-spin" />
                        Загрузка лидов...
                      </div>
                    </div>
                  ) : userLeads.length > 0 ? (
                    userLeads.map((lead, leadIndex) => (
                      <div 
                        key={lead.id} 
                        className="border border-gray-100 rounded-lg p-3 md:p-4 bg-gray-50"
                      >
                        <div className="flex flex-col md:flex-row md:items-start gap-3">
                          <div className="p-2 rounded-lg bg-gray-200 flex-shrink-0 self-start">
                            <Icon name="MessageSquare" size={14} className="text-gray-700 md:w-4 md:h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                              <div className="text-gray-700 text-xs md:text-sm font-medium">
                                {new Date(lead.created_at).toLocaleString('ru-RU')}
                              </div>
                              <div className="flex items-center gap-1 self-start sm:self-auto">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteLead(lead.id)}
                                  className="h-7 w-7 md:h-8 md:w-8 p-0 hover:bg-gray-200"
                                  title="Удалить лид"
                                >
                                  <Icon name="Trash2" size={12} className="text-gray-600 md:w-[14px] md:h-[14px]" />
                                </Button>
                              </div>
                            </div>
                            
                            {lead.notes && (
                              <div className="border border-gray-200 bg-white rounded-lg p-2 md:p-3 mb-3">
                                <div className="text-gray-800 whitespace-pre-wrap text-sm md:text-base">
                                  {lead.notes}
                                </div>
                              </div>
                            )}
                            
                            {lead.has_audio && (
                              <AudioPlayer 
                                audioData={lead.audio_data}
                                leadId={lead.id}
                                className="mb-2"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="text-center text-gray-600">
                        <Icon name="MessageSquare" size={20} className="mx-auto mb-2 opacity-60 md:w-6 md:h-6" />
                        <div className="text-sm md:text-base">У этого пользователя пока нет лидов</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}