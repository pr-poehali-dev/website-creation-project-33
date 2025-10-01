import { useState, useEffect } from 'react';

export function useChatUnread() {
  const [unreadCount] = useState(0);
  
  return unreadCount;
}
