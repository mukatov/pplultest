import { useState, useEffect } from 'react';
import { ChevronLeft, Check, Trash2, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWorkoutStore } from '../store/workoutStore';
import { useLangStore } from '../store/langStore';
import { useT } from '../hooks/useT';
import { useGoogleSheets, hasGoogleClientId } from '../hooks/useGoogleSheets';

export default function Settings() {
  const navigate = useNavigate();
  const { splits, activeSplitId, setActiveSplit, deleteSplit } = useWorkoutStore();
  const { lang, setLang } = useLangStore();
  const t = useT();
  const { isConnected, sheetId, sheetTitle, connect, disconnect } = useGoogleSheets();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  // Auto-complete OAuth exchange when returning from Google redirect
  useEffect(() => {
    if (sessionStorage.getItem('google_oauth_code')) {
      handleConnect();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = async () => {
    setConnectError('');
    setConnecting(true);
    try {
      await connect();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      if (msg !== 'cancelled') setConnectError(msg);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#171717] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-10">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 flex items-center justify-center bg-[#262626] rounded-lg flex-shrink-0"
        >
          <ChevronLeft size={16} className="text-[#fafafa]" />
        </button>
        <h1 className="flex-1 text-center text-2xl font-semibold tracking-[-0.5px] text-[#fafafa]">
          {t.splits}
        </h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Splits list */}
        <div className="space-y-3">
          {splits.map(split => (
            <div
              key={split.id}
              className="flex items-center gap-3 bg-[#262626] rounded-2xl px-4 py-4"
            >
              <button
                onClick={() => setActiveSplit(split.id)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${activeSplitId === split.id ? 'border-[#f5f5f5] bg-[#f5f5f5]' : 'border-[#525252]'}`}>
                  {activeSplitId === split.id && <Check size={12} className="text-[#0a0a0a]" strokeWidth={3} />}
                </div>
                <div>
                  <p className="text-[#fafafa] font-medium text-sm">{split.name}</p>
                  <p className="text-[#525252] text-xs mt-0.5">
                    {split.days.map(d => d.label).join(' · ')}
                  </p>
                </div>
              </button>
              {!split.isBuiltIn && (
                <button
                  onClick={() => deleteSplit(split.id)}
                  className="w-8 h-8 flex items-center justify-center text-[#525252] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Google Sheets */}
        <div>
          <p className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-1">{t.googleSheets}</p>
          <p className="text-xs text-[#525252] mb-3">{t.googleSheetsDesc}</p>
          {isConnected ? (
            <div className="bg-[#262626] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-[#fafafa] font-medium">{sheetTitle ?? 'Spreadsheet'}</p>
                <p className="text-xs text-green-400 mt-0.5">● {t.connected}</p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#737373] hover:text-[#fafafa] transition-colors"
                >
                  {t.openSheet}
                </a>
                <button
                  onClick={disconnect}
                  className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
                >
                  {t.disconnect}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleConnect}
                disabled={!hasGoogleClientId || connecting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#262626] border border-[#404040] text-[#fafafa] text-sm font-medium hover:bg-[#2e2e2e] transition-colors disabled:opacity-40"
              >
                {connecting
                  ? <Loader2 size={15} className="animate-spin" />
                  : <svg viewBox="0 0 24 24" width="15" height="15" xmlns="http://www.w3.org/2000/svg"><path d="M7 3C5.9 3 5 3.9 5 5v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8l-5-5H7zm0 1h8v4h4v11H7V4zm2 7v1h6v-1H9zm0 2v1h6v-1H9zm0 2v1h4v-1H9z" fill="currentColor"/></svg>
                }
                {connecting ? t.connecting : t.connectGoogleSheets}
              </button>
              {!hasGoogleClientId && (
                <p className="text-xs text-[#525252] text-center">{t.noClientId}</p>
              )}
              {connectError && (
                <p className="text-xs text-red-400 text-center">{connectError}</p>
              )}
            </div>
          )}
        </div>

        {/* Language */}
        <div>
          <p className="text-xs font-bold text-[#737373] uppercase tracking-wider mb-3">{t.language}</p>
          <div className="flex gap-2">
            {(['en', 'ru'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  lang === l
                    ? 'bg-[#f5f5f5] text-[#0a0a0a]'
                    : 'bg-[#262626] text-[#737373] border border-[#404040]'
                }`}
              >
                {l === 'en' ? '🇬🇧 English' : '🇷🇺 Русский'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 flex-shrink-0">
        <button
          onClick={() => navigate('/settings/new-split')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-[#404040] text-[#737373] text-sm font-medium hover:border-[#737373] hover:text-[#a3a3a3] transition-colors"
        >
          <Plus size={16} />
          {t.createCustomSplit}
        </button>
      </div>
    </div>
  );
}
