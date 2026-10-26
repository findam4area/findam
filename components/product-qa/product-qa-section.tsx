"use client";

/**
 * Product Q&A Section Component
 * Requirements: 23.1, 23.2, 23.4, 23.7, 23.8
 */

import { useState } from "react";
import { MessageCircle, ThumbsUp, Send, AlertCircle } from "lucide-react";
import { ProductQuestion } from "@/lib/services/product-qa";

interface ProductQASectionProps {
  listingId: string;
  sellerId: string;
  questions: ProductQuestion[];
  currentUserId?: string;
  onPostQuestion: (question: string) => Promise<void>;
  onPostAnswer: (questionId: string, answer: string) => Promise<void>;
  onUpvote: (questionId: string) => Promise<void>;
}

export function ProductQASection({
  listingId,
  sellerId,
  questions,
  currentUserId,
  onPostQuestion,
  onPostAnswer,
  onUpvote,
}: ProductQASectionProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [answerText, setAnswerText] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePostQuestion = async () => {
    if (!newQuestion.trim() || !currentUserId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onPostQuestion(newQuestion);
      setNewQuestion("");
    } catch (err: any) {
      setError(err.message || "Failed to post question");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostAnswer = async (questionId: string) => {
    const answer = answerText[questionId];
    if (!answer?.trim() || !currentUserId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onPostAnswer(questionId, answer);
      setAnswerText({ ...answerText, [questionId]: "" });
    } catch (err: any) {
      setError(err.message || "Failed to post answer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (questionId: string) => {
    if (!currentUserId) return;

    try {
      await onUpvote(questionId);
    } catch (err: any) {
      setError(err.message || "Failed to upvote");
    }
  };

  const canAnswer = (question: ProductQuestion) => {
    if (!currentUserId) return false;
    // Seller can always answer, or buyers who purchased
    return currentUserId === sellerId || question.answer === null;
  };

  const userQuestionCount = questions.filter(
    (q) => q.asker_id === currentUserId,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">
          Questions & Answers ({questions.length})
        </h2>
      </div>

      {/* Post Question Form */}
      {currentUserId && (
        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="font-medium">Ask a Question</h3>
          {userQuestionCount >= 5 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                You have reached the maximum of 5 questions for this listing.
              </p>
            </div>
          )}
          <textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="What would you like to know about this item?"
            className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            disabled={isSubmitting || userQuestionCount >= 5}
          />
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <button
            onClick={handlePostQuestion}
            disabled={
              !newQuestion.trim() || isSubmitting || userQuestionCount >= 5
            }
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            Post Question
          </button>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className="rounded-lg border p-4 space-y-3 hover:border-gray-300 transition-colors"
            >
              {/* Question */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpvote(question.id)}
                  disabled={!currentUserId}
                  className={`flex flex-col items-center gap-1 ${
                    question.has_upvoted
                      ? "text-blue-600"
                      : "text-gray-400 hover:text-blue-600"
                  } disabled:cursor-not-allowed`}
                >
                  <ThumbsUp
                    className={`h-5 w-5 ${question.has_upvoted ? "fill-current" : ""}`}
                  />
                  <span className="text-sm font-medium">
                    {question.upvotes}
                  </span>
                </button>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{question.question}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Asked by {question.asker_name || "Anonymous"} •{" "}
                        {question.created_at.toLocaleDateString()}
                      </p>
                    </div>
                    {question.status === "pending" && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Answer */}
                  {question.answer && (
                    <div className="mt-3 pl-4 border-l-2 border-green-500 bg-green-50 p-3 rounded-r-md">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-green-800">
                          {question.answerer_name || "Anonymous"}
                        </span>
                        {question.is_seller_answer && (
                          <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                            Seller
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {question.answered_at?.toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{question.answer}</p>
                    </div>
                  )}

                  {/* Answer Form */}
                  {!question.answer && canAnswer(question) && (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={answerText[question.id] || ""}
                        onChange={(e) =>
                          setAnswerText({
                            ...answerText,
                            [question.id]: e.target.value,
                          })
                        }
                        placeholder="Write your answer..."
                        className="w-full p-2 border rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        disabled={isSubmitting}
                      />
                      <button
                        onClick={() => handlePostAnswer(question.id)}
                        disabled={
                          !answerText[question.id]?.trim() || isSubmitting
                        }
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Post Answer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
