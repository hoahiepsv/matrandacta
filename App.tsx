import React, { useState, useMemo } from 'react';
import { Upload, Trash2, FileText, Loader2, Sparkles, Zap, BrainCircuit, HelpCircle } from 'lucide-react';
import ApiKeyInput from './components/ApiKeyInput';
import WordExport from './components/WordExport';
import { generateMatrix } from './services/geminiService';
import { fileToBase64, formatFileSize } from './utils/fileHelpers';
import { MatrixData, ModelType, UploadedFile, MatrixConfig } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [modelType, setModelType] = useState<ModelType>(ModelType.FLASH);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default configuration as requested
  const [config, setConfig] = useState<MatrixConfig>({
    recognition: { percent: 30, tn: 8, tl: 1 },
    understanding: { percent: 40, tn: 4, tl: 3 },
    application: { percent: 20, tn: 0, tl: 4 },
    high_application: { percent: 10, tn: 0, tl: 1 },
  });

  const handleConfigChange = (level: keyof MatrixConfig, field: 'percent' | 'tn' | 'tl', value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    setConfig(prev => ({
      ...prev,
      [level]: {
        ...prev[level],
        [field]: isNaN(numValue) ? 0 : numValue
      }
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'matrix_source' | 'template_source') => {
    if (event.target.files && event.target.files.length > 0) {
      const newFiles: UploadedFile[] = Array.from(event.target.files).map((file: File) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        type
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
    event.target.value = '';
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Vui lòng nhập API Key trước.");
      return;
    }
    if (uploadedFiles.length === 0) {
      setError("Vui lòng tải lên ít nhất một file ma trận đề.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setMatrixData(null);

    try {
      const processedFiles = await Promise.all(
        uploadedFiles.map(async (uf) => ({
          mimeType: uf.file.type,
          data: await fileToBase64(uf.file)
        }))
      );

      const result = await generateMatrix(apiKey, modelType, processedFiles, config);
      setMatrixData(result);
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra trong quá trình tạo ma trận. Vui lòng thử lại.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Logic to calculate rowSpans for merging Topics
  const processedRows = useMemo(() => {
    if (!matrixData?.rows) return [];
    
    const rows = [...matrixData.rows];
    const rowSpans: number[] = new Array(rows.length).fill(1);
    
    // We iterate backwards to make logic simpler or standard forward loop
    // Let's use a forward loop with a lookahead or keeping track of current group
    for (let i = 0; i < rows.length; i++) {
        if (i > 0 && rows[i].topic === rows[i-1].topic) {
            rowSpans[i] = 0; // Mark to be hidden
            // Find the index of the start of this group to increment its span
            let k = i - 1;
            while (k >= 0 && rowSpans[k] === 0) {
                k--;
            }
            rowSpans[k]++;
        }
    }

    return rows.map((row, index) => ({
        ...row,
        topicRowSpan: rowSpans[index]
    }));
  }, [matrixData]);

  // Calculate detailed totals
  const totals = useMemo(() => {
      if (!matrixData?.rows) return null;
      return matrixData.rows.reduce((acc, row) => ({
          rec_tn: acc.rec_tn + row.recognition_tn,
          rec_tl: acc.rec_tl + row.recognition_tl,
          und_tn: acc.und_tn + row.understanding_tn,
          und_tl: acc.und_tl + row.understanding_tl,
          app_tn: acc.app_tn + row.application_tn,
          app_tl: acc.app_tl + row.application_tl,
          high_tn: acc.high_tn + row.high_application_tn,
          high_tl: acc.high_tl + row.high_application_tl,
      }), { rec_tn: 0, rec_tl: 0, und_tn: 0, und_tl: 0, app_tn: 0, app_tl: 0, high_tn: 0, high_tl: 0 });
  }, [matrixData]);


  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full bg-opacity-20">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <h1 className="text-2xl font-bold tracking-wide uppercase">TẠO MA TRẬN ĐẶC TẢ</h1>
          </div>
          <div className="text-sm font-light italic opacity-90 hidden md:block">
             LHH - Ứng dụng AI vào giáo dục
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 space-y-8 max-w-5xl">
        
        {/* Step 1: Configuration */}
        <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">1</span>
            Cấu hình & API
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <ApiKeyInput onApiKeyChange={setApiKey} />
            
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 block">Chọn mô hình xử lý</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setModelType(ModelType.FLASH)}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    modelType === ModelType.FLASH 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200' 
                      : 'border-slate-200 hover:border-blue-300 text-slate-600'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold text-sm">Flash (Nhanh)</span>
                </button>
                <button
                  onClick={() => setModelType(ModelType.PRO)}
                  className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-2 transition-all ${
                    modelType === ModelType.PRO 
                      ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200' 
                      : 'border-slate-200 hover:border-purple-300 text-slate-600'
                  }`}
                >
                  <BrainCircuit className="w-5 h-5" />
                  <span className="font-semibold text-sm">Pro (Thông minh)</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Step 2: Exam Structure Configuration */}
        <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">2</span>
            Cấu trúc đề thi (Số lượng câu hỏi & Tỉ lệ)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Mức độ</th>
                  <th className="px-4 py-3">Tỉ lệ điểm (%)</th>
                  <th className="px-4 py-3">Số câu Trắc nghiệm (TN)</th>
                  <th className="px-4 py-3 rounded-tr-lg">Số câu Tự luận (TL)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-blue-700">Nhận biết</td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" max="100" value={config.recognition.percent} onChange={(e) => handleConfigChange('recognition', 'percent', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" value={config.recognition.tn} onChange={(e) => handleConfigChange('recognition', 'tn', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" value={config.recognition.tl} onChange={(e) => handleConfigChange('recognition', 'tl', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                </tr>
                <tr className="bg-white border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-blue-700">Thông hiểu</td>
                   <td className="px-4 py-3">
                    <input type="number" min="0" max="100" value={config.understanding.percent} onChange={(e) => handleConfigChange('understanding', 'percent', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" value={config.understanding.tn} onChange={(e) => handleConfigChange('understanding', 'tn', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" value={config.understanding.tl} onChange={(e) => handleConfigChange('understanding', 'tl', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                </tr>
                <tr className="bg-white border-b hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-blue-700">Vận dụng</td>
                   <td className="px-4 py-3">
                    <input type="number" min="0" max="100" value={config.application.percent} onChange={(e) => handleConfigChange('application', 'percent', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" value={config.application.tn} onChange={(e) => handleConfigChange('application', 'tn', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" value={config.application.tl} onChange={(e) => handleConfigChange('application', 'tl', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                </tr>
                <tr className="bg-white hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-blue-700">Vận dụng cao</td>
                   <td className="px-4 py-3">
                    <input type="number" min="0" max="100" value={config.high_application.percent} onChange={(e) => handleConfigChange('high_application', 'percent', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" value={config.high_application.tn} onChange={(e) => handleConfigChange('high_application', 'tn', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" min="0" value={config.high_application.tl} onChange={(e) => handleConfigChange('high_application', 'tl', e.target.value)} className="w-20 p-2 border rounded focus:ring-blue-500 focus:border-blue-500" />
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900">
                <tr>
                  <td className="px-4 py-3">TỔNG CỘNG</td>
                  <td className="px-4 py-3">
                    {config.recognition.percent + config.understanding.percent + config.application.percent + config.high_application.percent}%
                  </td>
                  <td className="px-4 py-3">
                    {config.recognition.tn + config.understanding.tn + config.application.tn + config.high_application.tn} câu
                  </td>
                  <td className="px-4 py-3">
                    {config.recognition.tl + config.understanding.tl + config.application.tl + config.high_application.tl} câu
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
             <HelpCircle className="w-4 h-4" />
             Hệ thống sẽ dựa vào số lượng câu hỏi bạn cài đặt ở trên để phân bổ vào các nội dung kiến thức của ma trận.
          </p>
        </section>

        {/* Step 3: Upload */}
        <section className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 w-8 h-8 flex items-center justify-center rounded-full text-sm">3</span>
            Tải lên tài liệu
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload 1 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                1. Ma trận ra đề (Bắt buộc)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer relative">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'matrix_source')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Kéo thả hoặc click để chọn file (PDF, Ảnh)</p>
              </div>
            </div>

            {/* Upload 2 */}
            <div className="space-y-2">
               <label className="block text-sm font-medium text-slate-700 mb-1">
                2. Mẫu ma trận đặc tả (Tùy chọn)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer relative">
                <input 
                  type="file" 
                  multiple 
                   accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, 'template_source')}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Tải lên mẫu của trường (nếu có)</p>
              </div>
            </div>
          </div>

          {/* File List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Danh sách file đã chọn:</h3>
              <div className="bg-slate-50 rounded-lg border border-slate-200 divide-y divide-slate-200">
                {uploadedFiles.map((uf) => (
                  <div key={uf.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`p-2 rounded ${uf.type === 'matrix_source' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {uf.type === 'matrix_source' ? <Upload size={16} /> : <FileText size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{uf.file.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(uf.file.size)} - {uf.type === 'matrix_source' ? 'Ma trận đề' : 'Mẫu'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFile(uf.id)}
                      className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || uploadedFiles.length === 0}
            className={`
              px-8 py-4 rounded-full text-lg font-bold text-white shadow-xl flex items-center gap-3
              transition-all transform hover:scale-105 active:scale-95
              ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin w-6 h-6" />
                Đang Phân Tích & Tạo Ma Trận...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                TẠO MA TRẬN NGAY
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-center animate-pulse">
            {error}
          </div>
        )}

        {/* Result Area */}
        {matrixData && (
          <section className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4">
                <h3 className="font-bold text-lg text-slate-800">Kết quả xem trước</h3>
                <WordExport data={matrixData} />
             </div>
             
             <div className="p-6 overflow-x-auto">
                <table className="w-full border-collapse border border-black text-sm text-center">
                  <thead>
                     {/* Level 1 Header */}
                     <tr className="bg-blue-100 font-bold">
                        <th className="border border-black p-2" rowSpan={3}>TT</th>
                        <th className="border border-black p-2" rowSpan={3}>CHỦ ĐỀ</th>
                        <th className="border border-black p-2" rowSpan={3}>NỘI DUNG</th>
                        <th className="border border-black p-2" rowSpan={3}>MỨC ĐỘ<br/>ĐÁNH GIÁ</th>
                        <th className="border border-black p-2" colSpan={8}>SỐ CÂU HỎI THEO MỨC ĐỘ NHẬN THỨC</th>
                     </tr>
                     {/* Level 2 Header */}
                     <tr className="bg-blue-100 font-bold">
                        <th className="border border-black p-1" colSpan={2}>NHẬN BIẾT</th>
                        <th className="border border-black p-1" colSpan={2}>THÔNG HIỂU</th>
                        <th className="border border-black p-1" colSpan={2}>VẬN DỤNG</th>
                        <th className="border border-black p-1" colSpan={2}>VD CAO</th>
                     </tr>
                     {/* Level 3 Header */}
                     <tr className="bg-blue-100 font-bold">
                        <th className="border border-black p-1 w-8">TN</th><th className="border border-black p-1 w-8">TL</th>
                        <th className="border border-black p-1 w-8">TN</th><th className="border border-black p-1 w-8">TL</th>
                        <th className="border border-black p-1 w-8">TN</th><th className="border border-black p-1 w-8">TL</th>
                        <th className="border border-black p-1 w-8">TN</th><th className="border border-black p-1 w-8">TL</th>
                     </tr>
                  </thead>
                  <tbody>
                     {processedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-blue-50">
                           <td className="border border-black p-2">{row.tt}</td>
                           {/* Merge Topic */}
                           {row.topicRowSpan > 0 && (
                               <td className="border border-black p-2 font-medium bg-white align-top" rowSpan={row.topicRowSpan}>
                                   {row.topic}
                               </td>
                           )}
                           <td className="border border-black p-2 text-left">{row.content}</td>
                           <td className="border border-black p-2 text-left">{row.assessment_level}</td>
                           
                           <td className="border border-black p-2">{row.recognition_tn > 0 ? row.recognition_tn : ''}</td>
                           <td className="border border-black p-2">{row.recognition_tl > 0 ? row.recognition_tl : ''}</td>
                           
                           <td className="border border-black p-2">{row.understanding_tn > 0 ? row.understanding_tn : ''}</td>
                           <td className="border border-black p-2">{row.understanding_tl > 0 ? row.understanding_tl : ''}</td>
                           
                           <td className="border border-black p-2">{row.application_tn > 0 ? row.application_tn : ''}</td>
                           <td className="border border-black p-2">{row.application_tl > 0 ? row.application_tl : ''}</td>
                           
                           <td className="border border-black p-2">{row.high_application_tn > 0 ? row.high_application_tn : ''}</td>
                           <td className="border border-black p-2">{row.high_application_tl > 0 ? row.high_application_tl : ''}</td>
                        </tr>
                     ))}
                  </tbody>
                  <tfoot>
                      {/* Summary Row */}
                      <tr className="bg-blue-50 font-bold">
                          <td colSpan={4} className="border border-black p-2 uppercase">Tổng</td>
                          <td className="border border-black p-2">{totals?.rec_tn || ''}</td>
                          <td className="border border-black p-2">{totals?.rec_tl || ''}</td>
                          <td className="border border-black p-2">{totals?.und_tn || ''}</td>
                          <td className="border border-black p-2">{totals?.und_tl || ''}</td>
                          <td className="border border-black p-2">{totals?.app_tn || ''}</td>
                          <td className="border border-black p-2">{totals?.app_tl || ''}</td>
                          <td className="border border-black p-2">{totals?.high_tn || ''}</td>
                          <td className="border border-black p-2">{totals?.high_tl || ''}</td>
                      </tr>
                      {/* Percent Row */}
                       <tr className="bg-blue-50 font-bold">
                          <td colSpan={4} className="border border-black p-2 uppercase">Tỉ lệ %</td>
                           <td colSpan={2} className="border border-black p-2">{matrixData.summary.percent_recognition}%</td>
                           <td colSpan={2} className="border border-black p-2">{matrixData.summary.percent_understanding}%</td>
                           <td colSpan={2} className="border border-black p-2">{matrixData.summary.percent_application}%</td>
                           <td colSpan={2} className="border border-black p-2">{matrixData.summary.percent_high_application}%</td>
                      </tr>
                       <tr className="bg-blue-50 font-bold">
                          <td colSpan={4} className="border border-black p-2 uppercase">Tỉ lệ chung</td>
                           <td colSpan={4} className="border border-black p-2">{matrixData.summary.general_percent_basic}%</td>
                           <td colSpan={4} className="border border-black p-2">{matrixData.summary.general_percent_advanced}%</td>
                      </tr>
                  </tfoot>
                </table>
             </div>
          </section>
        )}

      </main>

      <footer className="bg-slate-800 text-slate-300 py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="font-semibold text-white mb-1">© Bản quyền thuộc về Lê Hoà Hiệp</p>
          <p className="text-sm">Hotline/Zalo: 0983.676.470</p>
          <div className="mt-4 pt-4 border-t border-slate-700 text-xs text-slate-500">
             LHH - Ứng dụng AI vào giáo dục
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;