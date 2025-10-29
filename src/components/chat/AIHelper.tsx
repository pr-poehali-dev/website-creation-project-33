import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIHelperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HELP_TOPICS = [
  {
    id: 'organization',
    title: 'Как выбрать организацию?',
    answer: 'На главном экране вы увидите список доступных организаций. Просто нажмите на название нужной организации, чтобы выбрать её. После выбора откроются все функции работы с этой организацией.'
  },
  {
    id: 'leads',
    title: 'Как работать с лидами?',
    answer: 'Перейдите в раздел "Работа" на главном экране. Там вы увидите два блока:\n\n1️⃣ Блокнот - здесь вы записываете информацию о клиенте.\n\n2️⃣ Контроль качества - управление процессом работы с клиентом.\n\n📝 ПЛАН РАБОТЫ:\n\n1. ПЕРЕД подходом к клиенту нажмите звездочку в "Контроль качества" (звездочка начнёт крутиться)\n\n2. Пригласите клиента на бесплатное пробное занятие\n\n3. Если клиент СОГЛАСИЛСЯ:\n   • Заполните данные клиента в блокноте\n   • После того как клиент озвучил данные, нажмите звездочку ещё раз (она станет жёлтой)\n   • Нажмите кнопку "Отправить в Telegram"\n\n4. Если клиент НЕ СОГЛАСИЛСЯ:\n   • Нажмите звездочку ещё раз (она станет жёлтой)\n   • Перед подходом к следующему клиенту нажмите её снова (звездочка снова крутится)'
  },
  {
    id: 'schedule',
    title: 'Как посмотреть график работы?',
    answer: 'Нажмите кнопку "График" в правом верхнем углу экрана. Вы увидите календарь с вашими сменами и свободными днями.\n\n📅 Промоутер самостоятельно проставляет смены каждое воскресенье на следующую неделю.\n\n📍 Информацию о месте работы (точке) можно посмотреть в графике. Информация о точке появляется вечером за день до смены.\n\n⚠️ ВАЖНО: После подтверждения графика смены НЕ подлежат корректировке!\n\n💰 Штрафы за невыход:\n• Первый невыход на смену → штраф 3000 рублей\n• Повторный невыход → увольнение'
  },
  {
    id: 'chat',
    title: 'Как написать в чат?',
    answer: 'Нажмите кнопку "Чат" в правом верхнем углу. Откроется окно чата с вашей командой. Просто напишите сообщение и нажмите Enter или кнопку отправки. Если есть непрочитанные сообщения, на кнопке "Чат" будет красный значок с их количеством.'
  },
  {
    id: 'training',
    title: 'Где найти обучающие материалы?',
    answer: 'На главном экране есть плитка "Обучение". Нажмите на неё, чтобы открыть список обучающих видео и материалов. Вы можете смотреть видео прямо в приложении.'
  },
  {
    id: 'change-org',
    title: 'Как сменить организацию?',
    answer: '🔄 Нажмите кнопку "Сменить" в правом верхнем углу экрана. Вы вернётесь к списку организаций и сможете выбрать другую.'
  }
];

export default function AIHelper({ open, onOpenChange }: AIHelperProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Привет! Я AI-помощник IMPERIA PROMO. Задай мне любой вопрос о работе с сайтом, и я помогу разобраться! 😊',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    const restrictedKeywords = [
      'админ', 'администратор', 'бух', 'бухгалтер', 'учет', 'зарплат', 
      'промоутер', 'количество', 'сколько', 'статистик', 'данные',
      'прибыл', 'доход', 'расход', 'кмс', 'квв', 'налог', 'смены',
      'база', 'данных', 'пароль', 'доступ'
    ];
    
    const hasRestrictedContent = restrictedKeywords.some(keyword => 
      lowerQuestion.includes(keyword)
    );
    
    if (hasRestrictedContent) {
      return 'Извините, я помощник только для работы с пользовательской панелью. По вопросам административных функций, статистики и бухгалтерии обратитесь к администратору через чат. 🔒';
    }
    
    if (lowerQuestion.includes('организац') || lowerQuestion.includes('выбрать')) {
      return HELP_TOPICS[0].answer;
    }
    if (lowerQuestion.includes('лид') || lowerQuestion.includes('контакт')) {
      return HELP_TOPICS[1].answer;
    }
    if (lowerQuestion.includes('график')) {
      return HELP_TOPICS[2].answer;
    }
    if (lowerQuestion.includes('чат') || lowerQuestion.includes('сообщен')) {
      return HELP_TOPICS[3].answer;
    }
    if (lowerQuestion.includes('обучен') || lowerQuestion.includes('видео') || lowerQuestion.includes('материал')) {
      return HELP_TOPICS[4].answer;
    }
    if (lowerQuestion.includes('смен') && lowerQuestion.includes('организац')) {
      return HELP_TOPICS[5].answer;
    }
    
    return 'Я могу помочь с такими вопросами:\n\n' +
           '• Как выбрать организацию\n' +
           '• Как работать с лидами\n' +
           '• Как посмотреть график\n' +
           '• Как написать в чат\n' +
           '• Где найти обучающие материалы\n' +
           '• Как сменить организацию\n\n' +
           'Задай свой вопрос подробнее, и я обязательно помогу! 😊';
  };

  const handleSend = () => {
    if (!input.trim()) return;

    setShowWelcome(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const answer = findAnswer(input);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleTopicClick = (topic: typeof HELP_TOPICS[0]) => {
    setShowWelcome(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      text: topic.title,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: topic.answer,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleResetChat = () => {
    setShowWelcome(true);
    setMessages([
      {
        id: '1',
        text: 'Привет! Я AI-помощник IMPERIA PROMO. Задай мне любой вопрос о работе с сайтом, и я помогу разобраться! 😊',
        isUser: false,
        timestamp: new Date()
      }
    ]);
    setInput('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#001f54] to-[#002b6b]">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Icon name="Bot" size={24} />
              AI-Помощник
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!showWelcome && (
                <Button
                  onClick={handleResetChat}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10"
                >
                  <Icon name="ArrowLeft" size={20} />
                </Button>
              )}
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {showWelcome && (
            <div className="grid grid-cols-1 gap-2 mb-4">
              {HELP_TOPICS.map(topic => (
                <Button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic)}
                  variant="outline"
                  className="h-auto py-3 px-4 text-left justify-start hover:bg-blue-50 transition-colors"
                >
                  <Icon name="HelpCircle" size={16} className="mr-2 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">{topic.title}</span>
                </Button>
              ))}
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.isUser
                    ? 'bg-[#001f54] text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.text}</p>
                <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-200' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Задайте вопрос..."
              className="resize-none min-h-[60px]"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-[#001f54] hover:bg-[#002b6b] text-white h-[60px] px-6"
            >
              <Icon name="Send" size={20} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}