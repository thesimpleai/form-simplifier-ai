
import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { StepIndicator } from "@/components/StepIndicator";
import { QuestionReview } from "@/components/QuestionReview";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

const STEPS = ["Upload References", "Review"];

type Question = {
  id: string;
  text: string;
  proposedAnswers: string[];
  status: "no_match" | "conflict" | "resolved";
};

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [formFile, setFormFile] = useState<File[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Mock questions for demonstration
  const questions: Question[] = [
    {
      id: "1",
      text: "What is the applicant's full name?",
      proposedAnswers: ["John Smith", "John A. Smith"],
      status: "conflict",
    },
    {
      id: "2",
      text: "What is the applicant's date of birth?",
      proposedAnswers: [],
      status: "no_match",
    },
    {
      id: "3",
      text: "What is the applicant's current address?",
      proposedAnswers: ["123 Main St, Anytown, USA"],
      status: "resolved",
    },
  ];

  const handleNext = () => {
    if (currentStep === 0 && referenceFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one reference document",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleAnswerUpdate = (questionId: string, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGenerateFinalForm = async () => {
    // Check if all questions have answers
    const unansweredQuestions = questions.filter(
      question => !selectedAnswers[question.id]
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: "Missing answers",
        description: "Please provide answers for all questions before generating the final form",
        variant: "destructive",
      });
      return;
    }

    // Show success toast when form is generated
    toast({
      title: "Form Generated",
      description: "Your form has been generated with the following answers:\n" + 
        questions.map(q => `${q.text}: ${selectedAnswers[q.id]}`).join('\n'),
    });

    // Here you would typically:
    // 1. Save the form data to your database
    // 2. Generate a PDF or document with the answers
    // 3. Allow the user to download the generated form
    console.log("Generated form with answers:", selectedAnswers);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-4">Form-Filling AI</h1>
            <p className="text-gray-600">
              Easily fill your forms with data from your reference documents
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </header>

        <StepIndicator currentStep={currentStep} steps={STEPS} />

        <main className="bg-white rounded-xl shadow-sm p-8 mb-8">
          {currentStep === 0 && (
            <FileUpload
              title="Upload Reference Documents"
              description="Upload your reference documents (PDF, DOC, DOCX, or TXT)"
              onFilesSelected={setReferenceFiles}
              maxFiles={5}
            />
          )}

          {currentStep === 1 && (
            <QuestionReview
              questions={questions}
              onAnswerUpdate={handleAnswerUpdate}
            />
          )}
        </main>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button onClick={handleGenerateFinalForm}>
              Generate Final Form
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
