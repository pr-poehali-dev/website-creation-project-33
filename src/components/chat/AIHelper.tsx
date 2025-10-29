import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

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
      <DialogContent className="sm:max-w-[500px] max-h-[600px] flex flex-col p-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 bg-[#001f54] text-white">
          <div className="flex items-center gap-2">
            <Icon name="Bot" size={20} />
            <span className="font-medium">AI-Помощник</span>
          </div>
          <div className="flex items-center gap-1">
            {!showWelcome && (
              <Button
                onClick={handleResetChat}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 h-8 w-8 p-0"
              >
                <Icon name="ArrowLeft" size={18} />
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 h-8 w-8 p-0"
            >
              <Icon name="X" size={18} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {showWelcome && (
            <div className="grid grid-cols-1 gap-2 mb-4">
              {HELP_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic)}
                  className="text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors text-sm"
                >
                  {topic.title}
                </button>
              ))}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.isUser
                    ? 'bg-[#001f54] text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
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

        <div className="p-3 border-t bg-white">
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
              placeholder="Напишите ваш вопрос..."
              className="min-h-[40px] max-h-[100px] resize-none text-sm"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="bg-[#001f54] hover:bg-[#002b6b] h-10 px-4"
            >
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
