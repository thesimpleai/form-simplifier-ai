import { useState } from "react";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Question {
  id: string;
  text: string;
  proposedAnswers: string[];
  status: "no_match" | "conflict" | "resolved";
}

interface QuestionReviewProps {
  questions: Question[];
  onAnswerUpdate: (questionId: string, answer: string) => void;
}

export const QuestionReview = ({ questions, onAnswerUpdate }: QuestionReviewProps) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answer }));
    onAnswerUpdate(questionId, answer);
  };

  const getStatusIcon = (status: Question["status"]) => {
    switch (status) {
      case "no_match":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "conflict":
        return <HelpCircle className="w-5 h-5 text-orange-500" />;
      case "resolved":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {questions.map((question) => (
        <div
          key={question.id}
          className={`p-6 rounded-lg border ${
            question.status === "no_match"
              ? "bg-yellow-50 border-yellow-200"
              : question.status === "conflict"
              ? "bg-orange-50 border-orange-200"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {getStatusIcon(question.status)}
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2">{question.text}</h3>
              
              {question.proposedAnswers.length > 0 ? (
                <div className="space-y-3">
                  {question.proposedAnswers.map((answer, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Button
                        variant={selectedAnswers[question.id] === answer ? "default" : "outline"}
                        onClick={() => handleAnswerSelect(question.id, answer)}
                        className="text-sm"
                      >
                        Use This Answer
                      </Button>
                      <p className="flex-1 text-gray-600 text-sm pt-2">{answer}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <Textarea
                  placeholder="No answer found. Please enter manually..."
                  className="mt-2"
                  onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};