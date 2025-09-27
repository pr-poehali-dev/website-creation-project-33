import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';


interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

interface Lead {
  id: number;
  notes: string;
  has_audio: boolean;
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
      <Card className="border-blue-200 shadow-lg bg-white">
        <CardContent className="p-8">
          <div className="text-center text-blue-600 flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка пользователей...
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlineUsers = users.filter(u => u.is_online).length;

  return (
    <Card className="border-blue-200 shadow-lg bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-blue-900">
          <span className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-blue-100">
              <Icon name="Users" size={20} className="text-blue-600" />
            </div>
            Пользователи ({users.length})
          </span>
          <Badge className="bg-green-100 text-green-700 border border-green-200 flex items-center gap-2 px-3 py-1">
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
                className="border border-blue-100 rounded-xl p-4 hover:bg-blue-50 transition-all duration-300 cursor-pointer bg-white shadow-sm"
                onClick={() => handleUserClick(user)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {user.is_online ? (
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      ) : (
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      )}
                      {user.is_admin && (
                        <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1">
                          <Icon name="Shield" size={12} className="mr-1" />
                          Админ
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        {editingUser === user.id ? (
                          <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-48 border border-blue-200 bg-white text-blue-900 placeholder:text-blue-400 focus:border-blue-400"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                updateUserName(user.id, newName);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="font-medium text-blue-900 text-lg">{user.name}</span>
                        )}
                      </div>
                      <div className="text-sm text-blue-600">{user.email}</div>
                      <div className="text-xs text-blue-400">
                        {user.is_online 
                          ? 'Онлайн сейчас' 
                          : `Был(а) онлайн: ${new Date(user.last_seen).toLocaleString('ru-RU')}`
                        }
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedUser?.id === user.id && (
                      <Icon name="ChevronDown" size={16} className="text-blue-500" />
                    )}
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {editingUser === user.id ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateUserName(user.id, newName)}
                            disabled={!newName.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1"
                          >
                            <Icon name="Check" size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={cancelEdit}
                            className="border border-blue-200 text-blue-600 hover:bg-blue-50"
                            variant="ghost"
                          >
                            <Icon name="X" size={14} />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => startEdit(user)}
                            disabled={user.is_admin}
                            className="border border-blue-200 text-blue-600 hover:bg-blue-50 px-3 py-1"
                            variant="ghost"
                          >
                            <Icon name="Edit" size={14} />
                          </Button>
                          {!user.is_admin && (
                            <Button 
                              size="sm" 
                              onClick={() => deleteUser(user.id)}
                              className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1"
                              variant="ghost"
                            >
                              <Icon name="Trash2" size={14} />
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
                <div className="mt-4 ml-8 space-y-3">
                  {leadsLoading ? (
                    <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
                      <div className="flex items-center justify-center gap-2 text-blue-600">
                        <Icon name="Loader2" size={16} className="animate-spin" />
                        Загрузка лидов...
                      </div>
                    </div>
                  ) : userLeads.length > 0 ? (
                    userLeads.map((lead, leadIndex) => (
                      <div 
                        key={lead.id} 
                        className="border border-blue-100 rounded-lg p-4 bg-blue-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-200 flex-shrink-0">
                            <Icon name="MessageSquare" size={16} className="text-blue-700" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="text-blue-700 text-sm mb-2 font-medium">
                              {new Date(lead.created_at).toLocaleString('ru-RU')}
                            </div>
                            
                            {lead.notes && (
                              <div className="border border-blue-200 bg-white rounded-lg p-3 mb-3">
                                <div className="text-blue-800 whitespace-pre-wrap">
                                  {lead.notes}
                                </div>
                              </div>
                            )}
                            
                            {lead.has_audio && (
                              <div className="border border-blue-200 bg-white rounded-lg p-3 mb-2">
                                <div className="flex items-center gap-2 text-blue-600">
                                  <Icon name="Volume2" size={16} />
                                  <span className="text-sm">Аудиозапись доступна</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border border-blue-100 rounded-lg p-4 bg-blue-50">
                      <div className="text-center text-blue-600">
                        <Icon name="MessageSquare" size={24} className="mx-auto mb-2 opacity-60" />
                        У этого пользователя пока нет лидов
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