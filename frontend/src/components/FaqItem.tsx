import { FAQ } from '@/lib/data';
import { ChevronDown } from 'lucide-react';

interface FaqItemProps extends Pick<FAQ, 'question' | 'answer'> {
  isOpen: boolean;
  onToggle: () => void;
}

const FaqItem = ({ question, answer, isOpen, onToggle }: FaqItemProps) => {
  return (
    <div className="border-b border-border py-4 sm:py-5 md:py-6">
      <button
        className="flex w-full items-center justify-between text-left gap-3 sm:gap-4"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-base sm:text-lg font-medium text-foreground leading-snug">
          {question}
        </span>
        <span className="text-muted-foreground transition-transform duration-300 flex-shrink-0" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown className="h-5 w-5 sm:h-6 sm:w-6" />
        </span>
      </button>

      {/* Animated Answer Section */}
      <div
        className="grid overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          gridTemplateRows: isOpen ? '1fr' : '0fr',
        }}
      >
        <div className="min-h-0">
          <p className="pt-3 sm:pt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaqItem;