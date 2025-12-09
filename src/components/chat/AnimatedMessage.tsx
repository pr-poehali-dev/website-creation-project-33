interface AnimatedMessageProps {
  text: string;
}

export default function AnimatedMessage({ text }: AnimatedMessageProps) {
  // Регулярка для поиска эмодзи
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  
  const parts = text.split(emojiRegex);
  
  return (
    <>
      {parts.map((part, index) => {
        // Проверяем, является ли часть эмодзи
        if (part.match(emojiRegex)) {
          return (
            <span 
              key={index} 
              className="emoji-animate emoji-hover inline-block text-2xl"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}
