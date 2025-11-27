import React, { useState, useEffect } from 'react';
import { Key, Save, Edit3, Eye, EyeOff } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsSaved(true);
      onApiKeyChange(storedKey);
    }
  }, [onApiKeyChange]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsSaved(true);
      onApiKeyChange(apiKey.trim());
    }
  };

  const handleEdit = () => {
    setIsSaved(false);
  };

  if (isSaved) {
    return (
      <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg border border-green-200">
        <Key className="w-5 h-5 text-green-600" />
        <span className="text-green-800 font-medium text-sm flex-grow">
          API Key đã được lưu
        </span>
        <button
          onClick={handleEdit}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-semibold px-3 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>Chỉnh sửa</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-600" />
          Google Gemini API Key
        </label>
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noreferrer"
          className="text-xs text-blue-500 hover:underline"
        >
          Lấy mã API tại đây
        </a>
      </div>
      <div className="flex space-x-2">
        <div className="relative flex-grow">
          <input
            type={isVisible ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Dán mã API của bạn vào đây (AI Studio)..."
            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
          />
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="absolute right-2 top-2.5 text-slate-400 hover:text-slate-600"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors font-medium text-sm"
        >
          <Save className="w-4 h-4" />
          Lưu
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Mã API được lưu cục bộ trên trình duyệt của bạn và không bao giờ được gửi đi đâu khác ngoài Google.
      </p>
    </div>
  );
};

export default ApiKeyInput;
