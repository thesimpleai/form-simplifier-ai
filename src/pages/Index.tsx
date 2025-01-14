import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { StepIndicator } from "@/components/StepIndicator";
import { QuestionReview } from "@/components/QuestionReview";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const STEPS = ["Upload References", "Upload Form", "Review"];

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
    if (currentStep === 1 && formFile.length === 0) {
      toast({
        title: "No form selected",
        description: "Please upload a form to proceed",
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
    console.log("Answer updated:", { questionId, answer });
    // Here you would typically update your state or make an API call
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Form Drafter AI</h1>
          <p className="text-gray-600">
            Easily fill your forms with data from your reference documents
          </p>
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
            <FileUpload
              title="Upload Your Form"
              description="Upload the form you want to fill (PDF, DOC, DOCX, or TXT)"
              onFilesSelected={setFormFile}
              maxFiles={1}
            />
          )}

          {currentStep === 2 && (
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
            <Button onClick={() => console.log("Generate final form")}>
              Generate Final Form
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;