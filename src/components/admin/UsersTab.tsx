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

const ADMIN_API = 'https://functions.poehali.dev/29e24d51-9c06-45bb-9ddb-2c7fb23e8214';

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [newName, setNewName] = useState('');

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
      <Card className="glass-effect border-white/20 shadow-2xl">
        <CardContent className="p-8">
          <div className="text-center text-white flex items-center justify-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            Загрузка пользователей...
          </div>
        </CardContent>
      </Card>
    );
  }

  const onlineUsers = users.filter(u => u.is_online).length;

  return (
    <Card className="glass-effect border-white/20 shadow-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-white">
          <span className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 pulse-glow">
              <Icon name="Users" size={20} className="text-white" />
            </div>
            Пользователи ({users.length})
          </span>
          <Badge className="glass-effect border-green-400/30 bg-green-500/20 text-green-300 flex items-center gap-2 px-3 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Онлайн: {onlineUsers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user, index) => (
            <div 
              key={user.id} 
              className="glass-effect border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all duration-300 slide-up"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {user.is_online ? (
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    ) : (
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    )}
                    {user.is_admin && (
                      <Badge className="glass-effect border-yellow-400/30 bg-yellow-500/20 text-yellow-300 px-2 py-1">
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
                          className="w-48 glass-effect border-white/20 text-white placeholder:text-white/50 focus:border-purple-400"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              updateUserName(user.id, newName);
                            }
                          }}
                        />
                      ) : (
                        <span className="font-medium text-white text-lg">{user.name}</span>
                      )}
                    </div>
                    <div className="text-sm text-white/70">{user.email}</div>
                    <div className="text-xs text-white/50">
                      {user.is_online 
                        ? 'Онлайн сейчас' 
                        : `Был(а) онлайн: ${new Date(user.last_seen).toLocaleString('ru-RU')}`
                      }
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {editingUser === user.id ? (
                    <>
                      <Button 
                        size="sm" 
                        onClick={() => updateUserName(user.id, newName)}
                        disabled={!newName.trim()}
                        className="glow-button text-white px-3 py-1"
                      >
                        <Icon name="Check" size={14} />
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={cancelEdit}
                        className="glass-effect border-white/20 text-white hover:bg-white/10"
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
                        className="glass-effect border-white/20 text-white hover:bg-white/10 px-3 py-1"
                        variant="ghost"
                      >
                        <Icon name="Edit" size={14} />
                      </Button>
                      {!user.is_admin && (
                        <Button 
                          size="sm" 
                          onClick={() => deleteUser(user.id)}
                          className="glass-effect border-red-400/30 bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-1"
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}