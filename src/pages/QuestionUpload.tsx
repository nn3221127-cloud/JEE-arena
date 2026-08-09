import React, { useState } from 'react';
import { api, QuestionDraft } from '../api/client';
import { Stepper } from '../components/Stepper';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { Upload, FileText, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface QuestionUploadProps {
  onExtractionComplete: (questions: QuestionDraft[], warning?: string) => void;
}

/**
 * Screen 4.3 Step 1: Upload & Extraction Flow
 */
export const QuestionUpload: React.FC<QuestionUploadProps> = ({ onExtractionComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [showTextarea, setShowTextarea] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleStartExtraction = async () => {
    if (!file && !rawText) return;

    setIsProcessing(true);
    setErrorMsg('');
    setStatusText('Extracting with Gemini 2.5 Flash...');

    try {
      let payload: any;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        if (rawText) formData.append('raw_text', rawText);
        payload = formData;
      } else {
        payload = { raw_text: rawText };
      }

      // Simulate status message update for multi-LLM pipeline feedback
      const timer = setTimeout(() => {
        setStatusText('Parsing structured questions and confidence scores...');
      }, 1500);

      const res = await api.extractQuestions(payload);
      clearTimeout(timer);

      onExtractionComplete(res.questions, res.warning);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to extract questions from file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-sans">
      {/* Stepper Header */}
      <Stepper currentStep={1} />

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-graphite">Upload Question Paper</h1>
        <p className="text-sm text-graphite-soft">
          Upload a PDF or image of a question paper, or paste raw text. Gemini 2.5 Flash will extract structured questions.
        </p>
      </div>

      {/* Main Container */}
      <div className="relative bg-sheet rounded-xl border border-pencil-line p-6 sm:p-8 shadow-sm">
        <RegistrationCorners />

        {isProcessing ? (
          /* Processing State */
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-3 border-pencil-line border-t-ink-navy animate-spin" />
            <div className="space-y-1">
              <div className="font-mono font-bold text-base text-graphite flex items-center gap-2 justify-center">
                <Sparkles size={18} className="text-ink-navy animate-pulse" />
                <span>{statusText}</span>
              </div>
              <p className="text-xs text-graphite-soft font-mono">
                Multimodal extraction & validation in progress
              </p>
            </div>

            {/* Indeterminate Progress Bar */}
            <div className="w-64 bg-pencil-line/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-ink-navy h-full w-1/2 animate-pulse" />
            </div>
          </div>
        ) : (
          /* Dropzone State */
          <div className="space-y-6">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-pencil-line hover:border-ink-navy rounded-lg p-8 min-h-[200px] flex flex-col items-center justify-center text-center transition-colors bg-sheet-2/40 group cursor-pointer"
            >
              <input
                type="file"
                id="file-upload"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-sheet border border-pencil-line group-hover:border-ink-navy flex items-center justify-center text-graphite-soft group-hover:text-ink-navy transition-colors">
                  <Upload size={22} />
                </div>
                <div className="space-y-1">
                  <span className="font-sans font-bold text-sm text-graphite group-hover:text-ink-navy">
                    {file ? file.name : 'Click to select or drag PDF / Image here'}
                  </span>
                  <p className="text-xs font-mono text-graphite-soft">
                    Supports high-resolution PNG, JPG, PDF up to 20MB
                  </p>
                </div>
              </label>
            </div>

            {/* Fallback Text Area Toggle */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowTextarea(!showTextarea)}
                className="text-xs font-mono font-semibold text-ink-navy hover:underline flex items-center gap-1 cursor-pointer"
              >
                <FileText size={14} />
                <span>{showTextarea ? 'Hide text input area' : 'Or paste question paper text manually'}</span>
              </button>

              {showTextarea && (
                <div className="mt-3">
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste question paper text here..."
                    rows={6}
                    className="w-full p-3 rounded-md border border-pencil-line bg-sheet text-graphite font-sans text-sm focus:outline-none focus:ring-1 focus:ring-ink-navy"
                  />
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3 rounded bg-red-ink-soft border border-red-ink text-red-ink text-xs font-sans flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Start Button */}
            <button
              type="button"
              onClick={handleStartExtraction}
              disabled={!file && !rawText}
              className="w-full py-3 px-4 rounded-md bg-ink-navy hover:bg-ink-navy/90 text-white font-sans font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Process & Extract Questions</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
