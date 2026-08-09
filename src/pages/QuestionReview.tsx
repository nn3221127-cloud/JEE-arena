import React, { useEffect, useState } from 'react';
import { api, QuestionDraft } from '../api/client';
import { Stepper } from '../components/Stepper';
import { RegistrationCorners } from '../components/RegistrationCorners';
import { DigitBox } from '../components/DigitBox';
import { AlertCircle, Trash2, CheckCircle2, Plus } from 'lucide-react';

interface QuestionReviewProps {
  initialQuestions: QuestionDraft[];
  extractionWarning?: string;
  onPublishSuccess: () => void;
}

/**
 * Screen 4.3 Step 2 & 3: Question Review & Publish
 */
export const QuestionReview: React.FC<QuestionReviewProps> = ({
  initialQuestions,
  extractionWarning,
  onPublishSuccess
}) => {
  const [testTitle, setTestTitle] = useState('JEE Practice Paper ' + new Date().toLocaleDateString());
  const [studentCount, setStudentCount] = useState<number>(0);
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialQuestions.length > 0
      ? initialQuestions
      : [
          {
            question_text: 'Sample JEE Physics problem statement...',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_option_index: 0,
            explanation: 'Detailed solution step...',
            subject: 'Physics',
            topic: 'Kinematics',
            difficulty: 'easy',
            confidence: 95
          }
        ]
  );

  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.getAdminStats().then((stats) => {
      if (stats && typeof stats.active_members === 'number') {
        setStudentCount(stats.active_members);
      }
    }).catch((err) => {
      console.error('Failed to load student count:', err);
    });
  }, []);

  const handleUpdateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].question_text = text;
    setQuestions(updated);
  };

  const handleUpdateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = text;
    setQuestions(updated);
  };

  const handleSetCorrectOption = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    updated[qIndex].correct_option_index = optIndex;
    setQuestions(updated);
  };

  const handleUpdateMeta = (qIndex: number, field: keyof QuestionDraft, val: any) => {
    const updated = [...questions];
    (updated[qIndex] as any)[field] = val;
    setQuestions(updated);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['', '', '', ''],
        correct_option_index: 0,
        explanation: '',
        subject: 'Physics',
        topic: 'General',
        difficulty: 'medium',
        confidence: 100
      }
    ]);
  };

  const handlePublish = async () => {
    if (!testTitle.trim()) {
      setErrorMsg('Please specify a title for this test.');
      return;
    }

    // Validate that every question has non-empty text and non-empty options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setErrorMsg(`Question #${i + 1} statement cannot be empty.`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setErrorMsg(`Question #${i + 1} has an empty option.`);
        return;
      }
    }

    setIsPublishing(true);
    setErrorMsg('');

    try {
      const createdTest = await api.createTest({
        title: testTitle,
        questions
      });
      await api.publishTest(createdTest.id);
      onPublishSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to publish test.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-24">
      {/* Stepper Header */}
      <Stepper currentStep={2} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-graphite">Review & Edit Questions</h1>
          <p className="text-sm text-graphite-soft">
            Verify extracted questions, set correct options, and adjust topic tags before publishing.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddQuestion}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-sheet border border-pencil-line hover:bg-sheet-2 text-xs font-mono font-semibold text-graphite cursor-pointer self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>+ Add Question</span>
        </button>
      </div>

      {extractionWarning && (
        <div className="p-3 rounded bg-amber-flag/10 border border-amber-flag text-amber-flag text-xs font-sans flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{extractionWarning}</span>
        </div>
      )}

      {/* Questions Stack */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          // Confidence badge styling
          let confBadgeClass = 'bg-exam-green-soft text-exam-green border-exam-green/30';
          let confLabel = `${q.confidence}% High Confidence`;

          if (q.confidence < 70) {
            confBadgeClass = 'bg-red-ink-soft text-red-ink border-red-ink/30';
            confLabel = `${q.confidence}% Low Confidence - Review Required`;
          } else if (q.confidence < 90) {
            confBadgeClass = 'bg-amber-flag/10 text-amber-flag border-amber-flag/30';
            confLabel = `${q.confidence}% Medium Confidence`;
          }

          return (
            <div
              key={q.id || qIndex}
              className="relative bg-sheet rounded-lg border border-pencil-line p-5 sm:p-6 shadow-sm space-y-4"
            >
              <RegistrationCorners />

              {/* Card Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-pencil-line">
                <div className="flex items-center gap-2">
                  <DigitBox prefix="Q" value={qIndex + 1} size="sm" active />
                  {q.extraction_source && (
                    <span className="text-[11px] font-mono text-graphite-soft hidden sm:inline-block">
                      via {q.extraction_source}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${confBadgeClass}`}
                  >
                    {confLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(qIndex)}
                    className="text-graphite-soft hover:text-red-ink p-1 transition-colors cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Question Textarea */}
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-graphite-soft mb-1">
                  Question Statement
                </label>
                <textarea
                  value={q.question_text}
                  onChange={(e) => handleUpdateQuestionText(qIndex, e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded border border-pencil-line bg-sheet-2 text-graphite font-sans text-base focus:outline-none focus:ring-1 focus:ring-ink-navy"
                />
              </div>

              {/* Options 2x2 Grid */}
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-graphite-soft mb-2">
                  Options (Select radio button for Correct Answer)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((letter, optIndex) => {
                    const isCorrect = q.correct_option_index === optIndex;
                    return (
                      <div
                        key={optIndex}
                        className={`flex items-center gap-2.5 p-2 rounded border transition-colors ${
                          isCorrect
                            ? 'bg-exam-green-soft/40 border-exam-green'
                            : 'bg-sheet border-pencil-line'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct_opt_${qIndex}`}
                          checked={isCorrect}
                          onChange={() => handleSetCorrectOption(qIndex, optIndex)}
                          className="w-4 h-4 text-ink-navy focus:ring-ink-navy cursor-pointer"
                        />
                        <span className="font-mono font-bold text-xs text-graphite-soft w-4">
                          {letter}.
                        </span>
                        <input
                          type="text"
                          value={q.options[optIndex] || ''}
                          onChange={(e) => handleUpdateOptionText(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${letter}`}
                          className="flex-1 p-1.5 text-sm font-sans bg-transparent text-graphite border-b border-transparent focus:border-pencil-line focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Metadata Row: Subject / Topic / Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-mono text-graphite-soft mb-1">
                    Subject
                  </label>
                  <select
                    value={q.subject}
                    onChange={(e) => handleUpdateMeta(qIndex, 'subject', e.target.value)}
                    className="w-full p-2 rounded border border-pencil-line bg-sheet text-sm font-sans text-graphite"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-graphite-soft mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={q.topic}
                    onChange={(e) => handleUpdateMeta(qIndex, 'topic', e.target.value)}
                    placeholder="e.g. Electrochemistry"
                    className="w-full p-2 rounded border border-pencil-line bg-sheet text-sm font-sans text-graphite"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-graphite-soft mb-1">
                    Difficulty
                  </label>
                  <select
                    value={q.difficulty}
                    onChange={(e) => handleUpdateMeta(qIndex, 'difficulty', e.target.value)}
                    className="w-full p-2 rounded border border-pencil-line bg-sheet text-sm font-sans text-graphite"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Explanation Text */}
              <div>
                <label className="block text-[11px] font-mono text-graphite-soft mb-1">
                  Solution Explanation
                </label>
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => handleUpdateMeta(qIndex, 'explanation', e.target.value)}
                  placeholder="Step-by-step reasoning..."
                  className="w-full p-2 rounded border border-pencil-line bg-sheet text-xs font-sans text-graphite"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-sheet border-t border-pencil-line p-4 shadow-lg z-30">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              placeholder="Enter Test Title"
              className="w-full px-3 py-2 rounded border border-pencil-line bg-sheet-2 text-sm font-sans font-bold text-graphite"
            />
          </div>

          {errorMsg && (
            <div className="text-xs text-red-ink font-sans font-semibold">
              {errorMsg}
            </div>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing || questions.length === 0}
            className="w-full sm:w-auto px-6 py-2.5 rounded bg-ink-navy hover:bg-ink-navy/90 text-white font-sans font-bold text-sm shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>
              {isPublishing
                ? 'Activating Test...'
                : `Activate Test for ${studentCount} Enrolled Student${studentCount === 1 ? '' : 's'}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
