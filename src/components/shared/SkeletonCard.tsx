import { motion } from 'framer-motion';

interface Props {
  count?: number;
  type?: 'card' | 'list' | 'profile';
}

const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent";

const SkeletonCard = ({ count = 4, type = 'card' }: Props) => {
  if (type === 'profile') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="glass-gold rounded-3xl p-6 flex items-center gap-5">
          <div className={`w-24 h-24 rounded-full bg-muted ${shimmer}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-5 bg-muted rounded-xl w-1/3 ${shimmer}`} />
            <div className={`h-3 bg-muted rounded-xl w-1/2 ${shimmer}`} />
            <div className={`h-3 bg-muted rounded-xl w-1/4 ${shimmer}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={`glass rounded-3xl p-5 h-52 ${shimmer}`} />
          <div className={`glass rounded-3xl p-5 h-52 ${shimmer}`} />
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={`glass rounded-3xl p-5 space-y-3 ${shimmer}`}>
            <div className="h-4 bg-muted rounded-xl w-2/5" />
            <div className="h-3 bg-muted rounded-xl w-3/4" />
            <div className="h-3 bg-muted rounded-xl w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`rounded-3xl overflow-hidden ${shimmer}`}>
          <div className="h-32 bg-muted" />
          <div className="p-3 space-y-2 glass">
            <div className="h-4 bg-muted rounded-xl w-3/4" />
            <div className="h-3 bg-muted rounded-xl w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonCard;
