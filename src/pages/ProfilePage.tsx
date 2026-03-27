import { ChevronLeft, User, Dumbbell, Trophy, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useT } from '../hooks/useT';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { workoutSets, personalRecords } = useWorkoutStore();
  const t = useT();

  if (!currentUser) return null;

  const userSets = workoutSets.filter(ws => ws.exerciseId.startsWith(`${currentUser.id}:`));
  const userPRs  = personalRecords.filter(pr => pr.exerciseId.startsWith(`${currentUser.id}:`));

  const memberSince = new Date(currentUser.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const username = currentUser.email.split('@')[0];

  return (
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10 flex-shrink-0">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-2xl font-semibold tracking-[-0.5px] text-[#fafafa]">
          {t.profile}
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Avatar + identity */}
        <div className="bg-[#262626] rounded-2xl p-6 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-[#1c1c1c] flex items-center justify-center">
            <User size={28} className="text-[#525252]" />
          </div>
          <div className="text-center">
            <p className="text-[#fafafa] font-semibold text-lg">{username}</p>
            <p className="text-[#525252] text-sm">{currentUser.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t.sessions, value: userSets.length, icon: Dumbbell },
            { label: t.records,  value: userPRs.length,  icon: Trophy   },
            { label: t.joined,   value: new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), icon: Calendar },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#262626] rounded-2xl p-4 flex flex-col items-center gap-1">
              <Icon size={16} className="text-[#737373]" />
              <p className="text-xl font-bold text-[#fafafa]">{value}</p>
              <p className="text-xs text-[#737373]">{label}</p>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div className="bg-[#262626] rounded-2xl overflow-hidden">
          {[
            { label: t.emailLabel,    value: currentUser.email },
            { label: t.memberSince,   value: memberSince       },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-4 flex items-center justify-between border-b border-[#333] last:border-0">
              <p className="text-[#737373] text-sm">{label}</p>
              <p className="text-[#fafafa] text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
