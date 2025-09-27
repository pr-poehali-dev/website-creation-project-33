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

  useEffect(() => {
    fetchUsers();
    // Обновляем список каждые 30 секунд для актуального онлайн статуса
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Загрузка пользователей...</div>
        </CardContent>
      </Card>
    );
  }

  const onlineUsers = users.filter(u => u.is_online).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon name="Users" size={20} />
            Пользователи ({users.length})
          </span>
          <Badge variant="outline" className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Онлайн: {onlineUsers}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {user.is_online ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  )}
                  {user.is_admin && (
                    <Badge variant="secondary">
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
                        className="w-48"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            updateUserName(user.id, newName);
                          }
                        }}
                      />
                    ) : (
                      <span className="font-medium">{user.name}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-400">
                    {user.is_online 
                      ? 'Онлайн' 
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
                    >
                      <Icon name="Check" size={14} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <Icon name="X" size={14} />
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => startEdit(user)}
                    disabled={user.is_admin}
                  >
                    <Icon name="Edit" size={14} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}