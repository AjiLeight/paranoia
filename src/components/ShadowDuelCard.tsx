
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ShadowDuelCardProps {
    cardId: string;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    flipped?: boolean;
}

export function ShadowDuelCard({ cardId, onClick, className, disabled, flipped = false }: ShadowDuelCardProps) {
    let bgImage = '/cards/recon.png';
    let label = cardId.replace('_', ' ');
    let isRecon = cardId.startsWith('Recon');


    if (cardId === 'Shotgun') bgImage = '/cards/shotgun.png';
    if (cardId === 'Infection') bgImage = '/cards/infection.png';
    if (cardId === 'Cure') bgImage = '/cards/cure.png';

    // The back of the card
    const cardBack = (
        <div className="absolute inset-0 bg-slate-900 border-2 border-slate-700/50 rounded-xl overflow-hidden flex items-center justify-center">
            <div className="w-16 h-16 opacity-20 bg-[url('/cards/recon.png')] bg-cover mix-blend-screen" />
        </div>
    );

    // The front of the card
    const cardFront = (
        <div
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-end p-4"
            style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

            <div className="relative z-10 flex flex-col items-center">

                <div className={cn(
                    "uppercase tracking-widest font-black text-sm text-center w-full",
                    cardId === 'Shotgun' && "text-red-500",
                    cardId === 'Infection' && "text-green-500",
                    cardId === 'Cure' && "text-blue-400",
                    isRecon && "text-cyan-400"
                )}>
                    {isRecon ? 'Recon' : label}
                </div>
            </div>
        </div>
    );

    return (
        <motion.button
            onClick={disabled ? undefined : onClick}
            disabled={disabled}
            className={cn(
                "relative text-left preserve-3d transition-colors w-24 h-32 sm:w-32 sm:h-44 md:w-36 md:h-48 lg:w-40 lg:h-56 focus:outline-none shrink-0",
                !disabled && "hover:shadow-cyan-500/20 active:scale-95 cursor-pointer",
                disabled && "opacity-70 cursor-not-allowed",
                className
            )}
            style={{ perspective: 1000 }}
            whileHover={!disabled && !flipped ? { y: -10, scale: 1.05 } : undefined}
            whileTap={!disabled && !flipped ? { scale: 0.95 } : undefined}
            initial={false}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
            {/* Front Side */}
            <div className="absolute inset-0 backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                {cardFront}
            </div>

            {/* Back Side */}
            <div className="absolute inset-0 backface-hidden" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                {cardBack}
            </div>
        </motion.button>
    );
}
